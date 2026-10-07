# Boletín público

Publicado y verificado en AWS el 6 de octubre de 2026. La migración
`295fe31b7422` está aplicada en RDS y el servicio utiliza la imagen
`release-20261006-a9bddb4`. La verificación HTTPS confirmó permisos,
borradores ocultos, programación, caducidad, agenda pública y galerías.
La revisión visual posterior verificó lectura completa, búsqueda y diseño
adaptable en el sitio publicado.

La portada da prioridad al boletín de noticias, convocatorias, avisos y próximos eventos. No enlaza a demostraciones y las rutas de vista previa no están habilitadas en la aplicación pública; únicamente se habilitan expresamente en las comprobaciones de interfaces.

## Gestión de contenido

En **Coordinador → Gestionar noticias** se crean y editan publicaciones con título, resumen, contenido, categoría, fecha de publicación, fecha opcional de cierre, visibilidad y prioridad. Para retirar una publicación se desmarca **Publicar en el sitio** y se guarda. Se conserva el contenido para futuras ediciones.

## Lectura para toda la comunidad

La portada pública y **Boletín** en las cuentas de emprendedores, externos y
coordinación muestran las mismas noticias vigentes. El inicio de cada cuenta
incluye las tres primeras publicaciones y un acceso al boletín completo.
Hay filtros por categoría, búsqueda por título, resumen y contenido (sin
distinguir acentos), y actualización manual, además de la automática.

La primera imagen es la portada de cada noticia: conserva sus proporciones,
sin recortes. La noticia destacada acomoda los flyers verticales junto al
texto en escritorio; en móvil se muestran arriba. **Leer noticia** abre el
contenido completo y todas las imágenes, que pueden ampliarse. Cada noticia
tiene un enlace público que puede compartirse, sin requerir inicio de sesión.
La agenda usa portadas visuales y enlaza al módulo de eventos del usuario.

La API pública `/public/newsletter` muestra solamente publicaciones marcadas para publicación, con fecha de inicio alcanzada y sin fecha de cierre vencida. La fecha de cierre se incluye completa; el contenido deja de aparecer al día siguiente. Las fechas se interpretan en horario de Ciudad de México. La portada actualiza la consulta cada cinco minutos y al recuperar el foco.

Los eventos se gestionan desde **Coordinador → Eventos** y aparecen automáticamente si están activos y su fecha/hora todavía no ha pasado. No se publican datos de asistentes o usuarios. Los cupos y la inscripción se consultan al iniciar sesión.

## Imágenes y flyers

En el editor del boletín y en **Coordinador → Eventos → Editar**, la sección
**Imágenes y flyers** permite cargar hasta cinco imágenes por registro,
agregar una descripción accesible, ampliarlas y retirarlas. Al guardar una
publicación o crear un evento se habilita su galería para adjuntar material.

Se admiten JPG, PNG y WebP de hasta 8 MB y 25 megapíxeles, sin animación.
El servidor verifica y normaliza la imagen a WebP, corrige orientación y
limita sus dimensiones a 3200 píxeles conservando las proporciones.
La portada y el catálogo de eventos muestran las galerías con un visor
para ver los flyers completos. Los archivos PDF no forman parte de esta galería.

AWS usa el bucket S3 privado y cifrado existente; los archivos se sirven por
la API. Un borrador, una noticia vencida o un evento no vigente no expone
imágenes en la ruta pública. Coordinación puede consultar sus borradores
autenticándose; el portal autenticado conserva las imágenes de eventos.
La eliminación retira el registro y solicita borrado lógico en S3; el
versionado del bucket conserva versiones anteriores según su configuración.
Cada imagen añade almacenamiento y peticiones S3 al uso existente, sin crear
otro servicio. En desarrollo local los archivos se guardan en PostgreSQL.

La migración `295fe31b7422` crea la tabla de galerías y depende de
`184ed20a6311`; aplicarla antes de publicar el frontend actualizado.

## Contenido inicial del boletín

La migración `184ed20a6311` incorpora tres artículos informativos sobre servicios existentes del portal, publicados el 6 de octubre de 2026 y vigentes hasta el 6 de noviembre. No anuncian talleres o convocatorias sin confirmar. Coordinación puede sustituirlos o retirarlos con el editor. No se crean eventos de ejemplo en la base de datos.

Esta sección es un boletín web; no envía correos ni ofrece una suscripción por email.

## Instalación

Aplicar `alembic upgrade head` antes de servir el frontend actualizado. La migración depende de `073dc19b5210`. Los endpoints `/admin/publications` requieren una cuenta de coordinación; el endpoint público no requiere autenticación.
