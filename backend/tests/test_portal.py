"""Flujos HTTP contra PostgreSQL temporal; no modifica la BD de desarrollo."""
import base64
from io import BytesIO
from zipfile import ZipFile
from xml.etree import ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import UUID, uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session
from app.auth.security import hash_password
from app.config import settings
from app.models import Usuario, RolUsuario


class PortalTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.name = "test_portal_" + uuid4().hex
        cls.admin_engine = create_engine(settings.database_url, isolation_level="AUTOCOMMIT")
        with cls.admin_engine.connect() as connection:
            connection.execute(text(f'CREATE DATABASE "{cls.name}"'))
        cls.addClassCleanup(cls.drop_database)
        cls.url = make_url(settings.database_url).set(database=cls.name)
        cls.env = dict(os.environ, DATABASE_URL=cls.url.render_as_string(hide_password=False), DEMO_PAYMENTS_ENABLED="true")
        subprocess.run(["alembic", "upgrade", "head"], env=cls.env, check=True, capture_output=True)
        engine = create_engine(cls.url)
        with Session(engine) as db:
            db.add(Usuario(nombre="Coordinadora", correo="admin@example.com", rol=RolUsuario.admin, password_hash=hash_password("TestPass2026!")))
            db.commit()
        engine.dispose()
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        cls.base = f"http://127.0.0.1:{port}"
        cls.log = tempfile.TemporaryFile(mode="w+")
        cls.server = subprocess.Popen([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)], env=cls.env, stdout=cls.log, stderr=cls.log)
        cls.addClassCleanup(cls.stop_server)
        for _ in range(100):
            try:
                with urlopen(cls.base + "/health", timeout=1):
                    break
            except OSError:
                if cls.server.poll() is not None:
                    cls.log.seek(0)
                    raise RuntimeError(cls.log.read())
                time.sleep(0.1)
        else:
            raise RuntimeError("La API de pruebas no inició")

    @classmethod
    def stop_server(cls):
        cls.server.terminate()
        cls.server.wait(timeout=10)
        cls.log.close()

    @classmethod
    def drop_database(cls):
        with cls.admin_engine.connect() as connection:
            connection.execute(text(f'DROP DATABASE "{cls.name}" WITH (FORCE)'))
        cls.admin_engine.dispose()

    def request(self, method, path, payload=None, token=None, status=200, binary=False):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        req = Request(self.base + path, data=json.dumps(payload).encode() if payload is not None else None, headers=headers, method=method)
        try:
            response = urlopen(req, timeout=20)
        except HTTPError as error:
            response = error
        if status == 200 and path.startswith("/portal/initial-registrations/") and path.endswith("/download"):
            self.assertEqual(response.headers.get_content_type(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            self.assertIn('.docx"', response.headers["Content-Disposition"])
            self.assertIn("no-store", response.headers["Cache-Control"])
        content = response.read()
        self.assertEqual(response.status, status, f"{method} {path}: {content[:1000]!r}")
        return content if binary else json.loads(content)

    def login(self, email):
        return self.request("POST", "/auth/login", {"correo": email, "password": "TestPass2026!"})["access_token"]

    def create_user(self, alias, role="estudiante"):
        return self.request("POST", "/auth/registro", {"nombre": alias, "correo": f"{alias}@example.com", "password": "TestPass2026!", "rol": role}, status=201)

    def initial_form(self, token, project):
        from app.initial_registration import fields, SPEC
        data = {"identificacion.numero_solicitantes": "1"}
        for key, field in list(fields(data)):
            if not field.get("required"):
                continue
            kind = field["type"]
            data[key] = (field["options"][0] if kind == "select" else "2026-01-01" if kind == "date" else "test@example.com" if kind == "email" else "0" if kind == "number" else "Texto de prueba")
        data.update({"identificacion.numero_solicitantes": "1", "principal.discapacidad": "No", "principal.cp": "25000", "empresa.nombre": project["nombre"], "descripcion.problema": project["descripcion"], "descripcion.producto": project["producto_servicio"]})
        files = {"principal." + doc["key"]: {"name": doc["key"] + ".pdf", "data": base64.b64encode(b"%PDF-1.4 test").decode()} for doc in SPEC["documents"]}
        key = str(uuid4())
        payload = {"datos": data, "archivos": files, "estatus": "Borrador"}
        self.request("PUT", f"/portal/initialRegistrations/{key}", {"datos": data, "estatus": "Pendiente"}, token, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "administracion": {"control.autorizo_nombre": "Fraude"}}, token, status=403)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "administracion": {"control.bloque_1.autorizo_nombre": "Fraude"}}, token, status=403)
        self.request("PUT", f"/portal/initialRegistrations/{key}", payload, token)
        self.request("GET", f"/portal/initial-registrations/{key}/download", token=token, status=409)
        self.request("GET", f"/portal/initial-registrations/{key}/download", status=401)
        self.request("PUT", f"/portal/projects/{uuid4()}", {**project, "fecha": date.today().isoformat(), "registro_id": key}, token, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "estatus": "Pendiente", "datos": {**data, "descripcion.mercado": " "}}, token, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "estatus": "Pendiente"}, token)
        self.request("PUT", f"/portal/projects/{uuid4()}", {**project, "fecha": date.today().isoformat(), "registro_id": key}, token, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "estatus": "Aprobado"}, token, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", payload, token, status=409)
        coordinator = self.login("admin@example.com")
        review = f"/portal/initial-registrations/{key}/review"
        self.request("POST", review, {"estatus": "En revisión", "estatus_anterior": "Pendiente"}, token, status=403)
        self.request("POST", review, {"estatus": "Aprobado", "estatus_anterior": "Pendiente"}, coordinator, status=409)
        self.request("POST", review, {"estatus": "En revisión", "estatus_anterior": "Pendiente"}, coordinator)
        self.request("POST", review, {"estatus": "En revisión", "estatus_anterior": "Pendiente"}, coordinator, status=409)
        self.request("POST", review, {"estatus": "Correcciones solicitadas", "estatus_anterior": "En revisión", "observaciones": " "}, coordinator, status=422)
        self.request("POST", review, {"estatus": "Correcciones solicitadas", "estatus_anterior": "En revisión", "observaciones": "Aclara el alcance del mercado."}, coordinator)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "archivos": {}}, token)
        corrected = next(r for r in self.request("GET", "/portal/state", token=token)["data"]["initialRegistrations"] if r["id"] == key)
        self.assertEqual(corrected["estatus"], "Correcciones solicitadas")
        self.assertEqual(corrected["observaciones"], "Aclara el alcance del mercado.")
        self.request("PUT", f"/portal/initialRegistrations/{key}", {**payload, "archivos": {}, "estatus": "Pendiente"}, token)
        self.request("POST", review, {"estatus": "En revisión", "estatus_anterior": "Pendiente"}, coordinator)
        self.request("POST", review, {"estatus": "Aprobado", "estatus_anterior": "En revisión", "observaciones": "Datos y anexos verificados."}, coordinator)
        self.request("POST", review, {"estatus": "Aprobado", "estatus_anterior": "En revisión"}, coordinator, status=409)
        self.request("PUT", f"/portal/initialRegistrations/{key}", payload, token, status=409)
        block_reviews = {f"control.bloque_{block}.reviso1_nombre": f"Coordinación bloque {block}" for block in range(1, 7)}
        self.request("PUT", f"/portal/initialRegistrations/{key}", {"administracion": {"control.bloque_7.reviso1_nombre": "No existe"}}, coordinator, status=422)
        self.request("PUT", f"/portal/initialRegistrations/{key}", {"administracion": block_reviews}, coordinator)
        approved = next(r for r in self.request("GET", "/portal/state", token=token)["data"]["initialRegistrations"] if r["id"] == key)
        self.assertEqual(approved['administracion'], block_reviews)
        self.assertEqual(approved["estatus"], "Aprobado")
        self.assertEqual([h["estatus"] for h in approved["historial"]], ["Borrador", "Pendiente", "En revisión", "Correcciones solicitadas", "Pendiente", "En revisión", "Aprobado"])
        self.assertTrue(approved["historial"][-1]["usuario_id"])
        self.assertNotIn('JVBER', json.dumps(self.request("GET", "/portal/state", token=token)))
        owner_word = self.request("GET", f"/portal/initial-registrations/{key}/download", token=token, binary=True)
        admin_word = self.request("GET", f"/portal/initial-registrations/{key}/download", token=coordinator, binary=True)
        self.assertEqual(owner_word, admin_word)
        with ZipFile(BytesIO(owner_word)) as document:
            text = "".join(ET.fromstring(document.read("word/document.xml")).itertext())
            self.assertIn(project["nombre"], text)
            self.assertIn(approved["datos"]["identificacion.folio"], text)
            for value in block_reviews.values():
                self.assertEqual(text.count(value), 1)
        return key

    def test_flujo_completo_y_permisos(self):
        self.request("GET", "/portal/state", status=401)
        self.request("POST", "/auth/registro", {"nombre": "Intruso", "correo": "intruso@example.com", "password": "TestPass2026!", "rol": "admin"}, status=403)
        self.request("POST", "/auth/registro", {"nombre": "Corto", "correo": "corto@example.com", "password": "123", "rol": "estudiante"}, status=422)
        alice = self.create_user("alice")
        bob = self.create_user("bob")
        outsider = self.create_user("externo", "externo")
        admin = self.login("admin@example.com")
        a, b, ext = self.login("alice@example.com"), self.login("bob@example.com"), self.login("externo@example.com")
        managedid = str(uuid4())
        managed = {"nombre": "Cuenta administrada", "correo": "managed@example.com", "rol": "estudiante", "password": "TestPass2026!"}
        self.request("PUT", f"/portal/users/{managedid}", managed, admin)
        self.assertTrue(self.login("managed@example.com"))
        self.request("PUT", f"/portal/users/{managedid}", {**managed, "nombre": "Nombre actualizado", "password": ""}, admin)
        self.request("DELETE", f"/portal/users/{managedid}", token=admin)
        self.request("POST", "/portal/event-types", {"nombre": "Seminario"}, admin)
        self.request("POST", "/portal/event-types", {"nombre": "seminario"}, admin, status=409)
        pid = str(uuid4())
        project = {"nombre": "Proyecto de prueba", "descripcion": "Validación integral", "producto_servicio": "Aplicación para gestionar proyectos", "fecha": date.today().isoformat(), "estatus": "Completado", "progreso": 100, "owner": bob["id"], "comentario": "Intento de comentario administrativo"}
        self.request("PUT", f"/portal/projects/{pid}", project, a, status=422)
        project["registro_id"] = self.initial_form(a, project)
        self.request("GET", f"/portal/initial-registrations/{project['registro_id']}/files/principal.rfc", token=b, status=403)
        self.request("GET", f"/portal/initial-registrations/{project['registro_id']}/download", token=b, status=403)
        self.assertEqual(self.request("GET", "/portal/state", token=b)["data"]["initialRegistrations"], [])
        for field in ("nombre", "descripcion", "producto_servicio"):
            self.request("PUT", f"/portal/projects/{pid}", {**project, field: "   "}, a, status=422)
        self.assertEqual(self.request("GET", "/portal/state", token=a)["data"]["projects"], [])
        self.request("PUT", f"/portal/projects/{pid}", project, a)
        snapshot = self.request("GET", "/portal/state", token=a)
        saved = snapshot["data"]["projects"][0]
        self.assertEqual(saved["owner"], alice["id"])
        self.assertEqual(saved["progreso"], 0)
        self.assertEqual(saved["estatus"], "Pendiente")
        self.assertEqual(saved["comentario"], "")
        self.assertEqual(self.request("GET", "/portal/state", token=b)["data"]["projects"], [])
        self.request("PUT", f"/portal/projects/{pid}", project, b, status=403)
        self.request("PUT", f"/portal/projects/{uuid4()}", project, ext, status=403)
        self.request("PUT", f"/portal/milestones/{uuid4()}", {"project": pid, "hito": "Prototipo", "notas": "Prueba", "fecha": project["fecha"], "progreso": 35}, b, status=403)
        self.request("POST", f"/portal/projects/{pid}/members", {"correo": "bob@example.com"}, a)
        self.assertEqual(len(self.request("GET", "/portal/state", token=b)["data"]["projects"]), 1)
        self.request("PUT", f"/portal/projects/{pid}", project, b, status=403)
        self.request("PUT", f"/portal/milestones/{uuid4()}", {"project": pid, "hito": "Prototipo", "notas": "Prueba funcional", "fecha": project["fecha"], "progreso": 35}, b)
        taskid = str(uuid4())
        task = {"project": pid, "nombre": "Preparar pitch", "estatus": "Pendiente", "fecha": project["fecha"]}
        self.request("PUT", f"/portal/tasks/{taskid}", task, a)
        self.request("PUT", f"/portal/tasks/{taskid}", {**task, "estatus": "Completado"}, b)
        pdf = b"%PDF-1.4\narchivo de prueba\n%%EOF"
        self.request("PUT", f"/portal/projects/{pid}", {**project, "file": {"name": "canvas.pdf", "data": "data:application/pdf;base64," + base64.b64encode(pdf).decode()}}, a)
        snapshot = self.request("GET", "/portal/state", token=a)
        doc = snapshot["data"]["projects"][0]["file"]
        self.assertEqual(self.request("GET", f"/portal/documents/{doc['id']}/download", token=b, binary=True), pdf)
        self.request("GET", f"/portal/documents/{doc['id']}/download", token=ext, status=403)
        self.request("PUT", f"/portal/projects/{pid}", {**project, "file": {"name": "bad.pdf", "data": "not-a-file"}}, a, status=400)
        self.request("PUT", f"/portal/projects/{pid}", {**saved, "estatus": "En incubación", "progreso": 60, "comentario": "Revisado", "siguiente_paso": "Presentar prototipo", "file": doc}, admin)
        snapshot = self.request("GET", "/portal/state", token=a)["data"]
        self.assertEqual(snapshot["projects"][0]["estatus"], "En incubación")
        self.assertEqual(snapshot["projects"][0]["comentario"], "Revisado")
        self.assertEqual(len(snapshot["history"]), 2)
        self.assertEqual(len(snapshot["milestones"]), 1)
        self.assertEqual(snapshot["tasks"][0]["estatus"], "Completado")

        future = (date.today() + timedelta(days=3)).isoformat()
        eventid = str(uuid4())
        event = {"nombre": "Taller", "descripcion": "Taller de prueba", "tipo": "Taller", "fecha": future, "hora": "10:00", "cupo": 1, "precio": 0, "modalidad": "Presencial", "estatus": "Activo"}
        self.request("PUT", f"/portal/events/{eventid}", event, a, status=403)
        self.request("PUT", f"/portal/events/{eventid}", {**event, "cupo": -1}, admin, status=422)
        self.request("PUT", f"/portal/events/{eventid}", event, admin)

        # Dos solicitudes simultáneas compiten por el último lugar.
        def reserve(token):
            req = Request(self.base + f"/portal/events/{eventid}/register", data=b'{}', headers={"Content-Type": "application/json", "Authorization": "Bearer " + token}, method="POST")
            try:
                with urlopen(req) as response:
                    return response.status
            except HTTPError as error:
                return error.code
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(reserve, [a, b]))
        self.assertEqual(sorted(results), [200, 409])
        regs = self.request("GET", "/portal/state", token=admin)["data"]["registrations"]
        self.assertEqual(len(regs), 1)
        self.request("DELETE", f"/portal/registrations/{regs[0]['id']}", token=ext, status=403)
        self.request("DELETE", f"/portal/registrations/{regs[0]['id']}", token=admin)
        self.request("PUT", f"/portal/events/{eventid}", {**event, "precio": 350}, admin)
        self.request("POST", f"/portal/events/{eventid}/register", {}, a, status=400)
        rejected = self.request("POST", f"/portal/events/{eventid}/register", {"resultado": "Rechazado"}, a)
        self.assertFalse(rejected["confirmed"])
        self.assertTrue(self.request("POST", f"/portal/events/{eventid}/register", {"resultado": "Pagado", "importe": 1}, a)["confirmed"])
        payments = self.request("GET", "/portal/state", token=a)["data"]["payments"]
        self.assertEqual(next(p for p in payments if p["estatus"] == "Pagado")["importe"], 350)
        self.assertEqual(self.request("GET", "/portal/state", token=b)["data"]["payments"], [])
        reg = self.request("GET", "/portal/state", token=a)["data"]["registrations"][0]
        self.request("DELETE", f"/portal/registrations/{reg['id']}", token=a)
        self.assertIn("Reembolsado", [p["estatus"] for p in self.request("GET", "/portal/state", token=a)["data"]["payments"]])

        slotid = str(uuid4())
        slot = {"fecha": future, "inicio": "09:00", "fin": "10:00"}
        self.request("PUT", f"/portal/slots/{slotid}", slot, admin)
        self.request("PUT", f"/portal/slots/{uuid4()}", slot, admin, status=409)
        appointment = str(uuid4())
        self.request("PUT", f"/portal/appointments/{appointment}", {"slot": slotid}, a)
        coordinatorid = str(uuid4())
        self.request("PUT", f"/portal/users/{coordinatorid}", {"nombre": "Otra coordinadora", "correo": "coordinator2@example.com", "rol": "admin", "password": "TestPass2026!"}, admin)
        coordinator2 = self.login("coordinator2@example.com")
        slot2 = str(uuid4())
        self.request("PUT", f"/portal/slots/{slot2}", slot, coordinator2)
        self.request("PUT", f"/portal/appointments/{uuid4()}", {"slot": slot2}, a, status=409)
        self.request("PUT", f"/portal/appointments/{uuid4()}", {"slot": slotid}, b, status=409)
        self.request("PUT", f"/portal/appointments/{appointment}", {"slot": slotid, "estatus": "Completado"}, a, status=403)
        self.request("PUT", f"/portal/appointments/{appointment}", {"slot": slotid, "estatus": "Completado"}, admin)
        self.request("DELETE", f"/portal/slots/{slotid}", token=admin, status=409)

        requestid = str(uuid4())
        application = {"nombre": "Idea externa", "descripcion": "Nueva propuesta", "producto_servicio": "Servicio de asesoría", "especialidad": "Sistemas", "telefono": "8441234567"}
        application["registro_id"] = self.initial_form(ext, application)
        self.request("PUT", f"/portal/requests/{requestid}", {**application, "producto_servicio": " "}, ext, status=422)
        self.request("PUT", f"/portal/requests/{requestid}", {**application, "telefono": "", "especialidad": ""}, ext)
        self.request("PUT", f"/portal/requests/{requestid}", {**application, "estatus": "Aprobada"}, admin)
        linked = self.request("GET", "/portal/state", token=ext)["data"]["projects"][0]
        self.assertEqual(linked["solicitud_id"], requestid)
        self.assertEqual(linked["producto_servicio"], application["producto_servicio"])
        self.assertEqual(linked["telefono"], "")
        upgraded = self.request("GET", "/portal/state", token=ext)
        self.assertEqual(upgraded["user"]["rol"], "estudiante")
        self.assertEqual(upgraded["data"]["projects"][0]["nombre"], "Idea externa")
        self.request("PUT", f"/portal/requests/{requestid}", {**application, "estatus": "Aprobada"}, admin, status=400)
        proposal = {"nombre": "Robot", "equipo": "Equipo", "lider": "Alice", "asesor": "Docente", "descripcion": "Robot de prueba", "modulo": "InnoBótica", "categoria": "Minisumo"}
        innovationid = str(uuid4())
        self.request("PUT", f"/portal/innovation/{innovationid}", proposal, a)
        self.request("PUT", f"/portal/innovation/{innovationid}", {**proposal, "estatus": "Aprobada", "etapa": "Regional"}, admin)
        self.assertEqual(self.request("GET", "/portal/state", token=a)["data"]["innovation"][0]["etapa"], "Regional")
        admin_user = self.request("GET", "/portal/state", token=admin)["user"]
        self.request("PUT", f"/portal/users/{admin_user['id']}", {**admin_user, "rol": "externo"}, admin, status=400)
        self.request("DELETE", f"/portal/users/{alice['id']}", token=admin, status=409)
        self.request("PUT", f"/portal/users/{alice['id']}", {**alice, "rol": "admin"}, a, status=403)
        # Datos visibles nunca incluyen hashes ni archivos completos.
        self.assertNotIn('password_hash', json.dumps(self.request("GET", "/portal/state", token=admin)))

    def test_folios_globales_fecha_y_guardado_simultaneo(self):
        from app.models import RegistroInicial
        from app.modules.compartido.services import today

        self.create_user("folio_estudiante")
        self.create_user("folio_externo", "externo")
        student_token = self.login("folio_estudiante@example.com")
        external_token = self.login("folio_externo@example.com")
        coordinator = self.login("admin@example.com")
        snapshot = lambda token: self.request("GET", "/portal/state", token=token)["data"]["initialRegistrations"]
        key = str(uuid4())
        forged = {"datos": {"identificacion.numero_solicitantes": "1", "identificacion.folio": "999999999", "identificacion.fecha": "1900-01-01"}}
        before_date = today().isoformat()
        self.request("PUT", f"/portal/initialRegistrations/{key}", forged, student_token)
        first = next(row for row in snapshot(student_token) if row["id"] == key)
        self.assertRegex(first["datos"]["identificacion.folio"], r"^[0-9]{6,}$")
        self.assertNotEqual(first["datos"]["identificacion.folio"], "999999999")
        self.assertIn(first["datos"]["identificacion.fecha"], [before_date, today().isoformat()])

        # Simula un folio histórico con prefijo y una fecha anterior.
        # El siguiente folio debe continuar el máximo global, no contar registros.
        historical_number = int(first["datos"]["identificacion.folio"]) + 100
        engine = create_engine(self.url)
        try:
            with Session(engine) as db:
                row = db.get(RegistroInicial, UUID(key))
                row.datos = {**row.datos, "identificacion.folio": f"ITS-{historical_number:06d}", "identificacion.fecha": "2025-02-03"}
                db.commit()
        finally:
            engine.dispose()
        for token in (student_token, coordinator):
            self.request("PUT", f"/portal/initialRegistrations/{key}", forged, token)
            kept = next(row for row in snapshot(student_token) if row["id"] == key)
            self.assertEqual(kept["datos"]["identificacion.folio"], f"ITS-{historical_number:06d}")
            self.assertEqual(kept["datos"]["identificacion.fecha"], "2025-02-03")

        # Un guardado rechazado revierte la reserva y no consume el consecutivo.
        self.request("PUT", f"/portal/initialRegistrations/{uuid4()}", {"datos": {"desconocido": "x"}}, external_token, status=422)
        ids = [str(uuid4()) for _ in range(4)]
        def save_draft(pair):
            index, record_id = pair
            token = student_token if index % 2 == 0 else external_token
            return self.request("PUT", f"/portal/initialRegistrations/{record_id}", {"datos": {"identificacion.numero_solicitantes": "1"}}, token)
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(save_draft, enumerate(ids)))
        created = [row for row in snapshot(coordinator) if row["id"] in ids]
        self.assertEqual(len(created), 4)
        self.assertEqual(sorted(int(row["datos"]["identificacion.folio"]) for row in created), list(range(historical_number + 1, historical_number + 5)))
        self.assertTrue(all(row["datos"]["identificacion.fecha"] in (before_date, today().isoformat()) for row in created))
        # Reintentar un mismo borrador mantiene el folio.
        saved = next(row for row in created if row["id"] == ids[0])
        self.request("PUT", f"/portal/initialRegistrations/{ids[0]}", forged, student_token)
        retried = next(row for row in snapshot(student_token) if row["id"] == ids[0])
        self.assertEqual(retried["datos"]["identificacion.folio"], saved["datos"]["identificacion.folio"])
