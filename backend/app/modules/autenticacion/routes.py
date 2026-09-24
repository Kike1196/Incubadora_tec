from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, LoginRequest, TokenResponse
from app.auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])



@router.post("/registro", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    if datos.rol == RolUsuario.admin:
        raise HTTPException(status_code=403, detail="Solo una coordinadora puede crear otra cuenta administrativa.")
    datos.correo = datos.correo.lower()
    datos.nombre = datos.nombre.strip()
    if not datos.nombre:
        raise HTTPException(status_code=422, detail="Escribe tu nombre.")
    existente = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ese correo ya está registrado")

    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=hash_password(datos.password),
        rol=datos.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario



@router.post("/login", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo.lower()).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    token = create_access_token({"sub": str(usuario.id), "rol": usuario.rol.value})
    return TokenResponse(access_token=token)
