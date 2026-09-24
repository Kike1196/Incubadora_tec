import uuid
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.usuario import RolUsuario


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=160)
    correo: EmailStr
    password: str = Field(min_length=8)
    rol: RolUsuario

    @field_validator("password")
    @classmethod
    def check_password(cls, value):
        if len(value.encode()) > 72:
            raise ValueError("La contraseña no puede superar 72 bytes.")
        return value


class UsuarioOut(BaseModel):
    id: uuid.UUID
    nombre: str
    correo: EmailStr
    rol: RolUsuario

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
