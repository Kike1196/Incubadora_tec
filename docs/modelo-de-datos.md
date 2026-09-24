# Modelo de datos

PostgreSQL almacena los datos y las referencias a archivos. SQLAlchemy define
los modelos y Alembic administra el esquema.

| Tabla | Propósito |
| --- | --- |
| usuarios | Identidad, correo único, contraseña cifrada mediante hash y rol global |
| proyectos | Proyecto, propietario, estatus actual y progreso |
| integrantes_proyecto | Usuarios adicionales que participan en un proyecto; el par proyecto/usuario no se repite |
| documentos | Nombre, tipo, proyecto, autor de carga y ubicación del objeto (bucket y clave) |
| historial_estatus | Estatus anterior y nuevo, actor, comentario y fecha del cambio |

El propietario sigue en `proyectos.usuario_id`; no requiere una fila de integrante.
Los roles globales no cambian al integrar un equipo. Los catálogos de tipo de
documento y estatus quedan pendientes de validación con las coordinadoras.
No se almacenan archivos binarios ni URLs firmadas que expiran en la base de datos.

Las nuevas fechas usan zona horaria. Eliminar un proyecto elimina su participación,
documentos e historial en la base; no elimina los objetos del almacenamiento.
Eliminar un autor deja su referencia nula en documentos e historial de otros
proyectos. Se conserva el comportamiento previo que elimina los proyectos de un
propietario al eliminarlo mediante el ORM. Antes de habilitar borrados en la API,
definir con la institución las reglas de conservación o baja lógica.

## Migraciones

Desde la raíz del repositorio, con PostgreSQL disponible:

```sh
docker compose run --rm backend alembic upgrade head
docker compose up -d backend frontend
```

La revisión `8881ea422f6a` estaba vacía. La siguiente revisión crea las tablas
base si faltan y conserva las existentes; después crea las tres tablas nuevas.
No reconstruye eventos históricos que no se registraron. Una base existente
debe tener las tablas base compatibles con los modelos anteriores.
El backend ya no ejecuta `create_all` al iniciar.

El downgrade elimina las tablas nuevas y sus datos, pero conserva usuarios,
proyectos y el tipo de rol, porque pueden existir desde antes de Alembic.
La generación SQL offline supone una base vacía; para una base existente usar
la migración online, que inspecciona las tablas presentes.

## Integración pendiente

Este cambio prepara el esquema; los endpoints de equipos, carga de documentos y
cambios de estatus aún deben implementarse. Al cambiar un estatus, actualizar el
proyecto e insertar su evento en una misma transacción. El actor debe proceder
del usuario autenticado. La API debe comprobar los permisos por proyecto y
generar el identificador UUID de las filas mediante los modelos.
