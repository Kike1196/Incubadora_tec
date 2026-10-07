# Docker local y AWS con RDS

## Boletín visual para todos los perfiles, 6 de octubre de 2026

- Código `a9bddb4`, rama `feature/kike`. Portada de imagen por noticia,
  tarjetas editoriales, adaptación de flyers verticales sin recortes,
  lectura completa, enlaces públicos compartibles, búsqueda y filtros.
  Todos los perfiles tienen **Boletín** y noticias en su inicio;
  coordinación edita desde **Gestionar noticias**.
- Imagen `release-20261006-a9bddb4`, digest
  `sha256:0b891d9f0279fb6f77ebd36faea7df7a86d2ab618103d65e7ca806eda3064e6a`.
  Se compiló el frontend y se reutilizó la imagen anterior verificada,
  comprobando todas las dependencias fijadas. Backend y esquema sin cambios.
- La tarea de compatibilidad `7185f7acf83848ef986e0eac301689e7` terminó con
  código cero; RDS conserva la migración `295fe31b7422`.
- CloudFormation terminó correctamente; ECS quedó estable con una tarea,
  sin pendientes, revisión `:8` y rollout `COMPLETED`. El plan actualizó
  únicamente el servicio y la definición de tarea de migración.
- Compilación y comprobación de 56 pantallas y 53 enlaces correctas.
  Edge en modo headless verificó con imágenes temporales interceptadas
  fotos horizontales, flyers verticales, búsqueda sin acentos, lectura,
  galería completa, diseño móvil y acceso de los tres perfiles; no se
  agregaron publicaciones ni imágenes de prueba a la base.
- La comprobación interactiva del sitio AWS verificó sus tres noticias
  actuales, lectura completa, búsqueda y escritorio/móvil sin desbordamientos
  ni errores JavaScript. Se sirve `/assets/index-yxTQ89S2.js`.
- Un fallo temporal de conexión al refrescar la sesión AWS interrumpió el
  primer proceso de espera. El reintento confirmó actualización completa y
  servicio estable; el sitio pasó la comprobación durante ese reintento.

## Galerías publicadas el 6 de octubre de 2026

- Código: `2323f2b`, rama `feature/kike`. Noticias y eventos admiten hasta
  cinco imágenes o flyers, con descripción accesible, ampliación y retirada.
  Los borradores conservan sus imágenes privadas; no se añadieron flyers ficticios.
- Imagen `release-20261006-2323f2b`, digest
  `sha256:8d5b24e34e1f7bd4a4ac8d229867e3b1a94deba0979035a381f86379520653a7`.
  Las 23 pruebas del backend pasaron dentro de la imagen final; también la
  compilación frontend y las comprobaciones de interfaces. Una descarga de
  PyPI agotó el tiempo de espera: se reutilizó la imagen verificada anterior,
  comprobando todas las versiones fijadas antes de copiar el código y compilar
  el frontend. `Dockerfile.production` conserva su construcción habitual.
- Migración `295fe31b7422` aplicada con código cero por la tarea
  `0788fdd612bb4fc8a395050a9c66e2d8`. Añade `imagenes_editoriales` sin modificar
  noticias, eventos ni usuarios existentes.
- CloudFormation terminó la actualización y ECS quedó estable en revisión
  `:7`, rollout `COMPLETED`, una tarea activa y ninguna pendiente. Solo se
  actualizó la imagen; se conservaron RDS, S3, IAM y red.
- HTTPS devuelve `200` y sirve `/assets/index-DscSrznu.js`; `/api/health`
  responde `ok`. El boletín conserva tres publicaciones y el evento existente.
- `scripts/verify-aws.ps1 -PortalFlow` terminó con código cero en la tarea
  `c198c0d6c40041f0861b1482f717dd8d`: imágenes normalizadas, almacenamiento S3
  AES256, lectura, retirada, permisos y visibilidad editorial correctos,
  además de los flujos completos del portal. Se limpiaron los registros SQL
  temporales y se borraron lógicamente los objetos S3 de prueba.
- Uso: **Coordinador → Boletín / Eventos → Editar → Imágenes y flyers**.
  Formatos y límites en [gestión del boletín](boletin.md).

## Rediseño y boletín publicados el 6 de octubre de 2026

- Código: commit `4763ece`, rama `feature/kike`. Portada institucional con
  logotipos oficiales ITS/TecNM, prioridad para noticias y agenda pública,
  gestión editorial desde coordinación y rutas públicas de demostración retiradas.
