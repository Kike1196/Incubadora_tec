
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base

class Proyecto(Base):
    __tablename__ = "proyectos"
    __table_args__ = (UniqueConstraint("solicitud_id", name="uq_proyecto_solicitud"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registro_id = Column(UUID(as_uuid=True), ForeignKey("registros_iniciales.id"), nullable=True, unique=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=False, default="", server_default="")
    especialidad = Column(String, nullable=False, default="", server_default="")
    producto_servicio = Column(String, nullable=False, default="", server_default="")
    telefono = Column(String, nullable=False, default="", server_default="")
    solicitud_id = Column(UUID(as_uuid=True), ForeignKey("solicitudes.id"), nullable=True)
    comentario = Column(String, nullable=False, default="", server_default="")
    estatus = Column(String, default="En revisión")
    progreso = Column(Integer, default=0)
    siguiente_paso = Column(String, nullable=True)
    
    # Llave foránea que conecta con la tabla usuarios
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    
    creado_en = Column(DateTime, default=datetime.utcnow)

    # Relación bidireccional
    propietario = relationship("Usuario", back_populates="proyectos")
    integrantes = relationship("IntegranteProyecto", back_populates="proyecto", cascade="all, delete-orphan", passive_deletes=True)
    documentos = relationship("Documento", back_populates="proyecto", cascade="all, delete-orphan", passive_deletes=True)
    historial_estatus = relationship("HistorialEstatus", back_populates="proyecto", cascade="all, delete-orphan", passive_deletes=True, order_by="HistorialEstatus.creado_en")
