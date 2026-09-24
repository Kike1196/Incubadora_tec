"""Fecha de elaboración y folio global, asignados por el servidor."""
import re

from sqlalchemy import select, text

from app.models import RegistroInicial
from app.modules.compartido.services import today


def registration_metadata(db, row):
    saved = row.datos if row else {}
    folio = saved.get("identificacion.folio", "").strip()
    if not folio:
        # Bloqueo global hasta commit/rollback: incluye estudiantes y externos.
        # La consulta posterior ve el último folio confirmado por otros procesos.
        db.execute(text("SELECT pg_advisory_xact_lock(73124, 1)"))
        highest = 0
        for existing in db.scalars(select(RegistroInicial.datos["identificacion.folio"].as_string())):
            # También continúa series históricas con prefijo, por ejemplo ITS-000123.
            match = re.search(r"([0-9]+)$", (existing or "").strip())
            if match:
                highest = max(highest, int(match.group(1)))
        folio = str(highest + 1).zfill(6)
    return {
        "identificacion.folio": folio,
        "identificacion.fecha": saved.get("identificacion.fecha") or today().isoformat(),
    }
