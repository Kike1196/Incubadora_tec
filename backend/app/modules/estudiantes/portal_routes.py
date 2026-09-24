
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.auth.security import get_current_user
from app.database import get_db
from app.models import Usuario, RolUsuario, IntegranteProyecto
from app.modules.compartido.services import fail, project_access

router = APIRouter(prefix="/portal", tags=["estudiantes"])


@router.post("/projects/{key}/members")
def member(key: UUID, payload: dict, db: Session = Depends(get_db), user: Usuario = Depends(get_current_user)):
    project_access(db, user, key, owner_only=True)
    email = payload.get("correo", "")
    person = db.scalar(select(Usuario).where(Usuario.correo == str(email).strip().lower()))
    if not person or person.rol != RolUsuario.estudiante:
        fail("No hay un emprendedor registrado con ese correo.", 404)
    if not db.get(IntegranteProyecto, (key, person.id)):
        db.add(IntegranteProyecto(proyecto_id=key, usuario_id=person.id))
    db.commit()
    return {"added": True}
