
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models import Usuario, Proyecto, TipoEvento, Solicitud, RegistroInicial
from app.schemas.portal import RegistrationReviewInput
from app.initial_registration import validate_data, merge_files
from app.modules.compartido.services import fail, require_admin, record, registration_event

router = APIRouter(prefix="/portal", tags=["coordinacion"])


@router.post("/event-types")
def event_type(payload: dict, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    require_admin(user)
    name = payload.get("nombre", "")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 60:
        fail("Escribe un nombre de hasta 60 caracteres.")
    name = name.strip()
    if db.scalar(select(TipoEvento).where(func.lower(TipoEvento.nombre) == name.lower())):
        fail("Ese tipo de evento ya existe.", 409)
    db.add(TipoEvento(nombre=name))
    db.commit()
    return {"nombre": name}



@router.post("/initial-registrations/{key}/review")
def review_registration(key: UUID, payload: RegistrationReviewInput,
                        db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    require_admin(user)
    row = record(db, RegistroInicial, key, lock=True)
    if row.estatus != payload.estatus_anterior:
        fail("El estado cambió. Actualiza los datos antes de continuar.", 409)
    transitions = {"Pendiente": {"En revisión"}, "En revisión": {"Aprobado", "Correcciones solicitadas"}}
    if payload.estatus not in transitions.get(row.estatus, set()):
        fail("La transición de revisión no es válida.", 409)
    comment = payload.observaciones.strip()
    if payload.estatus == "Correcciones solicitadas" and not comment:
        fail("Indica qué debe corregir el solicitante.", 422)
    if payload.estatus == "Correcciones solicitadas" and db.scalar(select(Proyecto.id).where(Proyecto.registro_id == key)):
        fail("El registro ya tiene un proyecto asociado; conserva sus datos originales.", 409)
    if payload.estatus == "Correcciones solicitadas":
        # Reabrir también las solicitudes antiguas que esperaban resolución.
        application = db.scalar(select(Solicitud).where(Solicitud.registro_id == key).with_for_update())
        if application and application.estatus == "En revisión":
            application.estatus = "Rechazada"
    if payload.estatus == "Aprobado":
        validate_data(row.datos, True)
        merge_files(row.datos, row.archivos, {}, True)
    row.historial = [*(row.historial or []), registration_event(user, row.estatus, payload.estatus, comment)]
    row.estatus = payload.estatus
    row.observaciones = comment
    db.commit()
    return {"id": str(key), "estatus": row.estatus}
