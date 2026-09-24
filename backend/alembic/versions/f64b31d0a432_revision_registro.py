"""Revisión administrativa del registro antes de crear proyectos."""
from alembic import op
import sqlalchemy as sa
revision = "f64b31d0a432"
down_revision = "e53a20c9f321"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("registros_iniciales", sa.Column("observaciones", sa.String(), nullable=False, server_default=""))
    op.add_column("registros_iniciales", sa.Column("historial", sa.JSON(), nullable=False, server_default="[]"))
    # Completar la captura no constituye aprobación administrativa.
    op.execute("UPDATE registros_iniciales SET estatus = 'Pendiente' WHERE estatus = 'Completo'")


def downgrade():
    op.execute("UPDATE registros_iniciales SET estatus = 'Completo' WHERE estatus IN ('Pendiente', 'En revisión', 'Aprobado')")
    op.execute("UPDATE registros_iniciales SET estatus = 'Borrador' WHERE estatus = 'Correcciones solicitadas'")
    op.drop_column("registros_iniciales", "historial")
    op.drop_column("registros_iniciales", "observaciones")
