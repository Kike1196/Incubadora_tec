from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.modules.autenticacion import routes as auth
from app.modules.coordinacion import routes as admin, portal_routes as coordination
from app.modules.estudiantes import portal_routes as students
from app.modules.compartido import routes as portal
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
import app.models  # noqa: F401 — el esquema se administra con Alembic


app = FastAPI(title="Incubadora TecNM Saltillo — API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(portal.router)
app.include_router(coordination.router)
app.include_router(students.router)


@app.exception_handler(IntegrityError)
async def integrity_error(request, exc):
    return JSONResponse(status_code=409, content={"detail": "El registro ya existe o tiene datos asociados. Actualiza la página e inténtalo de nuevo."})


@app.get("/health")
def health():
    return {"status": "ok"}
