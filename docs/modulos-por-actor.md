# Organización por actores

El proyecto conserva sus tres roles de acceso: `admin` (coordinación),
`estudiante` (emprendedor) y `externo`. Las carpetas usan nombres del dominio;
los valores de los roles y las URL existentes se conservan.

| Actor / área | Frontend | Backend | Responsabilidad |
| --- | --- | --- | --- |
| Coordinación | `src/modules/coordinacion/` | `app/modules/coordinacion/` | Usuarios, roles, reportes, eventos, disponibilidad y revisión de registros |
| Estudiantes | `src/modules/estudiantes/` | `app/modules/estudiantes/` | Creación de proyectos, integrantes, avances y tareas |
| Externos | `src/modules/externos/` | `app/modules/externos/` | Solicitud de ingreso y participación en eventos |
| Autenticación | `src/modules/autenticacion/` | `app/modules/autenticacion/`, `app/auth/` | Registro de cuentas, inicio de sesión y autorización |
| Público | `src/modules/publico/` | — | Página de presentación |
| Innovación | `src/modules/innovacion/` | `app/modules/compartido/` | Propuestas de estudiantes y revisión de coordinación |
| Compartido | `src/shared/` | `app/modules/compartido/` | Procesos y componentes utilizados por varios actores |

## Frontend

Cada actor define sus pantallas en `routes.jsx` y su menú en `navigation.js`.
`App.jsx` compone esas rutas con el layout común y `RutaProtegida`, tanto para
sesiones reales como para las vistas previas.

El código compartido se organiza por función:

- `shared/api/`: cliente HTTP.
- `shared/portal/`: contexto, layout, inicio, componentes visuales y datos demo.
- `shared/projects/`: listado y detalle de proyectos para estudiantes y coordinación.
- `shared/events/`: catálogo, inscripción, checkout y pagos.
- `shared/registration/`: formato de registro y sus campos.
- `shared/applications/`: captura de solicitudes y su revisión administrativa.
- `shared/tutoring/`: agenda, reservas e historial de tutorías.

## Backend

`main.py` registra los routers de los módulos. Las URL `/auth`, `/admin` y
`/portal` conservan su contrato para el frontend y otros clientes.

- `routes.py` y `portal_routes.py` contienen los endpoints de cada área.
- `mutations.py` contiene las operaciones de escritura del proceso de cada actor.
- `compartido/routes.py` compone la API común; `SAVE_HANDLERS` dirige cada colección
  al módulo responsable, después de validar sus datos.
- `compartido/services.py` reúne acceso a proyectos, registros aprobados,
  adjuntos, historial y utilidades comunes.

Las operaciones de escritura reciben la misma sesión de base de datos. El
router común confirma la transacción después de ejecutar el proceso completo.
Por ejemplo, aprobar una solicitud sigue cambiando el rol y creando el proyecto
y su historial en una sola transacción.

La carpeta de un actor indica quién inicia o gestiona el proceso; no concede
permisos por sí misma. Coordinación también interviene en proyectos y solicitudes.
Los controles de rol, propiedad y transición de estado permanecen en el servidor.

`models/`, `schemas/`, `database.py`, `config.py` y las migraciones permanecen
compartidos porque describen las mismas entidades para todos los actores.
El formato DGEST permanece en `initial_registration.py` y
`registration_fields.json`, utilizado por estudiantes, externos y coordinación.

## Añadir funciones

1. Ubicar la pantalla y su operación en el módulo del actor responsable.
2. Si varios actores utilizan la misma función, colocar la implementación en el
   área compartida y componerla desde las rutas de cada actor.
3. Registrar las rutas y enlaces en `routes.jsx` y `navigation.js` del actor.
4. Aplicar autorización en el backend y verificar los flujos afectados.

## Validación local

Con los contenedores iniciados, desde la raíz:

```powershell
docker compose exec -T frontend npm run build
docker compose exec -T frontend npm run check:interfaces
docker compose exec -T backend python -m unittest discover -s tests -v
```

Las pruebas del backend crean y eliminan bases temporales; no sustituyen la base
de desarrollo.

## Fecha y folio del registro

El primer guardado del formato asigna la fecha de elaboración (zona horaria
America/Mexico_City) y un folio global de al menos seis dígitos, por ejemplo
`000001`. La fecha aparece también como fecha de emisión. Ambos campos son de
solo lectura y el servidor ignora cualquier valor enviado por el cliente.
Las correcciones conservan la fecha y el folio ya guardados.

La serie continúa después del mayor número final de los folios existentes,
incluidos los históricos con prefijo, como `ITS-000123`. Los folios históricos
se conservan; los que no contienen un número final no establecen un consecutivo.
Un registro anterior sin folio recibe uno al volver a guardarlo el solicitante.
Un bloqueo transaccional de PostgreSQL serializa la asignación entre todos los
usuarios y procesos. Las altas deben pasar por la API para respetar esta regla.
La vista previa simula su propia serie y no reserva folios reales.

## Descarga del registro aprobado en Word

La acción **Descargar formato Word** aparece cuando el registro está `Aprobado`:

- Coordinación: en **Registros → Aprobado**, desde la fila o al abrir el registro.
- Emprendedor: en **Proyectos → Mis registros de ingreso**, o dentro del formato.
  Si ya creó el proyecto, puede abrirlo y desplegar **Ver formato de registro completo**.

`GET /portal/initial-registrations/{id}/download` exige sesión iniciada y permite
el acceso únicamente al titular del registro o a coordinación. Devuelve `409`
si aún no está aprobado y `403` si corresponde a otra persona. El archivo se
entrega como `registro-{folio}.docx`, con caché deshabilitada.

La descarga se rellena desde `app/templates/registro-original.docx` con los datos
guardados del solicitante, todos sus socios y los campos de coordinación.
Incluye el folio automático y la fecha de elaboración, sin inventar firmas.
Los anexos conservan sus descargas independientes. La vista previa no descarga
documentos reales. Las modificaciones sin guardar no se incorporan al Word.
