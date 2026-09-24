from fastapi import APIRouter, Depends
from app.auth.security import require_role
from app.models.usuario import RolUsuario
from app.models import Proyecto, Usuario, Evento
from app.database import get_db
from sqlalchemy import select, func
from sqlalchemy.orm import Session

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(RolUsuario.admin))],
)



@router.get("/dashboard")
def dashboard_resumen(db: Session = Depends(get_db)):
    return {
        "proyectos": db.scalar(select(func.count()).select_from(Proyecto)),
        "emprendedores": db.scalar(select(func.count()).select_from(Usuario).where(Usuario.rol == RolUsuario.estudiante)),
        "eventos_activos": db.scalar(select(func.count()).select_from(Evento).where(Evento.estatus == "Activo")),
        "progreso_promedio": float(db.scalar(select(func.avg(Proyecto.progreso))) or 0),
    }
