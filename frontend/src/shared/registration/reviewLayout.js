// Order and boundaries taken from the six pages of registro-original.docx.
export function registrationSections(spec) {
  const sections = Object.fromEntries(spec.sections.map(section => [section.id, section]));
  const part = (id, suffix, fields, title) => ({ ...sections[id], layoutKey: `${id}-${suffix}`, fields, title });
  const review = (number, scope) => ({ id: 'review_block', layoutKey: `review-${number}`, prefix: `control.bloque_${number}`, title: `Revisión del bloque ${number} de 6`, scope });
  const companyStart = new Set(['nombre', 'rfc', 'calle', 'interior', 'exterior', 'cp']);
  const description = sections.descripcion;
  return [
    sections.identificacion, sections.principal,
    review(1, 'Identificación del formato y datos del solicitante principal'),
    sections.socio,
    part('empresa', 'inicio', sections.empresa.fields.filter(f => companyStart.has(f.key)), sections.empresa.title),
    review(2, 'Datos de los socios e inicio de los datos del proyecto / empresa'),
    part('empresa', 'continuacion', sections.empresa.fields.filter(f => !companyStart.has(f.key)), `${sections.empresa.title} — continuación`),
    sections.empleos, sections.estratificacion, sections.clasificacion,
    review(3, 'Contacto de la empresa, puestos de trabajo, estratificación y clasificación'),
    part('descripcion', '1-5', description.fields.slice(0, 5), `${description.title} — preguntas 1 a 5`),
    review(4, 'Descripción del proyecto / empresa: preguntas 1 a 5'),
    part('descripcion', '6-8', description.fields.slice(5, 8), `${description.title} — preguntas 6 a 8`),
    review(5, 'Descripción del proyecto / empresa: preguntas 6 a 8'),
    part('descripcion', '9-11', description.fields.slice(8), `${description.title} — preguntas 9 a 11`),
    sections.cita, sections.requisitos,
    review(6, 'Descripción: preguntas 9 a 11, cita y requisitos de ingreso'),
    sections.control,
  ];
}
