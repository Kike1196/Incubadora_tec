import { Link } from 'react-router-dom';
import { usePortal } from './PortalContext.jsx';
import { usePortalRoute } from './PortalLayout.jsx';
import { demoPeople, dateLabel } from './data.js';
import { Badge, Heading, Panel, Progress, Stats } from './ui.jsx';

export default function Home() {
  const { data, user, preview } = usePortal();
  const { role, base, userId } = usePortalRoute();
  const projects = data.projects.filter(p => role === 'admin' || p.owner === userId || data.members?.some(m => m.proyecto_id === p.id && m.usuario_id === userId));
  const project = projects[0];
  const modules = role === 'admin' ? [
    ['usuarios', '01', 'Usuarios', 'Alta, edición y baja de cuentas.'], ['roles', '02', 'Roles', 'Consulta los permisos por tipo de usuario.'], ['eventos', '03', 'Eventos', 'Actividades, tipos e inscripciones.'], ['reportes', '04', 'Reportes', 'Proyectos, emprendedores y estadísticas.'], ['tutorias', '05', 'Tutorías', 'Organiza tu agenda y disponibilidad.'], ['seguimiento', '06', 'Seguimiento', 'Avances y tareas de cada proyecto.'], ['pagos', '07', 'Pagos', 'Cobros, movimientos y comprobantes.'], ['solicitudes', '08', 'Solicitudes', 'Revisa las propuestas de ingreso.'], ['registros', '09', 'Registros', 'Revisa formularios y anexos antes de aprobar el proyecto.'],
  ] : role === 'externo' ? [
    ['eventos', '01', 'Eventos', 'Conoce e inscríbete a las actividades de la incubadora.'], ['solicitud', '02', 'Solicitar ingreso', 'Cuéntanos tu idea y comienza tu camino como emprendedor.'], ['inscripciones', '03', 'Mis inscripciones', 'Consulta tus actividades y el estado de tu registro.'], ['pagos', '04', 'Mis pagos', 'Revisa tus pagos y comprobantes.'],
  ] : [
    ['proyectos', '01', 'Mis proyectos', 'Consulta y da seguimiento a tus ideas en incubación.'], ['avances', '02', 'Mis avances', 'Registra hitos, notas y tareas de tu proyecto.'], ['eventos', '03', 'Eventos', 'Participa en talleres, ferias y capacitaciones.'], ['tutorias', '04', 'Tutorías', 'Agenda una sesión con tu coordinador.'],
  ];
  return <><Heading eyebrow={role === 'admin' ? 'COORDINACIÓN / INICIO' : 'TU ESPACIO DE EMPRENDIMIENTO'} title={role === 'admin' ? 'Panel de coordinación' : `Hola, ${(preview ? demoPeople[role] : user?.nombre || '').split(' ')[0]}`} description={role === 'admin' ? 'Una vista de tu comunidad y las herramientas para acompañarla.' : 'Cada paso acerca tu idea a convertirse en una empresa.'} />
    {role !== 'externo' && <Stats items={role === 'admin' ? [['Proyectos', projects.length], ['Emprendedores', data.users.filter(u => u.rol === 'estudiante').length], ['Eventos activos', data.events.filter(e => e.estatus === 'Activo').length], ['Progreso promedio', `${Math.round(projects.reduce((sum, p) => sum + p.progreso, 0) / (projects.length || 1))}%`]] : [['Progreso del proyecto', `${project?.progreso || 0}%`], ['Tareas pendientes', data.tasks.filter(t => projects.some(p => p.id === t.project) && t.estatus === 'Pendiente').length], ['Tutorías próximas', data.appointments.filter(a => a.user === userId && a.estatus === 'Confirmada').length], ['Eventos inscritos', data.registrations.filter(r => r.user === userId && r.estatus === 'Confirmada').length]]} />}
    <div className="module-grid">{modules.map(([path, number, title, description]) => <Link className="module-card" key={path} to={`${base}/${path}`}><span className="module-number">{number}</span><h2>{title}</h2><p>{description}</p><span className="module-arrow" aria-hidden="true">↗</span></Link>)}</div>
    <div className="two-columns"><Panel title={role === 'externo' ? 'Tu próxima oportunidad' : 'Continúa donde te quedaste'}>{role === 'externo' ? <><p>¿Tienes una idea de negocio? La incubadora te acompaña a convertirla en un proyecto.</p><Link className="button secondary" to={`${base}/solicitud`}>Conocer el proceso →</Link></> : project ? <><div className="row between"><h3>{project.nombre}</h3><Badge>{project.estatus}</Badge></div><p className="muted">{project.descripcion}</p><Progress value={project.progreso} /><Link className="text-link" to={`${base}/${role === 'admin' ? 'seguimiento' : 'proyectos'}/${project.id}`}>Ver proyecto →</Link></> : <p>Aquí verás el seguimiento de tus proyectos.</p>}</Panel><Panel title="En la agenda"><div className="agenda-list">{data.events.filter(e => e.estatus === 'Activo').slice(0, 3).map(event => <Link key={event.id} to={`${base}/eventos`}><span className="date-tile">{event.fecha.slice(8)}<small>{new Date(event.fecha + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' })}</small></span><div><strong>{event.nombre}</strong><small>{event.tipo} · {dateLabel(event.fecha)}</small></div><span>→</span></Link>)}</div></Panel></div>
  </>;
}
