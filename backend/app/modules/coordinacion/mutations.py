
from sqlalchemy import select, func
from app.auth.security import hash_password
from app.models import (
    Usuario,
    RolUsuario,
    Proyecto,
    IntegranteProyecto,
    TipoEvento,
    Inscripcion,
    Horario,
    Tutoria,
)
from app.modules.compartido.services import today, fail, require_admin, record


def save_users(db, user, key, values, row, payload, new, collection):
    require_admin(user)
    if key == user.id and values["rol"] != "admin":
        fail("No puedes quitarte tu propio acceso de coordinador.")
    if row and values["rol"] != "estudiante" and (db.scalar(select(Proyecto.id).where(Proyecto.usuario_id == key).limit(1)) or db.scalar(select(IntegranteProyecto.usuario_id).where(IntegranteProyecto.usuario_id == key).limit(1))):
        fail("El usuario tiene proyectos asociados; conserva su rol de emprendedor.")
    password = values.pop("password")
    if new and not password:
        fail("Indica una contraseña inicial de al menos 8 caracteres.")
    values["correo"] = values["correo"].lower()
    values["rol"] = RolUsuario(values["rol"])
    if password:
        values["password_hash"] = hash_password(password)

    return row, values


def save_events(db, user, key, values, row, payload, new, collection):
    require_admin(user)
    if not db.get(TipoEvento, values["tipo"]):
        fail("Selecciona un tipo de evento del catálogo.")
    count = db.scalar(select(func.count()).select_from(Inscripcion).where(Inscripcion.event == key, Inscripcion.estatus == "Confirmada"))
    if values["cupo"] < count:
        fail("El cupo no puede ser menor que las inscripciones confirmadas.")
    if row and count and values["precio"] != row.precio:
        fail("No se puede cambiar el precio con inscripciones confirmadas.")

    return row, values


def save_slots(db, user, key, values, row, payload, new, collection):
    require_admin(user)
    # Serializar la comprobación de solapamientos por coordinador.
    record(db, Usuario, user.id, lock=True)
    if row and row.coordinador != user.id:
        fail("Solo puedes modificar tus propios horarios.", 403)
    if values["fecha"] < today() or values["fin"] <= values["inicio"]:
        fail("Elige una fecha vigente y una hora final posterior al inicio.")
    overlap = db.scalar(select(Horario.id).where(Horario.id != key, Horario.coordinador == user.id, Horario.fecha == values["fecha"], Horario.inicio < values["fin"], Horario.fin > values["inicio"]).limit(1))
    if overlap:
        fail("El horario se superpone con otro bloque.", 409)
    if row and db.scalar(select(Tutoria.id).where(Tutoria.slot == key).limit(1)):
        fail("Este horario ya tiene tutorías; conserva su historial.")
    values["coordinador"] = user.id

    return row, values
