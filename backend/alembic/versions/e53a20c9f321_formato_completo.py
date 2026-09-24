"""Formato institucional previo a la creación del proyecto."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
revision = "e53a20c9f321"
down_revision = "d42f19b8e210"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("registros_iniciales",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user", UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=False),
        sa.Column("datos", sa.JSON(), nullable=False),
        sa.Column("administracion", sa.JSON(), nullable=False),
        sa.Column("archivos", sa.JSON(), nullable=False),
        sa.Column("estatus", sa.String(), nullable=False))
    for table in ("proyectos", "solicitudes"):
        op.add_column(table, sa.Column("registro_id", UUID(as_uuid=True), nullable=True))
        op.create_foreign_key(f"fk_{table}_registro", table, "registros_iniciales", ["registro_id"], ["id"])
        op.create_unique_constraint(f"{table}_registro_id_key", table, ["registro_id"])


def downgrade():
    for table in ("proyectos", "solicitudes"):
        op.drop_constraint(f"{table}_registro_id_key", table, type_="unique")
        op.drop_constraint(f"fk_{table}_registro", table, type_="foreignkey")
        op.drop_column(table, "registro_id")
    op.drop_table("registros_iniciales")
