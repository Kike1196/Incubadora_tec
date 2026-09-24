# Datos de muestra locales

Desde la raíz del proyecto, con Docker activo:

```powershell
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed_demo --apply
```

Sin `--apply`, el script prueba las inserciones y las revierte. Usa el mismo
hash y verificador de contraseñas que el login. La carga se hace en una sola
transacción y puede repetirse: no duplica ni sobrescribe registros existentes.
Si un correo demo ya pertenece a otra cuenta, cancela toda la carga.

Todas las cuentas nuevas usan la contraseña **DemoTec2026!**:

| Correo | Rol | Escenario |
|---|---|---|
| admin.demo@example.com | admin | Coordinadora |
| ana.demo@example.com | estudiante | EcoPack en revisión, integrante de AgroSensor |
| luis.demo@example.com | estudiante | AquaSmart en incubación, integrante de EcoPack |
| maria.demo@example.com | estudiante | SolarTec en incubación, integrante de AquaSmart |
| pedro.demo@example.com | estudiante | AgroSensor completado, integrante de SolarTec |
| sofia.demo@example.com | estudiante | Sin proyecto |
| externo.demo@example.com | externo | Acceso externo |

En una base migrada sin estos datos se agregan 7 usuarios, 4 proyectos, 8 integrantes,
4 documentos, 8 entradas de historial, 4 tareas, 4 avances, 2 eventos y 2 horarios
(43 registros). Los eventos y horarios nuevos se programan a partir de la fecha
de carga; los existentes se conservan sin cambiar sus fechas.
Los documentos son únicamente metadatos ficticios: no existen archivos en S3.

## Qué puedes probar actualmente

1. Abrir http://localhost:5173/login e iniciar sesión con cada rol.
2. Comprobar la navegación a coordinador, emprendedor o externo.
3. Consultar relaciones en PostgreSQL con las consultas de abajo.
4. Probar el registro con otro correo para crear una cuenta nueva.

El portal con sesión iniciada consulta y guarda los datos en PostgreSQL.
Solo `/vista-previa/...` usa ejemplos en memoria. Consulta [el recorrido completo](uso-local.md)
para probar proyectos, coordinación, adjuntos, eventos, tutorías y solicitudes.
Los pagos siguen siendo de prueba y no realizan cobros reales.

## Consultas desde VS Code

En la terminal:

```powershell
docker compose exec db psql -U incubadora_user -d incubadora_db
```

Luego ejecuta SQL:

```sql
SELECT nombre, correo, rol FROM usuarios WHERE correo LIKE '%.demo@example.com';

SELECT p.nombre, u.correo AS propietario, p.estatus, p.progreso, p.siguiente_paso
FROM proyectos p JOIN usuarios u ON u.id = p.usuario_id
WHERE u.correo LIKE '%.demo@example.com' ORDER BY p.nombre;

SELECT p.nombre AS proyecto, u.nombre AS integrante
FROM integrantes_proyecto i
JOIN proyectos p ON p.id = i.proyecto_id
JOIN usuarios u ON u.id = i.usuario_id
WHERE u.correo LIKE '%.demo@example.com' ORDER BY p.nombre, u.nombre;

SELECT p.nombre, h.estatus_anterior, h.estatus_nuevo, h.comentario, h.creado_en
FROM historial_estatus h JOIN proyectos p ON p.id = h.proyecto_id
WHERE p.nombre LIKE '% Demo' ORDER BY p.nombre, h.creado_en;

SELECT p.nombre AS proyecto, d.nombre AS documento, d.bucket, d.clave_archivo
FROM documentos d JOIN proyectos p ON p.id = d.proyecto_id
WHERE d.bucket = 'incubadora-demo-sin-archivos';
```
