import re
from app.modules.compartido.registration_word import build_registration_word, WORD_MIME
import base64
from uuid import UUID
from fastapi import APIRouter, Depends, Response
from pydantic import ValidationError
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, defer
from app.auth.security import get_current_user
from app.config import settings
from app.database import get_db
from app.models import (
    Usuario,
    RolUsuario,
    Proyecto,
    IntegranteProyecto,
    Documento,
    HistorialEstatus,
    TipoEvento,
    Evento,
    Inscripcion,
    Pago,
    Horario,
    Tutoria,
    Solicitud,
    Innovacion,
    RegistroInicial,
)
from app.schemas.portal import RegistrationInput
from app.modules.compartido.services import (
    today,
    fail,
    admin,
    require_admin,
    record,
    project_access,
    serialized,
    MODELS,
    SCHEMAS,
    ROLES,
)
from app.modules.compartido.mutations import save_initial_registrations
from app.modules.coordinacion.mutations import save_users
from app.modules.estudiantes.mutations import save_projects
from app.modules.estudiantes.mutations import save_milestones
from app.modules.coordinacion.mutations import save_events
from app.modules.coordinacion.mutations import save_slots
from app.modules.compartido.mutations import save_appointments
from app.modules.externos.mutations import save_requests
from app.modules.compartido.mutations import save_innovation

SAVE_HANDLERS = {
    'initialRegistrations': save_initial_registrations,
    'users': save_users,
    'projects': save_projects,
    'milestones': save_milestones,
    'tasks': save_milestones,
    'events': save_events,
    'slots': save_slots,
    'appointments': save_appointments,
    'requests': save_requests,
    'innovation': save_innovation,
}

router = APIRouter(prefix="/portal", tags=["portal"])


