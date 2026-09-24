
from datetime import datetime, time
from sqlalchemy import select
from app.models import RolUsuario, Proyecto, IntegranteProyecto, HistorialEstatus
from app.modules.compartido.services import (
    fail,
    admin,
    project_access,
    validate_initial_registration,
    history,
    save_file,
    completed_registration,
    registration_summary,
)


def save_projects(db, user, key, values, row, payload, new, collection):
    if new or not admin(user):
        validate_initial_registration(values)
    if new:
        source = completed_registration(db, user.id, values.get("registro_id"))
        if db.scalar(select(Proyecto.id).where(Proyecto.registro_id == source.id)):
            fail("Este registro ya tiene un proyecto.", 409)
        values.update(registration_summary(source))
    elif "registro_id" not in payload:
        values.pop("registro_id", None)
    elif values["registro_id"] != row.registro_id:
        if row.registro_id is not None or admin(user):
            fail("No se puede reemplazar el registro de origen.", 409)
        source = completed_registration(db, user.id, values["registro_id"])
        values.update(registration_summary(source))
    if new:
        if user.rol != RolUsuario.estudiante:
            fail("Solo un emprendedor puede crear su proyecto.", 403)
        row = Proyecto(id=key, usuario_id=user.id, nombre=values["nombre"], estatus="Pendiente", progreso=0)
        db.add(row)
        db.flush()
        db.add(IntegranteProyecto(proyecto_id=key, usuario_id=user.id))
        db.add(HistorialEstatus(proyecto_id=key, cambiado_por_id=user.id, estatus_nuevo="Pendiente", comentario="Proyecto registrado"))
    else:
        project_access(db, user, key, owner_only=True)
    file = values.pop("file")
    has_file = "file" in payload
    row.creado_en = datetime.combine(values.pop("fecha"), time())
    status = values.pop("estatus")
    if admin(user):
        history(db, row, user, status, values["comentario"])
        if status == "Completado":
            values["progreso"] = 100
    else:
        for protected in ("progreso", "comentario", "siguiente_paso"):
            values.pop(protected, None)
    if has_file:
        save_file(db, row, user, file)

    return row, values


def save_milestones(db, user, key, values, row, payload, new, collection):
    if row and row.project != values["project"]:
        fail("No se puede mover un registro a otro proyecto.")
    project = project_access(db, user, values["project"])
    if collection == "milestones":
        progress = values.pop("progreso")
        if project.estatus == "Completado" and progress != 100:
            fail("Coordinación debe reabrir el proyecto antes de reducir su progreso.")
        project.progreso = progress

    return row, values
