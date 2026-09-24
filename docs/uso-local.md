# Uso local del portal conectado a PostgreSQL

## Iniciar

Abre Docker Desktop y ejecuta desde la raíz del proyecto:

```powershell
docker compose up -d --build
docker compose exec backend python -m app.seed_demo --apply
```

Docker espera a PostgreSQL y aplica las migraciones antes de iniciar la API.
Los registros y adjuntos permanecen en el volumen `pg_data` al reiniciar.
La carga demo es opcional después de la primera vez y no sobrescribe registros.

- Aplicación: http://localhost:5173/login
- API y documentación de endpoints: http://localhost:8000/docs
- PostgreSQL para VS Code: `127.0.0.1:5433`, base `incubadora_db`, usuario
  `incubadora_user`, contraseña `super_password`, SSL desactivado.

Las cuentas demo usan `DemoTec2026!`:

| Correo | Uso |
|---|---|
| admin.demo@example.com | Coordinación |
| ana.demo@example.com | Emprendedora con proyectos |
| sofia.demo@example.com | Emprendedora para crear un proyecto desde cero |
| externo.demo@example.com | Solicitud de ingreso y eventos |

## Recorrido de prueba

1. Inicia con Sofía. En **Proyectos → Nuevo proyecto**, completa el formato de
   registro y sus anexos, guárdalo y después crea el proyecto. Puedes guardar
   borradores para continuar la captura después.
2. Abre el proyecto, registra un avance y agrega una tarea. Puedes incorporar
   integrantes indicando el correo de otro emprendedor registrado.
3. Cierra sesión y entra como `admin.demo@example.com`. En **Seguimiento**, abre
   el proyecto, cambia su estatus, progreso, comentario y siguiente paso.
4. Vuelve como Sofía: verás la revisión y su historial. Los integrantes pueden
   ver el proyecto y registrar avances/tareas; la ficha y el adjunto los edita
   el propietario. Coordinación puede revisar todos los proyectos.
5. En **Eventos**, inscríbete al taller gratuito. Revisa **Mis inscripciones**,
   recarga y cancela para comprobar que se libera el lugar.
6. Prueba el taller con costo: puedes registrar un pago de prueba aprobado o
   rechazado. El aprobado confirma la inscripción; el rechazado no reserva lugar.
   La cancelación marca el pago de prueba como reembolsado.
7. En **Tutorías**, reserva un horario. Coordinación puede consultar la agenda,
   completar/cancelar la sesión y agregar nuevos horarios sin superposiciones.
8. Entra como externo y envía una solicitud. Coordinación puede rechazarla para
   que se corrija o aprobarla. Al aprobar se crea el proyecto y la cuenta pasa a
   ser emprendedor. Al pulsar **Actualizar datos**, volver a la pestaña o iniciar
   sesión de nuevo se aplica el rol actualizado.
9. En **InnovaTecNM**, guarda una propuesta. Coordinación puede actualizar su
   etapa y estatus. Se trata de registros internos, no inscripciones oficiales.
10. En **Reportes**, filtra y exporta los datos reales a CSV para Excel.

**Actualizar datos** trae cambios realizados desde otra sesión. Los errores de
validación se muestran en pantalla y no se anuncian como guardados.

## Alcance

El portal con sesión usa PostgreSQL. Las rutas `/vista-previa/...` conservan una
demostración independiente en memoria; no modifican cuentas ni la base de datos.

Los pagos están en **modo de prueba, sin cobros reales**, habilitado localmente
por `DEMO_PAYMENTS_ENABLED=true`. No se solicitan datos bancarios. Al deshabilitar
esa opción, las reservas de eventos con costo quedan bloqueadas hasta integrar
un proveedor de pagos. Los comprobantes de prueba no tienen validez fiscal.

Los archivos reales se guardan en PostgreSQL y se descargan mediante la API con
autorización por proyecto. Los metadatos antiguos de documentos demo sin archivo
se conservan, pero no ofrecen una descarga inexistente. No hace falta configurar
S3 para usar la aplicación local.

Los roles disponibles son los tres implementados; se asignan desde **Usuarios**.
El registro público solo crea emprendedores y externos. Crear coordinadores
requiere una cuenta administrativa. Una cuenta con historial asociado no se
elimina para evitar perder datos.

## Comprobar y detener

```powershell
docker compose ps
docker compose logs --tail=80 backend frontend
docker compose exec backend python -m unittest discover -s tests -v
docker compose exec frontend npm run check:interfaces
docker compose exec frontend npm run build
docker compose down
```

Las pruebas de backend crean y eliminan bases temporales propias y no alteran
los datos de desarrollo. Verifican migraciones nuevas y antiguas, permisos,
persistencia, adjuntos, reservas simultáneas, pagos de prueba y cambios de rol.
No uses `docker compose down -v` si quieres conservar los datos.

## Formato de registro previo al proyecto

El sitio reproduce los campos del formato DGEST-MIdE-CI-F-01, revisión 1.0,
emitido el 01/03/2016: partes I a VIII, cita, requisitos y control de revisión.
En Proyectos → Nuevo proyecto se completa primero el formato, se guarda como
borrador y se envía a revisión. Solo al quedar Aprobado se habilita Crear proyecto con este registro.
El borrador persiste aunque se cierre la sesión. Para externos, el segundo paso
es Enviar solicitud de proyecto y se conserva la aprobación de coordinación.

El número de solicitantes agrega las fichas y anexos de los socios. Los campos
marcados con * son obligatorios; los datos que pueden no aplicar permanecen
opcionales. Enviar a revisión requiere los siete anexos de cada solicitante; el octavo
requisito, el formulario, es el propio registro digital. PDF, PNG o JPG, máximo
2 MB por archivo y 20 MB en conjunto. La firma se captura como nombre completo,
no como firma autógrafa ni firma electrónica certificada.

Coordinación completa cita, revisión de anexos, elaboró/revisó/autorizó y
comentarios. El propietario y coordinación pueden ver el formato; otros
integrantes del proyecto no reciben sus datos personales ni anexos. Un formato
ya enviado conserva las respuestas; una solicitud rechazada permite corregirlo.

La migración e53a20c9f321 agrega registros_iniciales y los vínculos registro_id
sin borrar registros anteriores. Los registros antiguos no se marcan como
completos automáticamente. Actualizar: `docker compose exec backend alembic upgrade head`.

## Revisión administrativa de registros

Coordinación → Registros reúne los formularios de emprendedores y externos,
aunque todavía no exista un proyecto. Permite filtrar por estado, abrir el formato,
descargar anexos, guardar datos de coordinación e iniciar la revisión.

Estados: Borrador → Pendiente → En revisión → Aprobado. Desde En revisión se
pueden solicitar correcciones, con observaciones obligatorias. El propietario
corrige y reenvía; el registro vuelve a Pendiente. Durante la revisión y después
de aprobar se bloquean las respuestas y anexos. La API exige aprobación para
crear o vincular el proyecto y para continuar con la solicitud de ingreso externa.
Cada cambio registra estado, responsable, fecha y observaciones. Las decisiones
sobre un estado desactualizado se rechazan para evitar revisiones simultáneas.

La migración f64b31d0a432 agrega observaciones e historial. Los registros antes
marcados Completo pasan a Pendiente, nunca se aprueban automáticamente. Los
proyectos existentes se conservan.
