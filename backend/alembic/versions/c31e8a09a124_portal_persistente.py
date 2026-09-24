"""Persistencia de los módulos del portal, sin eliminar datos previos."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "c31e8a09a124"
down_revision = "b72c91d045ef"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("usuarios", sa.Column("especialidad", sa.String(), nullable=False, server_default=""))
    for name in ("descripcion", "especialidad", "comentario"):
        op.add_column("proyectos", sa.Column(name, sa.String(), nullable=False, server_default=""))
    op.add_column("documentos", sa.Column("contenido", sa.LargeBinary()))

    def ident():
        return sa.Column("id", UUID(as_uuid=True), primary_key=True)

    def fk(name, table, **kw):
        return sa.Column(name, UUID(as_uuid=True), sa.ForeignKey(table + ".id", **kw), nullable=False)

    def string(name):
        return sa.Column(name, sa.String(), nullable=False)

    op.create_table("avances", ident(), fk("project", "proyectos", ondelete="CASCADE"), string("hito"), string("notas"), sa.Column("fecha", sa.Date(), nullable=False))
    op.create_table("tareas", ident(), fk("project", "proyectos", ondelete="CASCADE"), string("nombre"), string("estatus"), sa.Column("fecha", sa.Date(), nullable=False))
    op.create_table("tipos_evento", sa.Column("nombre", sa.String(), primary_key=True))
    op.bulk_insert(sa.table("tipos_evento", sa.column("nombre", sa.String())), [{"nombre": n} for n in ["Taller", "Feria", "Capacitación", "Bootcamp"]])
    op.create_table("eventos", ident(), string("nombre"), string("descripcion"), sa.Column("tipo", sa.String(), sa.ForeignKey("tipos_evento.nombre"), nullable=False), sa.Column("fecha", sa.Date(), nullable=False), sa.Column("hora", sa.Time(), nullable=False), sa.Column("cupo", sa.Integer(), nullable=False), sa.Column("precio", sa.Numeric(12, 2), nullable=False), string("modalidad"), string("estatus"))
    op.create_table("inscripciones", ident(), fk("event", "eventos"), fk("user", "usuarios"), string("estatus"), sa.UniqueConstraint("event", "user", name="uq_inscripcion_evento_usuario"))
    op.create_table("pagos", ident(), fk("event", "eventos"), fk("user", "usuarios"), sa.Column("importe", sa.Numeric(12, 2), nullable=False), string("estatus"), sa.Column("fecha", sa.Date(), nullable=False), sa.Column("modo", sa.String(), nullable=False, server_default="prueba"))
    op.create_table("horarios", ident(), sa.Column("fecha", sa.Date(), nullable=False), sa.Column("inicio", sa.Time(), nullable=False), sa.Column("fin", sa.Time(), nullable=False), fk("coordinador", "usuarios"))
    op.create_table("tutorias", ident(), fk("slot", "horarios"), fk("user", "usuarios"), string("estatus"))
    op.create_table("solicitudes", ident(), sa.Column("user", UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=False, unique=True), string("nombre"), string("descripcion"), string("especialidad"), string("telefono"), sa.Column("fecha", sa.Date(), nullable=False), string("estatus"))
    op.create_table("innovacion", ident(), fk("user", "usuarios"), sa.Column("datos", sa.JSON(), nullable=False))


def downgrade():
    for name in ("innovacion", "solicitudes", "tutorias", "horarios", "pagos", "inscripciones", "eventos", "tipos_evento", "tareas", "avances"):
        op.drop_table(name)
    op.drop_column("documentos", "contenido")
    for name in ("descripcion", "especialidad", "comentario"):
        op.drop_column("proyectos", name)
    op.drop_column("usuarios", "especialidad")
