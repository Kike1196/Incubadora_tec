import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class RolUsuario(str, enum.Enum):
    admin = "admin"
    estudiante = "estudiante"
    externo = "externo"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    especialidad = Column(String, nullable=False, default="", server_default="")
    correo = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    rol = Column(Enum(RolUsuario), nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Relación con proyectos
    proyectos = relationship("Proyecto", back_populates="propietario", cascade="all, delete-orphan")
