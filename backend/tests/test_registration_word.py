"""Contenido completo y conservación de la plantilla institucional."""
from io import BytesIO
from types import SimpleNamespace
import unittest
from xml.etree import ElementTree as ET
from zipfile import ZipFile

from app.initial_registration import fields, SPEC
from app.modules.compartido.registration_word import build_registration_word, TEMPLATE, W


def sample_registration(count=2):
    data = {"identificacion.numero_solicitantes": str(count)}
    for key, field in list(fields(data)):
        kind = field["type"]
        data[key] = (field["options"][0] if kind == "select" else "2026-09-24" if kind == "date" else "2026" if kind == "number" else "Dato")
    data.update({"identificacion.numero_solicitantes": str(count), "identificacion.folio": "000127", "identificacion.plantel": "ITS", "identificacion.incubadora": "ITS", "empresa.nombre": "EcoPack", "descripcion.nombre": "EcoPack", "principal.primer_nombre": "Ana", "principal.segundo_nombre": "María", "principal.apellido_paterno": "López", "principal.apellido_materno": "Soto", "principal.correo1": "ana@example.com", "principal.firma": "Ana María López Soto", "descripcion.problema": "Reducir los residuos de envases de un solo uso.", "descripcion.producto": "Envases reutilizables para alimentos.", "descripcion.mercado": "Saltillo y su zona metropolitana.", "descripcion.diferenciacion": "Materiales regionales y diseño retornable.", "descripcion.ventajas": "Alianzas con productores de la región.", "descripcion.experiencia": "Experiencia en diseño y producción de envases.", "descripcion.experiencia_empresarial": "Venta local de productos sustentables.", "descripcion.objetivo": "Crear empleos y reducir los residuos."})
    for index in range(1, count):
        data[f"socio_{index}.primer_nombre"] = f"Socio {index}"
        data[f"socio_{index}.firma"] = f"Nombre del socio {index}"
    administrative = {key: "2026-09-24" if field["type"] == "date" else "10:00" if field["type"] == "time" else "Ana López" for key, field in fields(data, True)}
    administrative["cita.lugar"] = "Incubadora ITS"
    administrative["control.comentarios"] = "Información revisada y aprobada por coordinación."
    # Las firmas vacías no se fabrican a partir de los nombres.
    for key in administrative:
        if key.endswith("_firma"):
            administrative[key] = ""
    return SimpleNamespace(datos=data, administracion=administrative, historial=[], archivos={}, estatus="Aprobado")


class RegistrationWordTest(unittest.TestCase):
    def test_independent_reviews_match_all_six_original_tables(self):
        registration = sample_registration(2)
        for block in range(1, 7):
            for role in ('elaboro', 'reviso1', 'reviso2', 'autorizo'):
                registration.administracion[f'control.bloque_{block}.{role}_nombre'] = f'Bloque {block}: {role}'
        with ZipFile(BytesIO(build_registration_word(registration))) as result:
            root = ET.fromstring(result.read('word/document.xml'))
            tables = root.findall(f'{{{W}}}body/{{{W}}}tbl')
            for block, (index, offset) in enumerate(((2, 0), (6, 0), (12, 0), (15, 0), (18, 0), (21, 9)), 1):
                rows = tables[index].findall(f'{{{W}}}tr')
                cells = rows[offset + 1].findall(f'{{{W}}}tc')
                for column, role in enumerate(('elaboro', 'reviso1', 'reviso2', 'autorizo'), 1):
                    self.assertEqual(''.join(cells[column].itertext()), f'Bloque {block}: {role}')

    def test_partial_review_does_not_copy_legacy_signatures_to_other_blocks(self):
        registration = sample_registration(1)
        registration.administracion = {'control.reviso1_nombre': 'Revisión antigua', 'control.bloque_2.reviso1_nombre': 'Solo bloque 2'}
        with ZipFile(BytesIO(build_registration_word(registration))) as result:
            content = ''.join(ET.fromstring(result.read('word/document.xml')).itertext())
            self.assertEqual(content.count('Solo bloque 2'), 1)
            self.assertNotIn('Revisión antigua', content)

    def test_legacy_reviews_remain_exportable(self):
        registration = sample_registration(1)
        registration.administracion = {'control.reviso1_nombre': 'Revisión histórica'}
        with ZipFile(BytesIO(build_registration_word(registration))) as result:
            content = ''.join(ET.fromstring(result.read('word/document.xml')).itertext())
            self.assertEqual(content.count('Revisión histórica'), 6)

    def test_review_fields_are_admin_only_and_have_independent_keys(self):
        data = {'identificacion.numero_solicitantes': '1'}
        admin = dict(fields(data, True))
        applicant = dict(fields(data))
        keys = [key for key in admin if key.startswith('control.bloque_')]
        self.assertEqual(len(keys), 72)
        self.assertFalse(set(keys) & set(applicant))
        for block in range(1, 7):
            self.assertEqual(admin[f'control.bloque_{block}.autorizo_fecha']['type'], 'date')

    def test_complete_content_and_original_parts(self):
        registration = sample_registration(3)
        text_values = []
        for key, field in fields(registration.datos):
            if field["type"] in ("text", "textarea", "email", "tel") and key != "identificacion.numero_solicitantes":
                value = "Prueba " + key + " <&>"
                registration.datos[key] = value
                text_values.append(value)
        output = build_registration_word(registration)
        with ZipFile(BytesIO(output)) as result, ZipFile(TEMPLATE) as original:
            self.assertIsNone(result.testzip())
            self.assertEqual(result.namelist(), original.namelist())
            for name in original.namelist():
                if name not in ("word/document.xml", "word/settings.xml"):
                    self.assertEqual(result.read(name), original.read(name), name)
            root = ET.fromstring(result.read("word/document.xml"))
            content = "".join(root.itertext())
            for value in text_values:
                self.assertIn(value, content)
            self.assertNotIn("01/03/2016", content)
            self.assertIn("24/09/2026", content)
            self.assertIn("SOCIO 2", content)
            self.assertIn(registration.administracion["control.comentarios"], content)
            self.assertEqual(len(root.findall(f".//{{{W}}}sectPr")), 6)
            self.assertGreater(sum(node.get(f"{{{W}}}hRule") == "atLeast" for node in root.findall(f".//{{{W}}}trHeight")), 20)
            self.assertIn(b'updateFields', result.read("word/settings.xml"))

    def test_long_answers_are_not_truncated(self):
        registration = sample_registration(1)
        answer = "Respuesta extensa con acentos y signos <&>. " * 100
        registration.datos["descripcion.problema"] = answer
        with ZipFile(BytesIO(build_registration_word(registration))) as result:
            content = "".join(ET.fromstring(result.read("word/document.xml")).itertext())
            self.assertIn(answer, content)
            self.assertIn("NO APLICA", content)
