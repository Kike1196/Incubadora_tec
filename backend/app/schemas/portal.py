from datetime import date, time
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, StringConstraints, field_validator

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=160)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=3000)]
Status = Literal["Pendiente", "En revisión", "En proceso", "En incubación", "Completado"]


class ProjectInput(BaseModel):
    registro_id: UUID | None = None
    nombre: Name
    descripcion: str = Field(default="", max_length=3000)
    especialidad: str = Field(default="", max_length=160)
    comentario: str = Field(default="", max_length=2000)
    fecha: date
    progreso: int = Field(default=0, ge=0, le=100)
    estatus: Status = "Pendiente"
    siguiente_paso: str | None = Field(default=None, max_length=1000)
    file: dict | None = None
    producto_servicio: str = Field(default="", max_length=3000)
    telefono: str = Field(default="", pattern=r"^(?:[0-9+ ()-]{10,20})?$")


class UserInput(BaseModel):
    nombre: Name
    correo: EmailStr
    rol: Literal["admin", "estudiante", "externo"]
    especialidad: str = Field(default="", max_length=160)
    password: str | None = None

    @field_validator("password")
    @classmethod
    def password_length(cls, value):
        if value and (len(value) < 8 or len(value.encode()) > 72):
            raise ValueError("La contraseña debe tener al menos 8 caracteres y hasta 72 bytes.")
        return value


class MilestoneInput(BaseModel):
    project: UUID
    hito: Name
    notas: Description
    fecha: date
    progreso: int = Field(ge=0, le=100)


class TaskInput(BaseModel):
    project: UUID
    nombre: Name
    fecha: date
    estatus: Literal["Pendiente", "Completado"] = "Pendiente"


class EventInput(BaseModel):
    nombre: Name
    descripcion: Description
    tipo: Name
    fecha: date
    hora: time
    cupo: int = Field(ge=1, le=10000)
    precio: Decimal = Field(ge=0, le=100000, decimal_places=2)
    modalidad: Literal["Presencial", "En línea", "Híbrida"]
    estatus: Literal["Activo", "Pendiente", "Inactivo"]


class SlotInput(BaseModel):
    fecha: date
    inicio: time
    fin: time


class AppointmentInput(BaseModel):
    slot: UUID
    estatus: Literal["Confirmada", "Completado", "Cancelada"] = "Confirmada"


class ApplicationInput(BaseModel):
    registro_id: UUID | None = None
    nombre: Name
    descripcion: Description
    especialidad: str = Field(default="", max_length=160)
    producto_servicio: str = Field(default="", max_length=3000)
    telefono: str = Field(default="", pattern=r"^(?:[0-9+ ()-]{10,20})?$")
    estatus: Literal["En revisión", "Aprobada", "Rechazada"] = "En revisión"


class InnovationInput(BaseModel):
    nombre: Name
    equipo: Name
    lider: Name
    asesor: Name
    descripcion: Description
    modulo: Name
    categoria: Name
    etapa: Literal["Local", "Regional", "Nacional"] = "Local"
    estatus: Literal["Borrador", "En revisión", "Aprobada", "Rechazada"] = "Borrador"


class RegistrationInput(BaseModel):
    resultado: Literal["Pagado", "Rechazado"] | None = None


class InitialFormInput(BaseModel):
    datos: dict[str, str] = Field(default_factory=dict)
    administracion: dict[str, str] = Field(default_factory=dict)
    archivos: dict[str, dict | None] = Field(default_factory=dict)
    estatus: Literal["Borrador", "Pendiente"] = "Borrador"


class RegistrationReviewInput(BaseModel):
    estatus: Literal["En revisión", "Correcciones solicitadas", "Aprobado"]
    estatus_anterior: Literal["Pendiente", "En revisión"]
    observaciones: str = Field(default="", max_length=5000)
