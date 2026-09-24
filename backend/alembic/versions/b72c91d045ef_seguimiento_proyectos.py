"""Crear esquema base faltante y tablas de seguimiento.

La revisión anterior estaba vacía; algunas instalaciones ya tienen las
tablas base creadas por create_all. Se conservan esas tablas y sus datos.
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b72c91d045ef"
down_revision = "8881ea422f6a"
branch_labels = None
depends_on = None


def upgrade():
    existing = set() if context.is_offline_mode() else set(sa.inspect(op.get_bind()).get_table_names())
    if "usuarios" not in existing:
        role = postgresql.ENUM("admin", "estudiante", "externo", name="rolusuario", create_type=False)
        role.create(op.get_bind(), checkfirst=True)
        op.create_table("usuarios",
            sa.Column("id", sa.UUID(), primary_key=True),
            sa.Column("nombre", sa.String(), nullable=False),
            sa.Column("correo", sa.String(), nullable=False),
            sa.Column("password_hash", sa.String(), nullable=False),
            sa.Column("rol", role, nullable=False),
            sa.Column("creado_en", sa.DateTime()),
        )
        op.create_index("ix_usuarios_correo", "usuarios", ["correo"], unique=True)
    if "proyectos" not in existing:
        op.create_table("proyectos",
            sa.Column("id", sa.UUID(), primary_key=True),
            sa.Column("nombre", sa.String(), nullable=False),
            sa.Column("estatus", sa.String()),
            sa.Column("progreso", sa.Integer()),
            sa.Column("siguiente_paso", sa.String()),
            sa.Column("usuario_id", sa.UUID(), sa.ForeignKey("usuarios.id"), nullable=False),
            sa.Column("creado_en", sa.DateTime()),
        )
    op.create_table("integrantes_proyecto",
        sa.Column("proyecto_id", sa.UUID(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("usuario_id", sa.UUID(), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table("documentos",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("proyecto_id", sa.UUID(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subido_por_id", sa.UUID(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("bucket", sa.String(), nullable=False),
        sa.Column("clave_archivo", sa.String(), nullable=False),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("bucket", "clave_archivo", name="uq_documentos_objeto"),
    )
    op.create_index("ix_documentos_proyecto_id", "documentos", ["proyecto_id"])
    op.create_table("historial_estatus",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("proyecto_id", sa.UUID(), sa.ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cambiado_por_id", sa.UUID(), sa.ForeignKey("usuarios.id", ondelete="SET NULL")),
        sa.Column("estatus_anterior", sa.String()),
        sa.Column("estatus_nuevo", sa.String(), nullable=False),
        sa.Column("comentario", sa.Text()),
        sa.Column("creado_en", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_historial_estatus_proyecto_id", "historial_estatus", ["proyecto_id"])


def downgrade():
    op.drop_table("historial_estatus")
    op.drop_table("documentos")
    op.drop_table("integrantes_proyecto")
    # Las tablas base pueden ser anteriores a Alembic: conservar sus datos.
