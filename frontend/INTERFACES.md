# Interfaces de Incubadora ITS

Implementadas a partir de `Incubadora_ITS_actualizada_InnovaTecNM_Pagos.pptx` (38 diapositivas). Se mantienen la paleta guinda `#6E1E39`, guinda oscuro `#3F0F21`, azul `#1F4E79`, fondo `#F6F5F7` y las familias Cambria / Calibri.

## Abrir la demostración

Con Docker en ejecución:

- Emprendedor: http://localhost:5173/vista-previa/emprendedor/inicio
- Coordinador: http://localhost:5173/vista-previa/coordinador/inicio
- Externo: http://localhost:5173/vista-previa/externo/inicio
- InnovaTecNM: http://localhost:5173/vista-previa/innovatecnm/inicio?rol=admin

La página pública incluye un enlace a la demostración. El selector superior permite cambiar de rol conservando los cambios durante la navegación. Al recargar se restablecen los ejemplos. Esto permite enviar una solicitud como Externo y revisarla como Coordinador, o crear un evento como Coordinador e inscribirse como Emprendedor.

## Cobertura

| Referencia | Pantallas y acciones |
| --- | --- |
| 4–6 | Inicio público, login y registro existentes; acceso a la demostración desde la portada |
| 8–13 | Inicio de Emprendedor, búsqueda de proyectos, alta/edición/detalle, adjuntos PDF/DOC/DOCX, hitos, progreso, tareas, eventos y tutorías |
| 15–24 | Inicio de Coordinador, usuarios, propuestas de roles, eventos/tipos/inscripciones, seguimiento/comentarios, reportes filtrables, estadísticas, agenda/disponibilidad/historial |
| 26–28 | Inicio de Externo, eventos, solicitud de ingreso y estado; revisión de solicitudes en Coordinador |
| 31–33 | Inicio InnovaTecNM, seis categorías de Certamen, seis retos de HackaTec, ocho categorías y exhibición de InnoBótica, InnovAcción y Retos Nacionales |
| 34–38 | Checkout de prueba, pagos/comprobantes, cobros por evento, inscripciones, propuestas de equipos y seguimiento de etapas |

Se añadieron estados vacíos, filtros, página no encontrada, enlaces por rol, navegación adaptable, formularios con etiquetas, foco visible y diálogos nativos que pueden cerrarse con Escape.

## Alcance funcional

La autenticación existente continúa usando `/auth/login` y `/auth/registro`. Los portales nuevos muestran siempre un aviso de demostración, incluso cuando se accede desde una cuenta autenticada. Sus registros son ejemplos en memoria y no representan los datos de esa cuenta. Las rutas `/vista-previa/*` no requieren autenticación y nunca realizan operaciones sobre la API.

- Los proyectos, adjuntos, avances, usuarios, eventos, tutorías, solicitudes y propuestas InnovaTecNM se modifican únicamente en la memoria de esta pestaña.
- Las exportaciones son CSV compatibles con Excel, no archivos XLSX.
- Los comprobantes son archivos de texto identificados como demostración, sin validez fiscal.
- El checkout permite probar pago aprobado o rechazado. No solicita datos de tarjeta, no conecta una pasarela y no cobra dinero.
- El cupo y las inscripciones duplicadas se comprueban en esta demostración. En producción deben garantizarse de forma transaccional en el servidor.
- Los roles adicionales son propuestas descriptivas. No modifican permisos ni los roles reales del backend. Aprobar una solicitud no cambia una cuenta real.
- El acceso institucional a InnovaTecNM se debe definir antes de habilitar registros reales. Las categorías reproducen la referencia del usuario; no constituyen una validación independiente de la convocatoria.
- Algunas fechas de eventos de ejemplo se ajustaron para poder probar inscripciones durante septiembre de 2026. Los eventos pasados cierran su inscripción.

## Conexiones pendientes

Persistencia y autorización de proyectos/archivos, avances/tareas, perfiles/usuarios, eventos e inscripciones, tutorías, solicitudes, reportes e InnovaTecNM. Para pagos: elección y configuración de proveedor institucional, órdenes, confirmación firmada del proveedor, control de cupo, comprobantes y conciliación/reembolsos. Los campos de perfil ampliado del registro de referencia (número de control, especialidad y teléfono) también necesitan ampliar el modelo de usuario; el registro actual conserva su contrato de API.

No se han creado cuentas reales, migrado datos ni modificado el backend.

## Verificación

```powershell
docker compose exec -T frontend npm run build
docker compose exec -T -e NODE_ENV=production frontend npm run check:interfaces
```

La comprobación renderiza 52 vistas con React y verifica 48 enlaces internos, aislamiento de rutas por rol, estados vacíos, preservación del rol al navegar en InnovaTecNM y bloqueos de checkout por cupo e inscripción existente. No reemplaza una prueba de interacción en un navegador ni una revisión visual a distintos tamaños. Esa revisión quedó pendiente porque no había un navegador conectado en la sesión de implementación.

El código de los nuevos módulos está en `src/portal/`. `PortalContext.jsx` centraliza los datos de demostración y `App.jsx` define las rutas. No se agregaron dependencias de aplicación.