- Imagen `release-20261006-4763ece`, digest
  `sha256:ded2ffe23306fee18f3c1d00312196e73488f1e987a11db77fc6d4dfc70845dd`.
  Las 22 pruebas del backend pasaron dentro de la imagen final. La compilación
  frontend y las comprobaciones de interfaces también pasaron.
- Migración `184ed20a6311` aplicada en RDS con código cero por la tarea ECS
  `21957596113e4617900aac9c82d78a45`. Incorpora publicaciones persistentes y
  tres artículos iniciales sobre los servicios del portal, vigentes hasta el
  6 de noviembre. Los eventos se consultan desde el catálogo existente.
- CloudFormation `UPDATE_COMPLETE`; ECS estable con una tarea, sin pendientes,
  revisión `:6` de `incubadora-application-web` y rollout `COMPLETED`.
  Solo se cambió la etiqueta de imagen con la plantilla existente; el plan
  modificó el servicio sin reemplazarlo y creó una revisión de la tarea de
  migración. RDS, S3, IAM y red conservaron su configuración.
- HTTPS: portada, `/health`, `/api/health`, `/api/public/newsletter`,
  `/brand/its.png`, `/brand/tecnm.png` y `/assets/index-D7dQ9aPA.js` responden
  correctamente. El JavaScript publicado contiene la nueva portada editorial.
- `scripts/verify-aws.ps1 -PortalFlow` terminó con código cero en la tarea
  `60077a6a26154f788ac08a33ce680bc4`. Verificó RDS con TLS, rol ECS, S3 AES256,
  boletín público, permisos editoriales, borradores ocultos, programación,
  caducidad, agenda pública y los flujos del portal. Los registros SQL
  temporales se eliminaron y los objetos S3 se borraron lógicamente.
- Publicación: https://in-eba33374426a491eac5ff2c493e78050.ecs.us-east-1.on.aws
  Administración del contenido: **Coordinador → Boletín**. Detalles en
  [gestión del boletín](boletin.md).

## Actualización publicada el 6 de octubre de 2026

- Código de módulos: commit `e275223`, rama `feature/kike`. Incluye revisión y
  correcciones de Innovación, asistencia de eventos y constancias PDF privadas.
- Imagen ECR inmutable: `release-20261006-e275223`, digest
  `sha256:290a464a9e8b1bfba473eb6b94bd6b12326fcb26273eaa0196e32d1f7ddee257`.
  La imagen final pasó las 21 pruebas del backend antes de publicarse.
- Migración `073dc19b5210` aplicada mediante una tarea ECS independiente con
  el usuario de aplicación y sin credenciales administrativas RDS. Terminó
  con código cero; el servicio anterior permaneció activo durante la migración.
- CloudFormation utilizó la plantilla y parámetros existentes, cambiando solo
  `ImageTag`. El change set mostró modificación del servicio sin reemplazo y
  una nueva revisión de la definición de tarea de migración. No modificó
  recursos de RDS, S3, IAM o red.
- Stack `incubadora-application`: `UPDATE_COMPLETE`. ECS quedó estable con una
  sola tarea en la revisión `:5` de `incubadora-application-web`. La publicación
  gradual conservó el 5% de tráfico durante tres minutos y tres minutos de
  observación según la configuración existente del servicio.
- HTTPS: `/health` y `/api/health` responden `ok`. La página y el JavaScript
  `index-D7knEG03.js` responden `200`; OpenAPI expone asistencia y constancias.
- `./scripts/verify-aws.ps1 -PortalFlow` terminó con código cero. Verificó RDS
  con TLS, rol ECS, S3 cifrado AES256, registro/login, permisos, anexos privados,
  proyectos, avances, tareas, eventos gratuitos, cupos y cancelaciones,
  asistencia y constancias PDF privadas, correcciones y etapas de Innovación,
  tutorías y rechazo/corrección/admisión de solicitudes externas.
- Se eliminaron los registros SQL temporales de la prueba y se borraron
  lógicamente sus objetos S3; el versionado puede conservar versiones anteriores.
  Los pagos simulados siguen deshabilitados en AWS.

Portal: https://in-eba33374426a491eac5ff2c493e78050.ecs.us-east-1.on.aws

La comprobación de interfaz fue de renderizado y HTTP. Sigue pendiente una
revisión interactiva en navegador; no se presenta como realizada.

## Arquitectura preparada

El entorno habitual (`docker-compose.yml`, puerto 5173) conserva PostgreSQL
local. El entorno AWS usa una RDS PostgreSQL nueva e independiente. No existe
replicación entre ambos ni se copian automáticamente datos locales a AWS.

