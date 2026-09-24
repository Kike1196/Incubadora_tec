"""Rellena una copia del Word institucional; no reconstruye la plantilla."""
from datetime import date
from io import BytesIO
from pathlib import Path
import re
from xml.dom import minidom
from zipfile import ZipFile

from app.initial_registration import participants, SPEC, CATEGORIES

TEMPLATE = Path(__file__).resolve().parents[2] / "templates" / "registro-original.docx"
WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

PERSON_CELLS = {
    "primer_nombre": (1, 1), "segundo_nombre": (1, 3),
    "apellido_paterno": (2, 1), "apellido_materno": (2, 3),
    "nacimiento": (3, 1), "estado_civil": (3, 3), "genero": (4, 1),
    "discapacidad": (4, 3), "especifique": (5, 0), "rfc": (6, 1),
    "curp": (6, 3), "calle": (7, 1), "exterior": (8, 1),
    "interior": (8, 3), "cp": (8, 5), "colonia": (9, 1),
    "municipio": (10, 1), "estado": (10, 3),
    "telefono_residencial": (11, 1), "telefono_celular": (11, 3),
    "ingreso_personal": (12, 1), "ingreso_familiar": (12, 3),
    "dependientes_consanguineos": (13, 2), "dependientes_otros": (13, 4),
    "dependientes_total": (13, 6), "correo1": (15, 1), "correo2": (16, 1),
    "estudios": (17, 1), "especialidad": (18, 1),
    "institucion": (19, 1), "egreso": (20, 1),
}
COMPANY_CELLS = {
    "nombre": (5, 1, 1), "rfc": (5, 2, 1), "calle": (5, 3, 1),
    "interior": (5, 4, 1), "exterior": (5, 4, 3), "cp": (5, 4, 5),
    "colonia": (8, 1, 1), "municipio": (8, 2, 1), "estado": (8, 2, 3),
    "telefono": (8, 3, 1), "fax": (8, 3, 3), "correo": (8, 4, 1), "web": (8, 4, 3),
}
DESCRIPTION_CELLS = {
    "nombre": (14, 2, 0), "problema": (14, 4, 0), "producto": (14, 6, 0),
    "mercado": (14, 8, 0), "diferenciacion": (14, 10, 0),
    "ventajas": (17, 3, 0), "experiencia": (17, 5, 0),
    "experiencia_empresarial": (17, 7, 0), "objetivo": (19, 8, 0),
}


def children(node, name):
    return [child for child in node.childNodes if child.nodeType == child.ELEMENT_NODE and child.tagName == "w:" + name]


def text_content(node):
    return "".join(child.data for text in node.getElementsByTagName("w:t") for child in text.childNodes if child.nodeType == child.TEXT_NODE)


def element(doc, name, **attributes):
    node = doc.createElementNS(W, "w:" + name)
    for key, value in attributes.items():
        node.setAttributeNS(W, "w:" + key, str(value))
    return node


def display_date(value):
    if not value:
        return ""
    try:
        return date.fromisoformat(value[:10]).strftime("%d/%m/%Y")
    except ValueError:
        return value


def set_text(container, value, size=20):
    """Conserva propiedades de celda y párrafo; solo sustituye sus respuestas."""
    doc = container.ownerDocument
    paragraphs = children(container, "p")
    paragraph = paragraphs[0] if paragraphs else element(doc, "p")
    if not paragraphs:
        container.appendChild(paragraph)
    properties = children(paragraph, "pPr")
    for child in list(paragraph.childNodes):
        if child not in properties:
            paragraph.removeChild(child)
    for extra in paragraphs[1:]:
        container.removeChild(extra)
    for prop in properties:
        for name in ("keepNext", "keepLines", "rPr", "ind"):
            for node in children(prop, name):
                prop.removeChild(node)
    if properties:
        properties[0].appendChild(element(doc, "ind", left=40, right=40, firstLine=0))
    run = element(doc, "r")
    props = element(doc, "rPr")
    props.appendChild(element(doc, "rFonts", ascii="Arial", hAnsi="Arial", cs="Arial"))
    props.appendChild(element(doc, "sz", val=size))
    props.appendChild(element(doc, "szCs", val=size))
    run.appendChild(props)
    # El texto de usuario se escapa como XML y nunca se interpreta como formato.
    clean = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", str(value or ""))
    for index, line in enumerate(clean.split("\n")):
        if index:
            run.appendChild(element(doc, "br"))
        text = element(doc, "t")
        text.setAttribute("xml:space", "preserve")
        text.appendChild(doc.createTextNode(line))
        run.appendChild(text)
    paragraph.appendChild(run)
    return paragraph


def cell(table, row, column):
    return children(children(table, "tr")[row], "tc")[column]


def fill(table, row, column, value, size=20):
    return set_text(cell(table, row, column), value, size)


