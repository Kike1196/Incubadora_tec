"""Datos locales de demostración. Ejecutar: python -m app.seed_demo [--apply]."""
import argparse
from datetime import datetime, timedelta, timezone, time
from uuid import NAMESPACE_URL, uuid5

from sqlalchemy import select

from app.auth.security import hash_password, verify_password
from app.database import SessionLocal
from app.models import Documento, HistorialEstatus, IntegranteProyecto, Proyecto, RolUsuario, Usuario, Evento, TipoEvento, Horario, Tarea, Avance


PASSWORD = "DemoTec2026!"


def demo_id(key):
    return uuid5(NAMESPACE_URL, "incubadora-local-demo/" + key)


def populate(db):
    now = datetime.now(timezone.utc)
    created = 0

    def add_missing(model, key, **values):
        nonlocal created
        row = db.get(model, key)
        if row is None:
            row = model(**values)
            db.add(row)
            db.flush()
            created += 1
        return row

    people = [
        ("admin", "Ana Martínez Demo", "admin"),
        ("ana", "Ana López Demo", "estudiante"),
        ("luis", "Luis García Demo", "estudiante"),
        ("maria", "María Torres Demo", "estudiante"),
        ("pedro", "Pedro Ramos Demo", "estudiante"),
        ("sofia", "Sofía Ruiz Demo", "estudiante"),
        ("externo", "Elena Sánchez Demo", "externo"),
    ]
    users = {}
    for alias, name, role in people:
        uid = demo_id("usuario/" + alias)
        email = alias + ".demo@example.com"
        existing = db.scalar(select(Usuario).where(Usuario.correo == email))
        if existing is not None and existing.id != uid:
            raise ValueError(f"El correo {email} ya pertenece a otra cuenta; no se modificó.")
        users[alias] = add_missing(
            Usuario, uid, id=uid, nombre=name, correo=email,
            password_hash=hash_password(PASSWORD), rol=RolUsuario(role),
            creado_en=(now - timedelta(days=40)).replace(tzinfo=None),
        )
        if not verify_password(PASSWORD, users[alias].password_hash):
            raise ValueError(f"La contraseña de {email} cambió; no se sobrescribirá.")

    stages = ["En revisión", "En incubación", "Completado"]
    projects = [
        ("ecopack", "EcoPack Demo", "ana", 0, 10, "Entregar modelo Canvas", ["ana", "luis"]),
        ("aquasmart", "AquaSmart Demo", "luis", 1, 50, "Validar prototipo con usuarios", ["luis", "maria"]),
        ("solar", "SolarTec Demo", "maria", 1, 80, "Preparar presentación final", ["maria", "pedro"]),
        ("agro", "AgroSensor Demo", "pedro", 2, 100, "Seguimiento posterior a incubación", ["pedro", "ana"]),
    ]
    for alias, name, owner, stage, progress, next_step, members in projects:
        pid = demo_id("proyecto/" + alias)
        add_missing(
            Proyecto, pid, id=pid, nombre=name, usuario_id=users[owner].id,
            descripcion=f"Proyecto de muestra {name} para probar el seguimiento de incubación.",
            especialidad="Ing. en Sistemas",
            estatus=stages[stage], progreso=progress, siguiente_paso=next_step,
            creado_en=(now - timedelta(days=30)).replace(tzinfo=None),
        )
        for member in members:
            key = (pid, users[member].id)
            add_missing(IntegranteProyecto, key, proyecto_id=pid, usuario_id=key[1],
                        creado_en=now - timedelta(days=30))
        for index in range(stage + 1):
            hid = demo_id(f"historial/{alias}/{index}")
            add_missing(
                HistorialEstatus, hid, id=hid, proyecto_id=pid,
                cambiado_por_id=users["admin"].id,
                estatus_anterior=stages[index - 1] if index else None,
                estatus_nuevo=stages[index], comentario="Registro ficticio para pruebas locales.",
                creado_en=now - timedelta(days=30 - index * 10),
            )
        did = demo_id("documento/" + alias)
        add_missing(
            Documento, did, id=did, proyecto_id=pid, subido_por_id=users[owner].id,
            nombre=f"Canvas {name}.pdf", tipo="application/pdf",
            bucket="incubadora-demo-sin-archivos", clave_archivo=f"demo/{alias}/canvas.pdf",
            creado_en=now - timedelta(days=29),
        )
        tid = demo_id("tarea/" + alias)
        add_missing(Tarea, tid, id=tid, project=pid, nombre="Preparar presentación del proyecto",
                    estatus="Pendiente", fecha=now.date())
        mid = demo_id("avance/" + alias)
        add_missing(Avance, mid, id=mid, project=pid, hito="Definición del problema",
                    notas="Se identificó el público objetivo y la propuesta de valor.", fecha=(now - timedelta(days=20)).date())
    add_missing(TipoEvento, "Taller", nombre="Taller")
    for index, (name, price) in enumerate((("Taller gratuito Demo", 0), ("Taller de pitch Demo", 350))):
        eid = demo_id(f"evento/{index}")
        add_missing(Evento, eid, id=eid, nombre=name, descripcion="Actividad local para probar inscripciones.",
                    tipo="Taller", fecha=(now + timedelta(days=7 + index)).date(), hora=time(10),
                    cupo=20, precio=price, modalidad="Presencial", estatus="Activo")
        sid = demo_id(f"horario/{index}")
        add_missing(Horario, sid, id=sid, fecha=(now + timedelta(days=3 + index)).date(),
                    inicio=time(9), fin=time(10), coordinador=users["admin"].id)
    return created


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Guardar los datos; por defecto se revierte la prueba.")
    args = parser.parse_args()
    with SessionLocal() as db:
        try:
            created = populate(db)
            # Verificar que una segunda carga no duplica registros.
            assert populate(db) == 0, "La carga no es repetible"
            if args.apply:
                db.commit()
                print(f"Datos guardados: {created} registros nuevos.")
            else:
                db.rollback()
                print(f"Validación correcta: {created} registros nuevos; prueba revertida sin guardar.")
        except Exception:
            db.rollback()
            raise


if __name__ == "__main__":
    main()
