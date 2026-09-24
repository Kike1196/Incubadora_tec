"""Reglas y utilidades utilizadas por varios actores."""
import base64
import binascii
from datetime import date, datetime, time
from decimal import Decimal
from uuid import UUID, uuid4
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from sqlalchemy import select
from app.models import (
    Usuario,
    RolUsuario,
    Proyecto,
    IntegranteProyecto,
    Documento,
    HistorialEstatus,
    Avance,
    Tarea,
    Evento,
    Inscripcion,
    Pago,
    Horario,
    Tutoria,
    Solicitud,
    Innovacion,
    RegistroInicial,
)
from app.schemas.portal import (
    ProjectInput,
    UserInput,
    MilestoneInput,
    TaskInput,
    EventInput,
    SlotInput,
    AppointmentInput,
    ApplicationInput,
    InnovationInput,
    InitialFormInput,
)
from app.initial_registration import validate_data, merge_files


MODELS = {"initialRegistrations": RegistroInicial, "users": Usuario, "projects": Proyecto, "milestones": Avance,
          "tasks": Tarea, "events": Evento, "registrations": Inscripcion,
          "payments": Pago, "slots": Horario, "appointments": Tutoria,
          "requests": Solicitud, "innovation": Innovacion}


SCHEMAS = {"initialRegistrations": InitialFormInput, "users": UserInput, "projects": ProjectInput, "milestones": MilestoneInput,
           "tasks": TaskInput, "events": EventInput, "slots": SlotInput,
           "appointments": AppointmentInput, "requests": ApplicationInput, "innovation": InnovationInput}


ROLES = [
    {"id": "admin", "nombre": "Coordinador", "descripcion": "Gestiona la comunidad y revisa proyectos", "permisos": "Gestión de la incubadora"},
    {"id": "estudiante", "nombre": "Emprendedor", "descripcion": "Gestiona sus proyectos y participa en actividades", "permisos": "Proyectos propios e integrantes"},
    {"id": "externo", "nombre": "Externo", "descripcion": "Participa en eventos y solicita ingreso", "permisos": "Eventos y solicitud propia"},
]



def today():
    return datetime.now(ZoneInfo("America/Mexico_City")).date()



def fail(message, status=400):
    raise HTTPException(status_code=status, detail=message)



def admin(user):
    return user.rol == RolUsuario.admin



def require_admin(user):
    if not admin(user):
        fail("Esta acción requiere el rol de coordinador.", 403)



def record(db, model, key, lock=False):
    row = db.scalar(select(model).where(model.id == key).with_for_update()) if lock else db.get(model, key)
    if row is None:
        fail("Registro no encontrado.", 404)
    return row



def project_access(db, user, key, owner_only=False):
    project = record(db, Proyecto, key, lock=True)
    member = db.get(IntegranteProyecto, (key, user.id))
    if not admin(user) and (user.rol != RolUsuario.estudiante or (project.usuario_id != user.id and (owner_only or not member))):
        fail("No tienes acceso a este proyecto.", 403)
    return project



def encode(value):
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, time):
        return value.strftime("%H:%M")
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value



def serialized(row):
    return {c.name: encode(getattr(row, c.name)) for c in row.__table__.columns
            if c.name not in ("password_hash", "contenido")}



def validate_initial_registration(values):
    for field, label in (("nombre", "nombre del proyecto"), ("descripcion", "problema o necesidad"), ("producto_servicio", "producto o servicio")):
        if not values.get(field, "").strip():
            fail(f"Completa el registro inicial: {label}.", 422)
        values[field] = values[field].strip()



def history(db, project, user, status, comment=""):
    if project.estatus != status:
        db.add(HistorialEstatus(proyecto_id=project.id, cambiado_por_id=user.id,
            estatus_anterior=project.estatus, estatus_nuevo=status, comentario=comment))
        project.estatus = status



def save_file(db, project, user, file):
    if file and "data" not in file:
        try:
            existing = db.get(Documento, UUID(file["id"])) if file.get("id") else None
        except (ValueError, TypeError, AttributeError):
            fail("El identificador del archivo no es válido.")
        if not existing or existing.proyecto_id != project.id:
            fail("El adjunto no pertenece a este proyecto.")
        return
    if file:
        name = file.get("name", "")
        if not isinstance(name, str) or len(name) > 240 or name.lower().split(".")[-1] not in ("pdf", "doc", "docx"):
            fail("Adjunta un PDF, DOC o DOCX de hasta 5 MB.")
        try:
            raw = file["data"]
            if not isinstance(raw, str) or len(raw) > 7 * 1024 * 1024:
                fail("El archivo supera 5 MB.")
            content = base64.b64decode(raw.split(",", 1)[1], validate=True)
        except (KeyError, IndexError, ValueError, binascii.Error):
            fail("Archivo no válido.")
        if not content or len(content) > 5 * 1024 * 1024:
            fail("El archivo está vacío o supera 5 MB.")
        ext = name.lower().split(".")[-1]
        signatures = {"pdf": b"%PDF-", "doc": b"\xd0\xcf\x11\xe0", "docx": b"PK"}
        if not content.startswith(signatures[ext]):
            fail("El contenido no corresponde al formato indicado.")
    for previous in db.scalars(select(Documento).where(Documento.proyecto_id == project.id, Documento.bucket == "postgres-local")):
        db.delete(previous)
    if file:
        db.add(Documento(proyecto_id=project.id, subido_por_id=user.id, nombre=name,
            tipo={"pdf": "application/pdf", "doc": "application/msword", "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}[ext],
            bucket="postgres-local", clave_archivo=str(uuid4()), contenido=content))



def completed_registration(db, owner, key):
    if key is None:
        fail("Primero completa y guarda el formato de registro DGEST-MIdE-CI-F-01.", 422)
    registration = record(db, RegistroInicial, key, lock=True)
    if registration.user != owner:
        fail("El registro pertenece a otro solicitante.", 403)
    if registration.estatus != "Aprobado":
        fail("Coordinación debe revisar y aprobar el registro antes de crear el proyecto.", 422)
    validate_data(registration.datos, True)
    merge_files(registration.datos, registration.archivos, {}, True)
    return registration



def registration_summary(registration):
    data = registration.datos
    return dict(nombre=data["empresa.nombre"], descripcion=data["descripcion.problema"][:3000],
        producto_servicio=data["descripcion.producto"][:3000],
        especialidad=data.get("principal.especialidad", "")[:160],
        telefono=data.get("principal.telefono_celular", ""))



def registration_event(user, previous, status, comment):
    return {"anterior": previous, "estatus": status, "observaciones": comment,
            "usuario_id": str(user.id), "nombre": user.nombre,
            "fecha": datetime.now(ZoneInfo("UTC")).isoformat()}
