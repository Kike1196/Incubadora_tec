# Plantilla de registro institucional

`registro-original.docx` es la copia convertida con Microsoft Word del archivo
original `Formato_20de_20_Registro_c44747f4b0.doc`, código DGEST-MIdE-CI-F-01.
Se conservan portada, secciones, tablas, logos, estilos y pie de página.
No contiene datos de solicitantes.

SHA-256 de la plantilla: `23254d10f502efbbaa6b59358edbeaa2cd537dc698c427c7f0ed306de198aae3`.

El mapa de celdas está en `modules/compartido/registration_word.py`. Si se cambia
la plantilla, se debe revisar ese mapa y ejecutar las pruebas de exportación.
El generador modifica únicamente `word/document.xml` y `word/settings.xml` de
una copia en memoria. Las demás partes del paquete permanecen intactas.

Los campos de respuesta usan Arial 10; los controles y revisiones, Arial 9.
El espaciado de párrafos de respuesta es cero antes/después, con interlineado sencillo;
las filas de respuestas tienen altura mínima para evitar recortes. Los encabezados
con logos conservan sus alturas y anclajes originales. Las respuestas utilizan
una sangría de 2 puntos para aprovechar sus celdas sin alterar los anchos.
Se repite la tabla de socios cuando hay más de uno. Word actualiza los campos de
paginación al abrir el documento. La cantidad de páginas depende de las respuestas.

No se necesitan Microsoft Word ni LibreOffice en el servidor para generar la descarga.

## Revisiones por bloque

Los seis controles de Elaboró / Revisó / Revisó / Autorizó se guardan de forma
independiente en `administracion`, con claves `control.bloque_1.*` hasta
`control.bloque_6.*`. Cada uno contiene nombre, firma y fecha para los cuatro
responsables. El orden corresponde a las seis páginas de la plantilla original:

1. Identificación y solicitante principal (tabla 2).
2. Socios y datos de empresa hasta código postal (tabla 6).
3. Continuación de empresa, empleos, estratificación y clasificación (tabla 12).
4. Descripción, preguntas 1 a 5 (tabla 15).
5. Descripción, preguntas 6 a 8 (tabla 18).
6. Descripción, preguntas 9 a 11, cita y requisitos (tabla 21, fila 9).

Los registros antiguos conservan las claves generales `control.*`. La pantalla
las muestra como antecedente, sin asignarlas a un bloque. La exportación conserva
su comportamiento histórico hasta que se capture una revisión por bloque; desde
entonces solo imprime los valores de cada bloque, sin completar firmas faltantes
con la revisión general. `control.comentarios` sigue siendo común al registro.
