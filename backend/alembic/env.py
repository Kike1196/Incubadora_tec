import logging
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 1. Importar la configuración de tu app para sacar la URL de Postgres
from app.config import settings
# 2. Importar el Base y tus modelos para que Alembic los pueda leer
from app.database import Base
import app.models  # noqa: F401 — registra todos los modelos

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Asignar la metadata de tus modelos
target_metadata = Base.metadata

# 4. Inyectar dinámicamente la URL de tu base de datos desde el config.py
config.set_main_option("sqlalchemy.url", settings.database_url)

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
