"""Registro inicial en línea y vínculo con solicitud de ingreso."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "d42f19b8e210"
down_revision = "c31e8a09a124"
branch_labels = None
depends_on = None


def upgrade():
    for table in ("proyectos", "solicitudes"):
        op.add_column(table, sa.Column("producto_servicio", sa.String(), nullable=False, server_default=""))
    op.add_column("proyectos", sa.Column("telefono", sa.String(), nullable=False, server_default=""))
    op.add_column("proyectos", sa.Column("solicitud_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_proyecto_solicitud", "proyectos", "solicitudes", ["solicitud_id"], ["id"])
    op.create_unique_constraint("uq_proyecto_solicitud", "proyectos", ["solicitud_id"])


def downgrade():
    op.drop_constraint("uq_proyecto_solicitud", "proyectos", type_="unique")
    op.drop_constraint("fk_proyecto_solicitud", "proyectos", type_="foreignkey")
    op.drop_column("proyectos", "solicitud_id")
    op.drop_column("proyectos", "telefono")
    for table in ("proyectos", "solicitudes"):
        op.drop_column(table, "producto_servicio")