def fill_person(table, prefix, data):
    for key, (row, column) in PERSON_CELLS.items():
        value = data.get(f"{prefix}.{key}", "")
        fill(table, row, column, display_date(value) if key in ("nacimiento", "egreso") else value)
    for choice, column in (("Tiempo completo", 2), ("Medio tiempo", 4), ("Desempleado", 6)):
        fill(table, 14, column, "X" if data.get(f"{prefix}.jornada") == choice else "")
    label = "Firma del solicitante principal:" if prefix == "principal" else "Firma del solicitante socio:"
    fill(table, 15, 2, label + "\n" + data.get(f"{prefix}.firma", ""))


def page_number(table):
    paragraph = fill(table, 3, 2, "Página: ", 16)
    doc = paragraph.ownerDocument
    def field_run():
        run = element(doc, "r")
        props = element(doc, "rPr")
        props.appendChild(element(doc, "sz", val=16))
        props.appendChild(element(doc, "szCs", val=16))
        run.appendChild(props)
        return run
    for instruction, cached in (("PAGE", "1"), ("NUMPAGES", "8")):
        if instruction == "NUMPAGES":
            run = field_run()
            text = element(doc, "t")
            text.setAttribute("xml:space", "preserve")
            text.appendChild(doc.createTextNode(" de "))
            run.appendChild(text)
            paragraph.appendChild(run)
        field = element(doc, "fldSimple", instr=instruction, dirty="true")
        run = field_run()
        text = element(doc, "t")
        text.appendChild(doc.createTextNode(cached))
        run.appendChild(text)
        field.appendChild(run)
        paragraph.appendChild(field)