@router.get("/state")
def state(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    projects_query = select(Proyecto)
    if not admin(user):
        projects_query = projects_query.where(or_(Proyecto.usuario_id == user.id,
            Proyecto.id.in_(select(IntegranteProyecto.proyecto_id).where(IntegranteProyecto.usuario_id == user.id))))
        if user.rol != RolUsuario.estudiante:
            projects_query = projects_query.where(False)
    projects = db.scalars(projects_query.order_by(Proyecto.creado_en)).all()
    pids = [p.id for p in projects]
    members = db.scalars(select(IntegranteProyecto).where(IntegranteProyecto.proyecto_id.in_(pids))).all()
    documents = db.scalars(select(Documento).options(defer(Documento.contenido)).where(Documento.proyecto_id.in_(pids))).all()
    # Solo incluir metadatos; los archivos se descargan con autorización independiente.
    file_ids = set(db.scalars(select(Documento.id).where(Documento.proyecto_id.in_(pids), Documento.contenido.is_not(None))).all())
    users_query = select(Usuario)
    visible = {user.id, *(p.usuario_id for p in projects), *(m.usuario_id for m in members)}
    if not admin(user):
        users_query = users_query.where(or_(Usuario.id.in_(visible), Usuario.rol == RolUsuario.admin))
    users = []
    for person in db.scalars(users_query.order_by(Usuario.nombre)):
        item = serialized(person)
        if not admin(user) and person.id != user.id:
            item.pop("correo", None)
        users.append(item)
    result = {"users": users, "projects": [], "roles": ROLES,
              "eventTypes": list(db.scalars(select(TipoEvento.nombre).order_by(TipoEvento.nombre))),
              "members": [serialized(m) for m in members],
              "documents": [{**serialized(d), "available": d.id in file_ids} for d in documents],
              "history": [serialized(h) for h in db.scalars(select(HistorialEstatus).where(HistorialEstatus.proyecto_id.in_(pids)).order_by(HistorialEstatus.creado_en))]}
    for p in projects:
        files = [d for d in documents if d.proyecto_id == p.id and d.id in file_ids]
        result["projects"].append({**serialized(p), "owner": str(p.usuario_id),
            "fecha": (p.creado_en.date() if p.creado_en else today()).isoformat(),
            "file": {"id": str(files[0].id), "name": files[0].nombre} if files else None})
    for collection, model in MODELS.items():
        if collection in ("users", "projects"):
            continue
        query = select(model)
        if collection in ("milestones", "tasks"):
            query = query.where(model.project.in_(pids))
        elif collection in ("registrations", "payments", "appointments", "requests", "innovation", "initialRegistrations") and not admin(user):
            query = query.where(model.user == user.id)
        result[collection] = [serialized(row) for row in db.scalars(query)]
    counts = dict(db.execute(select(Inscripcion.event, func.count()).where(Inscripcion.estatus == "Confirmada").group_by(Inscripcion.event)).all())
    for event in result["events"]:
        # occupied() en React añade las inscripciones visibles del usuario.
        visible_count = sum(r["event"] == event["id"] and r["estatus"] == "Confirmada" for r in result["registrations"])
        event["ocupados"] = counts.get(UUID(event["id"]), 0) - visible_count
    booked = set(db.scalars(select(Tutoria.slot).where(Tutoria.estatus == "Confirmada")))
    for slot in result["slots"]:
        slot["reservado"] = UUID(slot["id"]) in booked
    result["initialRegistrations"] = [{**r, "archivos": {key: {"name": item["name"]} for key, item in r["archivos"].items()}} for r in result["initialRegistrations"]]
    result["innovation"] = [{**r["datos"], "id": r["id"], "user": r["user"]} for r in result["innovation"]]
    return {"data": result, "user": serialized(user), "paymentsMode": "prueba" if settings.demo_payments_enabled else "deshabilitado"}



@router.put("/{collection}/{key}")
def save(collection: str, key: UUID, payload: dict,
         db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    if collection not in SCHEMAS:
        fail("Esta colección no se puede modificar.", 404)
    try:
        values = SCHEMAS[collection].model_validate(payload).model_dump()
    except ValidationError as error:
        fail("; ".join(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in error.errors()), 422)
    row = db.scalar(select(MODELS[collection]).where(MODELS[collection].id == key).with_for_update())
    new = row is None

    row, values = SAVE_HANDLERS[collection](db, user, key, values, row, payload, new, collection)

    if row is None:
        row = MODELS[collection](id=key)
        db.add(row)
    for name, value in values.items():
        setattr(row, name, value)
    db.commit()
    return {"id": str(key)}



@router.post("/events/{key}/register")
def register(key: UUID, payload: RegistrationInput, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    event = record(db, Evento, key, lock=True)
    if event.estatus != "Activo" or event.fecha < today():
        fail("Las inscripciones están cerradas.")
    if db.scalar(select(Inscripcion.id).where(Inscripcion.event == key, Inscripcion.user == user.id)):
        fail("Ya tienes una inscripción en este evento.", 409)
    count = db.scalar(select(func.count()).select_from(Inscripcion).where(Inscripcion.event == key, Inscripcion.estatus == "Confirmada"))
    if count >= event.cupo:
        fail("El evento ya no tiene cupo.", 409)
    if event.precio > 0:
        if not settings.demo_payments_enabled:
            fail("Los pagos aún no están habilitados.", 409)
        if payload.resultado not in ("Pagado", "Rechazado"):
            fail("Confirma el resultado del pago de prueba.")
        db.add(Pago(event=key, user=user.id, importe=event.precio, fecha=today(), estatus=payload.resultado, modo="prueba"))
        if payload.resultado == "Rechazado":
            db.commit()
            return {"confirmed": False}
    db.add(Inscripcion(event=key, user=user.id, estatus="Confirmada"))
    db.commit()
    return {"confirmed": True}



@router.delete("/{collection}/{key}")
def delete(collection: str, key: UUID, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    if collection not in ("users", "slots", "registrations"):
        fail("Esta colección no permite eliminar registros.", 404)
    row = record(db, MODELS[collection], key, lock=True)
    if collection == "users":
        require_admin(user)
        if row.id == user.id:
            fail("No puedes eliminar tu propia cuenta.")
        references = [(Proyecto, Proyecto.usuario_id), (IntegranteProyecto, IntegranteProyecto.usuario_id),
                      (Documento, Documento.subido_por_id), (HistorialEstatus, HistorialEstatus.cambiado_por_id),
                      (Inscripcion, Inscripcion.user), (Pago, Pago.user), (Horario, Horario.coordinador),
                      (Tutoria, Tutoria.user), (Solicitud, Solicitud.user), (Innovacion, Innovacion.user)]
        if any(db.scalar(select(func.count()).select_from(model).where(column == key)) for model, column in references):
            fail("El usuario tiene registros asociados; conserva su cuenta e historial.", 409)
    elif collection == "slots":
        require_admin(user)
        if row.coordinador != user.id:
            fail("Solo puedes eliminar tus horarios.", 403)
        if db.scalar(select(Tutoria.id).where(Tutoria.slot == key).limit(1)):
            fail("El horario tiene tutorías asociadas.", 409)
    else:
        if not admin(user) and row.user != user.id:
            fail("No puedes cancelar esta inscripción.", 403)
        record(db, Evento, row.event, lock=True)
        paid = db.scalars(select(Pago).where(Pago.event == row.event, Pago.user == row.user, Pago.estatus == "Pagado")).all()
        if any(payment.modo != "prueba" for payment in paid):
            fail("Se requiere resolver el reembolso antes de cancelar.", 409)
        for payment in paid:
            payment.estatus = "Reembolsado"
    db.delete(row)
    db.commit()
    return {"deleted": True}



@router.get("/documents/{key}/download")
def document(key: UUID, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    doc = record(db, Documento, key)
    project_access(db, user, doc.proyecto_id)
    if doc.contenido is None:
        fail("Este registro de ejemplo no tiene archivo adjunto.", 404)
    return Response(content=doc.contenido, media_type=doc.tipo,
                    headers={"Content-Disposition": "attachment", "X-Content-Type-Options": "nosniff"})



@router.get("/initial-registrations/{key}/files/{file_key}")
def registration_file(key: UUID, file_key: str, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    row = record(db, RegistroInicial, key)
    if row.user != user.id and not admin(user):
        fail("No tienes acceso al registro.", 403)
    item = row.archivos.get(file_key)
    if not item:
        fail("Anexo no encontrado.", 404)
    return Response(base64.b64decode(item["data"]), media_type=item["tipo"],
        headers={"Content-Disposition": "attachment", "X-Content-Type-Options": "nosniff"})


@router.get("/initial-registrations/{key}/download")
def download_registration(key: UUID, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    row = record(db, RegistroInicial, key)
    if row.user != user.id and not admin(user):
        fail("No tienes acceso al registro.", 403)
    if row.estatus != "Aprobado":
        fail("Coordinación debe aprobar el registro antes de descargar el formato Word.", 409)
    folio = re.sub(r"[^A-Za-z0-9_-]", "_", row.datos.get("identificacion.folio", ""))[:100] or str(key)
    return Response(build_registration_word(row), media_type=WORD_MIME, headers={
        "Content-Disposition": f'attachment; filename="registro-{folio}.docx"',
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    })