`Dockerfile.production` compila React con `/api` como URL de API y sirve sus
archivos junto a FastAPI, sin recarga de desarrollo y con un usuario Linux
sin privilegios. La imagen se puede ejecutar en Docker y ECS Fargate.
Los `.dockerignore` excluyen contraseñas, sesiones AWS y archivos `.env`.

La infraestructura se divide en dos plantillas:

- `infra/aws/rds-foundation.yml`: VPC, dos subredes públicas para contenedores,
  dos privadas para RDS, RDS PostgreSQL `db.t4g.micro`, 20 GiB gp3, secretos,
  un bucket privado exclusivo de AWS y un repositorio ECR inmutable.
- `infra/aws/application.yml`: roles separados de ejecución y aplicación,
  tarea de migración, logs y servicio ECS Express Mode con HTTPS administrado.

RDS solo acepta conexiones desde el grupo de seguridad de la aplicación.
El cliente usa `sslmode=verify-full` y el certificado público de RDS incluido
en la imagen. No hay puerto 5432 público, ni claves AWS estáticas en ECS.
Las tareas públicas permiten descargar imágenes sin NAT Gateway; ECS crea
el acceso desde su balanceador. La base permanece en subredes privadas.

La tarea inicial de migración crea un usuario PostgreSQL propio para la app
y aplica Alembic con ese usuario. Solo esa tarea recibe el secreto del
administrador RDS. El servicio web recibe el usuario de aplicación y su
contraseña, y un secreto JWT independiente.

La configuración inicial usa una sola tarea de 0.5 vCPU/1 GiB y una RDS
Single-AZ. No es una configuración de alta disponibilidad. Se conservan
backups de RDS por un día (límite admitido por el plan actual), se activa protección de borrado y se retienen
base, secretos, imágenes y documentos al eliminar los stacks. La retención
puede mantener cargos incluso después de eliminar un stack.

## Prueba local de la imagen de producción

```powershell
./scripts/start-production-local.ps1
```

Abre http://localhost:8080. El script genera secretos aleatorios en
`.local/production-test.env`, excluido de Git y protegido con ACL de Windows.
Usa un proyecto Compose y un volumen propios; no altera la base de desarrollo.
El contenedor de migración debe terminar con código cero antes de arrancar la app.

Para detener esta instancia, conservando la base:

```powershell
docker compose --env-file .local/production-test.env -p incubadora-production-local -f compose.production.yml down
```

## Despliegue inicial

Usar un perfil autorizado para CloudFormation, RDS, EC2/VPC, ECR, ECS, IAM,
Secrets Manager, S3 y CloudWatch Logs. `incubadora-dev` no tiene esos permisos.
El perfil de despliegue nunca se copia al contenedor.

Validar ambas plantillas con cfn-lint, cfn-guard y CloudFormation antes de
ejecutar los cambios. `scripts/deploy-aws.ps1` genera un change set y muestra
sus cambios; solo lo ejecuta al recibir `-Execute`. Revisar el costo antes.
Los siguientes comandos crean recursos facturables:

```powershell
# Planificar y luego crear la infraestructura.
./scripts/deploy-aws.ps1 -Stage Foundation
./scripts/deploy-aws.ps1 -Stage Foundation -Execute

# Usar una etiqueta nueva e inmutable para cada imagen.
./scripts/deploy-aws.ps1 -Stage BuildPush -ImageTag release-20260929-1 -Execute

# Preparar tareas/roles sin publicar el portal; ejecutar la migración.
./scripts/deploy-aws.ps1 -Stage Migrate -ImageTag release-20260929-1
./scripts/deploy-aws.ps1 -Stage Migrate -ImageTag release-20260929-1 -Execute

# Solo después de una migración con código cero:
./scripts/deploy-aws.ps1 -Stage Service -ImageTag release-20260929-1
./scripts/deploy-aws.ps1 -Stage Service -ImageTag release-20260929-1 -Execute
```

El último paso imprime el endpoint. Verificar `/health`, `/api/health`, el
portal, registro e inicio de sesión, carga y descarga privada y permisos.
La base nueva no tiene usuarios. La primera cuenta de coordinación debe
aprovisionarse explícitamente; el registro público no permite crear admins.

El script está pensado para el despliegue inicial. Rechaza preparar migraciones
sobre un servicio ya publicado, eliminar recursos o reemplazarlos. Para una
actualización posterior, preparar una revisión de migración independiente,
aplicarla y publicar la imagen manteniendo compatibilidad con la versión anterior.
Revisar `list-imports` antes de cambiar exports de la infraestructura.

