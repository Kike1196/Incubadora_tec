from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, admin
from app.database import engine, Base
# IMPORTANTE: Debes importar los modelos para que SQLAlchemy sepa que existen
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto

# Esta línea le dice a Postgres que cree las tablas si no existen
Base.metadata.create_all(bind=engine)


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


@app.get("/health")
def health():
    return {"status": "ok"}