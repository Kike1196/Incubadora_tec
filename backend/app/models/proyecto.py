import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    estatus = Column(String, default="En revisión")
    progreso = Column(Integer, default=0)
    siguiente_paso = Column(String, nullable=True)
    
    # Llave foránea que conecta con la tabla usuarios
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Relación bidireccional
    propietario = relationship("Usuario", back_populates="proyectos")