Si rota un secreto inyectado en ECS, se deben recrear las tareas para cargarlo.
Si se cambia la contraseña del usuario de la app, hay que sincronizar el rol
PostgreSQL mediante una tarea administrativa antes de reiniciar el servicio.

## Costos y límites

Se facturan RDS, almacenamiento, Fargate, balanceador/LCU, direcciones IPv4,
Secrets Manager, logs, ECR, S3 y transferencia. Los cargos no dependen de que
el portal reciba visitas. El autoescalado de almacenamiento permite crecer
hasta 100 GiB y puede incrementar el costo; no reduce automáticamente el disco.
No se asume que la cuenta tenga créditos ni que la capa gratuita cubra el entorno.

Estimación consultada el 29 de septiembre de 2026 para us-east-1, 730 horas/mes:

| Componente | USD/mes |
| --- | ---: |
| RDS db.t4g.micro Single-AZ | 11.68 |
| RDS gp3, 20 GiB | 2.30 |
| Fargate, 0.5 vCPU y 1 GiB | 18.02 |
| Balanceador ALB, cargo horario | 16.42 |
| Tres IPv4 públicas (dos del ALB y una tarea) | 10.95 |
| Tres secretos | 1.20 |
| Base calculada antes de redondear componentes | 60.58 |

Una LCU utilizada durante todo el mes añade USD 5.84: total USD 66.42 antes
de logs, ECR, S3, solicitudes, transferencia, impuestos y consumo adicional.
Las tarifas de RDS, gp3, Fargate y ALB se consultaron mediante AWS Price List.
Las cantidades de IPv4 y LCU son supuestos de esta estimación, no un límite
de facturación. Los despliegues pueden ejecutar tareas adicionales temporalmente.

Referencias:

