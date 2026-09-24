"""Validación del formato DGEST-MIdE-CI-F-01 y sus anexos."""
import base64
import binascii
import json
import re
from datetime import date, time
from decimal import Decimal, InvalidOperation
from pathlib import Path
from fastapi import HTTPException

SPEC = json.loads(Path(__file__).with_name("registration_fields.json").read_text(encoding="utf-8"))
CATEGORIES = ("convencionales", "discapacitados", "indigenas", "mujeres", "hombres", "total")


def invalid(message):
    raise HTTPException(422, message)


def participants(data):
    try:
        count = int(data.get("identificacion.numero_solicitantes", "1"))
    except ValueError:
        invalid("Indica un número entero de solicitantes.")
    if not 1 <= count <= 20:
        invalid("El número de solicitantes debe estar entre 1 y 20.")
    return ["principal"] + [f"socio_{i}" for i in range(1, count)]


def fields(data, administrative=False):
    for section in SPEC["sections"]:
        if section["admin"] != administrative:
            continue
        prefixes = participants(data)[1:] if section["id"] == "socio" else [section["id"]]
        for prefix in prefixes:
            for field in section["fields"]:
                yield f"{prefix}.{field['key']}", field
    if not administrative:
        for row in ("actuales", "generar", "total"):
            for col in CATEGORIES:
                yield f"empleos.{row}.{col}", dict(label=f"Empleos {row}: {col}", type="number", required=True)
    else:
        control = next(section for section in SPEC['sections'] if section['id'] == 'control')
        for block in range(1, 7):
            for field in control['fields']:
                if field['key'] != 'comentarios':
                    yield f"control.bloque_{block}.{field['key']}", field
        for person in participants(data):
            for doc in SPEC["documents"]:
                yield f"revision.{person}.{doc['key']}", dict(label="Revisó: " + doc["label"], type="text", required=False)
            yield f"revision.{person}.formulario", dict(label="Revisó: formulario de registro", type="text", required=False)


def validate_data(data, complete=False, administrative=False):
    allowed = dict(fields(data, administrative))
    if any(key not in allowed for key in data):
        invalid("El formato contiene campos no reconocidos.")
    clean = {}
    for key, field in allowed.items():
        value = data.get(key, "").strip()
        if len(value) > (5000 if field["type"] == "textarea" else 300):
            invalid(f"Texto demasiado largo: {field['label']}.")
        if complete and field.get("required") and not value:
            invalid(f"Completa: {field['label']}.")
        if value:
            kind = field["type"]
            if kind == "select" and value not in field["options"]:
                invalid(f"Selecciona una opción válida: {field['label']}.")
            if kind == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                invalid(f"Correo no válido: {field['label']}.")
            if kind in ("date", "time"):
                try:
                    (date if kind == "date" else time).fromisoformat(value)
                except ValueError:
                    invalid(f"Fecha u hora no válida: {field['label']}.")
            if kind == "number":
                try:
                    number = Decimal(value)
                    if not number.is_finite() or number < 0 or number > 1_000_000_000:
                        raise ValueError()
                    if "ingreso" not in key and number != number.to_integral_value():
                        raise ValueError()
                except (InvalidOperation, ValueError):
                    invalid(f"Cantidad no válida: {field['label']}.")
            if key == "empresa.nombre" and len(value) > 160:
                invalid("El nombre del proyecto admite hasta 160 caracteres.")
            if key.endswith(".especialidad") and len(value) > 160:
                invalid("La especialidad admite hasta 160 caracteres.")
            if kind == "tel" and not re.fullmatch(r"[0-9+ ()-]{10,20}", value):
                prefix = key.split(".")[0]
                owner = "Solicitante principal" if prefix == "principal" else f"Socio {prefix.removeprefix('socio_')}" if prefix.startswith("socio_") else next(section["title"] for section in SPEC["sections"] if section["id"] == prefix)
                invalid(f"{owner} — {field['label']}: usa entre 10 y 20 caracteres: números, espacios, +, paréntesis o guiones. Ejemplo: 8441234567. Si no tienes este teléfono, deja el campo vacío.")
            if key.endswith(".cp") and not re.fullmatch(r"\d{5}", value):
                invalid("El código postal debe contener cinco dígitos.")
        clean[key] = value
    if complete and not administrative:
        for col in CATEGORIES:
            if Decimal(clean[f"empleos.total.{col}"]) != Decimal(clean[f"empleos.actuales.{col}"]) + Decimal(clean[f"empleos.generar.{col}"]):
                invalid("El total de puestos debe corresponder a actuales más puestos por generar.")
        for person in participants(clean):
            if clean.get(f"{person}.discapacidad") == "Sí" and not clean.get(f"{person}.especifique"):
                invalid("Especifica la capacidad diferente del solicitante correspondiente.")
        if len(participants(clean)) > 1 and clean.get("descripcion.motivacion_socio") not in ("Necesidad", "Oportunidad", "Ambas"):
            invalid("Completa la motivación del socio.")
    return clean


def merge_files(data, existing, changes, complete=False):
    allowed = {f"{person}.{doc['key']}" for person in participants(data) for doc in SPEC["documents"]}
    result = {key: value for key, value in existing.items() if key in allowed}
    for key, item in changes.items():
        if key not in allowed:
            invalid("Anexo no reconocido.")
        if item is None:
            result.pop(key, None)
            continue
        name, raw = item.get("name"), item.get("data")
        if not isinstance(name, str) or not 1 <= len(name) <= 240 or not isinstance(raw, str) or len(raw) > 3_000_000:
            invalid("Anexo no válido. Máximo 2 MB por archivo.")
        try:
            content = base64.b64decode(raw.split(",")[-1], validate=True)
        except (ValueError, binascii.Error):
            invalid("No se pudo leer el anexo.")
        extension = name.lower().rsplit(".", 1)[-1]
        types = {"pdf": (b"%PDF-", "application/pdf"), "png": (b"\x89PNG\r\n\x1a\n", "image/png"), "jpg": (b"\xff\xd8\xff", "image/jpeg"), "jpeg": (b"\xff\xd8\xff", "image/jpeg")}
        if extension not in types or not content.startswith(types[extension][0]) or not 0 < len(content) <= 2 * 1024 * 1024:
            invalid("Adjunta un PDF, PNG o JPG válido de hasta 2 MB.")
        result[key] = dict(name=name, data=base64.b64encode(content).decode(), tipo=types[extension][1])
    if sum(len(item["data"]) for item in result.values()) > 28_000_000:
        invalid("Los anexos del registro no deben superar 20 MB en conjunto.")
    if complete and allowed - result.keys():
        invalid("Adjunta los requisitos de ingreso del responsable y de cada socio.")
    return result