def build_registration_word(registration):
    """Devuelve DOCX con todas las respuestas y las partes originales intactas."""
    data, administration = registration.datos, registration.administracion or {}
    people = participants(data)
    output = BytesIO()
    with ZipFile(TEMPLATE) as source:
        doc = minidom.parseString(source.read("word/document.xml"))
        body = doc.getElementsByTagName("w:body")[0]
        tables = children(body, "tbl")
        if len(tables) != 22:
            raise ValueError("La estructura de la plantilla Word cambió; revisa el mapa de campos.")
        emission = display_date(data.get("identificacion.fecha", ""))
        for index in (0, 3, 7, 13, 16, 19):
            fill(tables[index], 0, 2, "Fecha de emisión: " + emission, 16)
            page_number(tables[index])
        for field, row, column in (("fecha", 5, 1), ("plantel", 5, 3), ("folio", 5, 5), ("incubadora", 6, 1), ("numero_solicitantes", 6, 3)):
            fill(tables[0], row, column, emission if field == "fecha" else data.get("identificacion." + field, ""))
        fill_person(tables[1], "principal", data)
        partner_template = tables[4].cloneNode(True)
        fill_person(tables[4], "socio_1", data)
        if len(people) == 1:
            fill(tables[4], 0, 0, "PARTE III. DATOS GENERALES DEL SOLICITANTE SOCIO — NO APLICA")
        for prefix in people[2:]:
            partner = partner_template.cloneNode(True)
            for node in partner.getElementsByTagName("*"):
                for attribute in ("w14:paraId", "w14:textId"):
                    if node.hasAttribute(attribute):
                        node.removeAttribute(attribute)
            fill_person(partner, prefix, data)
            fill(partner, 0, 0, "PARTE III. DATOS GENERALES DEL SOLICITANTE SOCIO " + prefix.split("_")[1])
            paragraph = element(doc, "p")
            props = element(doc, "pPr")
            props.appendChild(element(doc, "pageBreakBefore"))
            paragraph.appendChild(props)
            body.insertBefore(paragraph, tables[5])
            body.insertBefore(partner, tables[5])
            body.insertBefore(element(doc, "p"), tables[5])
        for key, (table, row, column) in COMPANY_CELLS.items():
            fill(tables[table], row, column, data.get("empresa." + key, ""))
        for row, group in enumerate(("actuales", "generar", "total"), 2):
            for column, category in enumerate(CATEGORIES, 1):
                fill(tables[9], row, column, data.get(f"empleos.{group}.{category}", ""))
        for row, size in enumerate(("Micro Empresa", "Pequeña Empresa", "Mediana Empresa"), 2):
            for sector, column in (("Industria", 2), ("Comercio", 4), ("Servicios", 6)):
                fill(tables[10], row, column, "X" if data.get("estratificacion.tamano") == size and data.get("estratificacion.sector") == sector else "")
        for row, name in enumerate(("giro", "codigo_scian", "giro_scian"), 1):
            fill(tables[11], row, 1, data.get("clasificacion." + name, ""))
        for choice, column in (("Tradicional", 2), ("Intermedia", 4), ("Alta", 6)):
            fill(tables[11], 4, column, "X" if data.get("clasificacion.tecnologia") == choice else "")
        sales = {"0 a 50": (5, 2), "101 a 200": (5, 4), "51 a 100": (5, 6), "201 a 500": (6, 1), "501 a 1,000": (6, 3), "1,001 a 3,000": (6, 5), "3,001 a 6,000": (6, 7), "6,001 a 12,000": (7, 1), "12,001 a 30,000": (7, 3), "30,001 o más": (7, 5)}
        for choice, (row, column) in sales.items():
            fill(tables[11], row, column, "X" if data.get("clasificacion.ventas") == choice else "")
        for key, (table, row, column) in DESCRIPTION_CELLS.items():
            fill(tables[table], row, column, data.get("descripcion." + key, ""))
        for row, name in ((5, "motivacion"), (6, "motivacion_socio")):
            for choice, column in (("Necesidad", 2), ("Oportunidad", 4), ("Ambas", 6)):
                fill(tables[19], row, column, "X" if data.get("descripcion." + name) == choice else "")
            if data.get("descripcion." + name) == "No aplica":
                fill(tables[19], row, 0, "10.- ¿Y cuál es la motivación de tu socio? No aplica.")
        appointment = display_date(administration.get("cita.fecha", "")).split("/")
        for column in range(3):
            fill(tables[20], 1, column, appointment[column] if len(appointment) == 3 else "")
        fill(tables[20], 1, 3, administration.get("cita.hora", ""))
        fill(tables[20], 1, 4, administration.get("cita.lugar", ""))
        # La columna original Revisó incluye cada socio, sin omitir participantes.
        for row, key in enumerate([item["key"] for item in SPEC["documents"]] + ["formulario"], 1):
            reviews = []
            for prefix in people:
                value = administration.get(f"revision.{prefix}.{key}", "")
                if value:
                    label = "Principal" if prefix == "principal" else "Socio " + prefix.split("_")[1]
                    reviews.append(label + ": " + value)
            fill(tables[21], row, 1, "\n".join(reviews), 18)
        for column, label in enumerate(("Elaboró", "Revisó", "Revisó", "Autorizó"), 1):
            fill(tables[21], 9, column, label, 16)
        separate_reviews = any(key.startswith('control.bloque_') for key in administration)
        for block, (table, offset) in enumerate([(tables[i], 0) for i in (2, 6, 12, 15, 18)] + [(tables[21], 9)], 1):
            for column, role in enumerate(("elaboro", "reviso1", "reviso2", "autorizo"), 1):
                for row, attribute in enumerate(("nombre", "firma", "fecha"), 1):
                    prefix = f"control.bloque_{block}" if separate_reviews else "control"
                    value = administration.get(f"{prefix}.{role}_{attribute}", "")
                    fill(table, offset + row, column, display_date(value) if attribute == "fecha" else value, 18)
        for paragraph in children(body, "p"):
            if text_content(paragraph).strip() == "Comentarios:":
                # Reutiliza el párrafo original de comentarios, sin otra sección.
                wrapper = element(doc, "tc")
                body.replaceChild(wrapper, paragraph)
                wrapper.appendChild(paragraph)
                set_text(wrapper, "Comentarios:\n" + administration.get("control.comentarios", ""))
                wrapper.removeChild(paragraph)
                body.replaceChild(paragraph, wrapper)
        # El .doc impreso oculta el espaciado heredado mediante alturas exactas.
        # Espaciado explícito conserva la densidad original al permitir crecer filas.
        fixed_headers = {row for index in (0, 3, 7, 13, 16, 19) for row in children(tables[index], "tr")[:4]}
        for table in children(body, "tbl"):
            for paragraph in table.getElementsByTagName("w:p"):
                ancestor = paragraph.parentNode
                while ancestor is not None and ancestor.nodeName != "w:tr":
                    ancestor = ancestor.parentNode
                if ancestor in fixed_headers:
                    continue  # Conserva anclajes y geometría de los logos originales.
                properties = children(paragraph, "pPr")
                prop = properties[0] if properties else element(doc, "pPr")
                if not properties:
                    paragraph.insertBefore(prop, paragraph.firstChild)
                for old in children(prop, "spacing"):
                    prop.removeChild(old)
                prop.appendChild(element(doc, "spacing", before=0, after=0, line=240, lineRule="auto"))
        # Las alturas exactas del formulario impreso recortan respuestas largas.
        for height in doc.getElementsByTagName("w:trHeight"):
            if height.parentNode.parentNode not in fixed_headers:
                height.setAttributeNS(W, "w:hRule", "atLeast")
        for node in list(doc.getElementsByTagName("w:cantSplit")):
            node.parentNode.removeChild(node)
        settings = minidom.parseString(source.read("word/settings.xml"))
        updates = settings.getElementsByTagName("w:updateFields")
        update = updates[0] if updates else element(settings, "updateFields")
        update.setAttributeNS(W, "w:val", "true")
        if not updates:
            settings.documentElement.appendChild(update)
        replacements = {"word/document.xml": doc.toxml(encoding="UTF-8"), "word/settings.xml": settings.toxml(encoding="UTF-8")}
        with ZipFile(output, "w") as destination:
            for part in source.infolist():
                destination.writestr(part, replacements.get(part.filename, source.read(part.filename)))
    return output.getvalue()