- [ECS Express Mode y recursos administrados](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-work.html)
- [Verificación SSL para RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html)
- [Calculadora de AWS](https://calculator.aws/)
- [Precios de IPv4](https://aws.amazon.com/vpc/pricing/)
- [Precios de Secrets Manager](https://aws.amazon.com/secrets-manager/pricing/)

## Estado

Estado de preparación local y recuperación al 30 de septiembre de 2026:

- Imagen de producción construida y funcionando en http://localhost:8080.
- Migraciones aplicadas a su base local independiente.
- Salud de BD/API, portal, ruta SPA y archivo JavaScript verificados por HTTP.
- Registro, login y estado autenticado probados; cuenta temporal eliminada.
- Pasaron las 17 pruebas del backend, incluidas las dos nuevas de configuración.
- Sintaxis de ambos scripts PowerShell y `git diff --check` sin errores.
- `aws cloudformation validate-template` aceptó ambas plantillas. Esto comprueba
  sintaxis, no sustituye la validación completa de propiedades ni un despliegue.
- cfn-lint 1.57.1 está en `.local/aws-validation`; cfn-guard 3.2.1 está en
  `.local/cfn-guard`. Se instalaron con autorización. Ambas plantillas pasan
  cfn-lint. Las cuatro reglas oficiales seleccionadas para RDS privada/cifrada
  y S3 privado/cifrado pasan, sin supresiones. Se corrigió el valor de escalado
  de ECS a `AVERAGE_CPU` y se fijó PostgreSQL 15.19.
- Perfil `incubadora-deploy` autenticado con root por el usuario. No copiarlo a
  la imagen. Los roles de aplicación y ejecución están separados en las plantillas.
- Se observaron RDS `incubadora-db` (MySQL), `proyecto-is-db` (PostgreSQL) y el
  stack `awseb-e-dkesz2rzfx-stack`. El usuario autorizó explícitamente eliminar
  `proyecto-is-db` el 30 de septiembre para liberar el cupo de RDS. Se solicitó
  su eliminación con instantánea final `proyecto-is-db-final-20260930`; AWS
  terminó la eliminación. La instantánea está `available`, al 100%, comprobado
  el 30 de septiembre. La instancia `proyecto-is-db` ya no aparece en RDS.
  `incubadora-db` y Elastic Beanstalk no se modificaron.
- El primer intento falló porque el plan FREE rechazó siete días de backups.
  No llegó a crear RDS. Se ajustó `BackupRetentionDays` a 1, como las bases
  existentes. No se cambió el plan de facturación.
- El stack fallido se eliminó con autorización conservando cuatro recursos.
  Se importaron nuevamente al stack `incubadora-foundation`. El siguiente
  intento falló por el máximo de instancias RDS del plan FREE y volvió a
  `UPDATE_ROLLBACK_COMPLETE`, conservando los cuatro recursos importados.
  Tras liberar el cupo, el reintento terminó correctamente. RDS nueva:
  `incubadora-foundation-database-zuqiwmta85oz`, PostgreSQL 15.19, cifrada,
  privada, protegida contra borrado y con un día de backups.
  Los recursos retenidos son:
  - bucket `incubadora-foundation-documents-kvaqc4jj7kkx`;
  - ECR `incubadora-foundation-repository-3fb3v00hv7ck`;
  - los secretos `AppSecret-u5IGxUQVpsMw-vn6C07` y `JwtSecret-f0QjgKod3ALG-bL2biP`.
- Al consultar el plan el 29 de septiembre, era FREE, con USD 64.53 de crédito
  restante y vencimiento informado el 5 de enero de 2027. El crédito se
  comparte con otros recursos de la cuenta; volver a consultarlo si hace falta.
- Imagen publicada en ECR con etiqueta `release-20260929-1` y digest
  `sha256:93f576103b4f0cf4302e44d6dff10a40e98425f1f7ff94cc0a15f3b0ecc9d864`.
- El primer intento del stack de aplicación falló mientras ECS inicializaba
  `AWSServiceRoleForECS`. Se confirmó su política administrada y se reintentó
  el stack fallido. Se conservó el grupo de logs del intento:
  `incubadora-application-Logs-ztkWnRUPPhcf`.
- El stack `incubadora-application` terminó en `UPDATE_COMPLETE`. La tarea de
  migración terminó con código cero y el servicio web está publicado. La
  recuperación y las comprobaciones finales se detallan a continuación.

Consultar este documento para retomar el despliegue. La conexión S3 local
previa está documentada por separado en `docs/continuar-s3.md`.
El acceso EC2 a la base se detalla en `docs/acceso-rds.md`; las pruebas del
flujo del portal, alertas y respaldos se registran en `docs/operacion-aws.md`.

### Recuperación de ECS del 30 de septiembre

- El primer servicio `incubadora-application-portal` falló en `CreateLoadBalancer`
  con `AccessDenied`. La política administrada requerida estaba asociada al rol.
  El mismo balanceador pudo crearse con el perfil de despliegue; no se modificó
  el plan de la cuenta. ARN: `arn:aws:elasticloadbalancing:us-east-1:940827433988:loadbalancer/app/ecs-express-gateway-alb-501e660c/ff306d50b478f77a`.
- El servicio sobrevivió al rollback fuera del stack. Se importó a CloudFormation
  y se restauraron sus outputs, pero su revisión siguió sin iniciar tareas.
- Se preparó y ejecutó un reemplazo limitado al servicio, con nombre
  `incubadora-application-web`. El servicio anterior se retiró durante la
  recuperación; no había iniciado tareas. RDS y S3 se conservaron.
- Express Mode siguió esperando recursos del balanceador compartido. Se agregó
  `PublicWebA` (10.42.2.0/24) y el export `WebPublicSubnets` para recuperar el
  servicio con otra combinación de subredes. Cambiar la revisión durante el
  reemplazo provocó un rollback; se reintentó con la nueva red incluida desde
  el inicio. Ese intento terminó en `UPDATE_COMPLETE`, con una tarea activa.
  AWS retiró el balanceador del intento anterior; se comprobó que ya no existe.
- Docker local se reinició y `/health` respondió `{"status":"ok"}`.

### Resultado verificado

- Portal AWS: https://in-eba33374426a491eac5ff2c493e78050.ecs.us-east-1.on.aws
- Portal Docker local: http://localhost:8080
- HTTPS: página principal `200`, `/health` y `/api/health` responden `ok`.
- `scripts/verify-aws.ps1`: conexión RDS con TLS y usuario `incubadora_app`,
  migración `a75c42e1b543`, uso del rol ECS, carga/lectura S3 cifrada AES256,
  registro, login y consulta autenticada del portal correctos. Se eliminó la
  cuenta temporal; el objeto S3 se borró lógicamente (el bucket usa versionado).
- Las bases local y AWS son independientes. No se copiaron usuarios locales
  ni se creó una cuenta administradora en AWS. Los pagos demo están desactivados.
- Ambas plantillas pasan cfn-lint; scripts PowerShell sin errores de sintaxis.
  El despliegue ahora exige una tarea activa y salud HTTPS antes de informar éxito.
