
from sqlalchemy import select
from app.models import Usuario, RolUsuario, Proyecto, Horario, Tutoria, Solicitud
from app.initial_registration import validate_data, merge_files
from app.modules.compartido.registration_metadata import registration_metadata
from app.modules.compartido.services import (
    today,
    fail,
    admin,
    require_admin,
    record,
    registration_event,
)


def save_initial_registrations(db, user, key, values, row, payload, new, collection):
    if row and row.user != user.id and not admin(user):
        fail("No tienes acceso a este registro.", 403)
    if admin(user):
        if new:
            fail("El registro lo inicia el solicitante.", 403)
        # Los campos de coordinación se guardan separados de las respuestas.
        admin_values = {**values["administracion"], "identificacion.numero_solicitantes": row.datos.get("identificacion.numero_solicitantes", "1")}
        count = admin_values.pop("identificacion.numero_solicitantes")
        from app.initial_registration import fields
        allowed = dict(fields({"identificacion.numero_solicitantes": count}, True))
        if any(k not in allowed or len(v) > 5000 for k, v in admin_values.items()):
            fail("Campos de coordinación no válidos.", 422)
        values = {"administracion": admin_values}
    else:
        if row and row.estatus not in ("Borrador", "Correcciones solicitadas"):
            fail("El registro está enviado o aprobado; espera las observaciones de coordinación.", 409)
        if row and (db.scalar(select(Proyecto.id).where(Proyecto.registro_id == key)) or db.scalar(select(Solicitud.id).where(Solicitud.registro_id == key, Solicitud.estatus != "Rechazada"))):
            fail("Este registro ya fue enviado. Conserva sus datos originales.", 409)
        if values["administracion"]:
            fail("La revisión y autorización corresponden a coordinación.", 403)
        complete = values["estatus"] == "Pendiente"
        datos = validate_data({**values["datos"], **registration_metadata(db, row)}, complete)
        archivos = merge_files(datos, row.archivos if row else {}, values["archivos"], complete)
        next_status = "Pendiente" if complete else row.estatus if row else "Borrador"
        trail = list(row.historial or []) if row else []
        if not row or next_status != row.estatus:
            trail.append(registration_event(user, row.estatus if row else None, next_status, "Registro enviado a coordinación." if complete else "Borrador creado."))
        values = {"user": user.id, "datos": datos, "archivos": archivos, "estatus": next_status, "historial": trail}

    return row, values


def save_appointments(db, user, key, values, row, payload, new, collection):
    if user.rol == RolUsuario.externo:
        fail("Las tutorías requieren ser emprendedor.", 403)
    if new:
        record(db, Usuario, user.id, lock=True)
    slot = record(db, Horario, values["slot"], lock=True)
    if new:
        if values["estatus"] != "Confirmada" or slot.fecha < today():
            fail("Selecciona un horario vigente.")
        if db.scalar(select(Tutoria.id).where(Tutoria.slot == slot.id, Tutoria.estatus == "Confirmada").limit(1)):
            fail("El horario ya fue reservado.", 409)
        overlapping = db.scalar(select(Tutoria.id).join(Horario, Tutoria.slot == Horario.id).where(
            Tutoria.user == user.id, Tutoria.estatus == "Confirmada", Horario.fecha == slot.fecha,
            Horario.inicio < slot.fin, Horario.fin > slot.inicio).limit(1))
        if overlapping:
            fail("Ya tienes una tutoría que coincide con este horario.", 409)
        values["user"] = user.id
    else:
        if not admin(user) and row.user != user.id:
            fail("No puedes modificar esta tutoría.", 403)
        if values["slot"] != row.slot or row.estatus != "Confirmada" or values["estatus"] not in ("Cancelada", "Completado"):
            fail("La transición de esta tutoría no es válida.")
        if values["estatus"] == "Completado":
            require_admin(user)

    return row, values


def save_innovation(db, user, key, values, row, payload, new, collection):
    if user.rol == RolUsuario.externo or (row and not admin(user) and row.user != user.id):
        fail("No tienes acceso a esta propuesta.", 403)
    if not admin(user):
        values.update(etapa="Local", estatus="Borrador")
    values["fecha"] = row.datos["fecha"] if row else today().isoformat()
    values = {"datos": values, "user": row.user if row else user.id}

    return row, values
