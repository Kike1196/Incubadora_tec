export const roleNames = { estudiante: 'Emprendedor', admin: 'Coordinador', externo: 'Externo' };
export const rolePaths = { estudiante: 'emprendedor', admin: 'coordinador', externo: 'externo' };
export const demoPeople = { estudiante: 'Diego Ramírez', admin: 'Ana Martínez', externo: 'Karla Soto' };
export const specialties = ['Ing. en Sistemas', 'Ing. Industrial', 'Ing. en Gestión Empresarial', 'Ing. Mecatrónica'];
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
export const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
export const dateLabel = value => value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const uid = () => crypto.randomUUID();

export function initialData() {
  return {
    users: [
      { id: 'diego', nombre: 'Diego Ramírez', correo: 'diego.ramirez@its.edu.mx', rol: 'estudiante', especialidad: specialties[0] },
      { id: 'ana', nombre: 'Ana Martínez', correo: 'ana.martinez@its.edu.mx', rol: 'admin', especialidad: '' },
      { id: 'karla', nombre: 'Karla Soto', correo: 'karla.soto@example.com', rol: 'externo', especialidad: '' },
      { id: 'luis', nombre: 'Luis Peña', correo: 'luis.pena@its.edu.mx', rol: 'estudiante', especialidad: specialties[1] },
    ],
    projects: [
      { id: 'ecopack', nombre: 'EcoPack — empaques biodegradables', owner: 'diego', descripcion: 'Empaques biodegradables para sustituir plásticos de un solo uso en restaurantes locales.', fecha: '2026-02-12', progreso: 62, estatus: 'En proceso', especialidad: specialties[0], comentario: 'Buen avance en la validación técnica; falta reforzar el plan financiero antes de la siguiente tutoría.' },
      { id: 'agrosensor', nombre: 'AgroSensor IoT', owner: 'luis', descripcion: 'Sensores conectados para optimizar el riego agrícola.', fecha: '2025-09-03', progreso: 100, estatus: 'Completado', especialidad: specialties[1], comentario: '' },
      { id: 'ruta-verde', nombre: 'Ruta Verde Logística', owner: 'diego', descripcion: 'Planeación de rutas para una distribución más sostenible.', fecha: '2026-06-15', progreso: 20, estatus: 'Pendiente', especialidad: specialties[2], comentario: '' },
    ],
    milestones: [
      { id: 'm1', project: 'ecopack', hito: 'Prototipo funcional', notas: 'Se validó resistencia del empaque en pruebas de laboratorio.', fecha: '2026-06-18' },
      { id: 'm2', project: 'ecopack', hito: 'Alianza con proveedor', notas: 'Firma de convenio con proveedor de materia prima biodegradable.', fecha: '2026-07-02' },
      { id: 'm3', project: 'ecopack', hito: 'Prueba piloto', notas: 'Piloto con 3 restaurantes locales, retroalimentación positiva.', fecha: '2026-08-20' },
    ],
    tasks: [
      { id: 't1', project: 'ecopack', nombre: 'Cotizar empaque a mayor escala', estatus: 'Pendiente', fecha: '2026-08-25' },
      { id: 't2', project: 'ecopack', nombre: 'Actualizar ficha técnica', estatus: 'Completado', fecha: '2026-08-10' },
      { id: 't3', project: 'ruta-verde', nombre: 'Definir modelo de negocio', estatus: 'Pendiente', fecha: '2026-09-10' },
    ],
    events: [
      { id: 'pitch', nombre: 'Taller de Pitch Deck', tipo: 'Taller', fecha: '2026-09-22', hora: '18:00', cupo: 20, ocupados: 10, precio: 350, modalidad: 'Presencial', estatus: 'Activo', descripcion: 'Aprende a presentar tu proyecto con claridad. Incluye material de trabajo y constancia al completar la actividad.' },
      { id: 'feria', nombre: 'Feria de Emprendimiento ITS', tipo: 'Feria', fecha: '2026-09-18', hora: '10:00', cupo: 60, ocupados: 47, precio: 0, modalidad: 'Presencial', estatus: 'Activo', descripcion: 'Conecta con emprendedores y descubre los proyectos de nuestra comunidad.' },
      { id: 'finanzas', nombre: 'Finanzas para startups', tipo: 'Capacitación', fecha: '2026-10-01', hora: '16:00', cupo: 20, ocupados: 20, precio: 500, modalidad: 'En línea', estatus: 'Activo', descripcion: 'Herramientas para construir el plan financiero de tu emprendimiento.' },
      { id: 'bootcamp', nombre: 'Bootcamp de Validación de Negocio', tipo: 'Bootcamp', fecha: '2026-09-20', hora: '09:00', cupo: 30, ocupados: 0, precio: 750, modalidad: 'Presencial', estatus: 'Activo', descripcion: 'Valida tu propuesta de valor y conoce mejor a tus clientes.' },
    ],
    eventTypes: ['Taller', 'Feria', 'Capacitación', 'Bootcamp'],
    registrations: [{ id: 'r1', event: 'feria', user: 'diego', estatus: 'Confirmada' }, { id: 'r2', event: 'pitch', user: 'luis', estatus: 'Confirmada' }],
    payments: [{ id: 'P-1001', event: 'pitch', user: 'luis', importe: 350, estatus: 'Pagado', fecha: '2026-09-10' }],
    slots: [{ id: 's1', fecha: '2026-09-21', inicio: '09:00', fin: '10:00', coordinador: 'ana' }, { id: 's2', fecha: '2026-09-23', inicio: '10:00', fin: '11:00', coordinador: 'ana' }, { id: 's3', fecha: '2026-09-24', inicio: '09:00', fin: '10:00', coordinador: 'ana' }],
    appointments: [], requests: [], innovation: [],
    roles: [{ id: 'admin', nombre: 'Coordinador', descripcion: 'Administra usuarios, eventos, reportes y tutorías', permisos: 'Gestión total' }, { id: 'estudiante', nombre: 'Emprendedor', descripcion: 'Da seguimiento a su propio proyecto', permisos: 'Gestión de su proyecto' }, { id: 'externo', nombre: 'Externo', descripcion: 'Consulta eventos y solicita ingreso a la incubadora', permisos: 'Acceso limitado' }],
  };
}
