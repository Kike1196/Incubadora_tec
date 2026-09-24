import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { usePortalRoute } from '../../shared/portal/PortalLayout.jsx';
import { dateLabel, specialties } from '../../shared/portal/data.js';
import { Badge, Field, Heading, Panel, Stats, Table, exportCSV } from '../../shared/portal/ui.jsx';


export function Reports({ initialTab = 'proyectos' }) {
  const { data } = usePortal();
  const { base } = usePortalRoute();
  const [tab, setTab] = useState(initialTab);
  const [specialty, setSpecialty] = useState('');
  const [status, setStatus] = useState('');
  const projects = data.projects.filter(p => (!specialty || p.especialidad === specialty) && (!status || p.estatus === status));
  const users = data.users.filter(u => u.rol === 'estudiante' && (!specialty || u.especialidad === specialty));
  const milestones = data.milestones.filter(m => projects.some(p => p.id === m.project));
  const headings = tab === 'emprendedores' ? ['Nombre', 'Correo', 'Especialidad', 'Proyectos'] : tab === 'avances' ? ['Proyecto', 'Hito', 'Notas', 'Fecha'] : ['Proyecto', 'Especialidad', 'Inicio', 'Progreso', 'Estatus'];
  const rows = tab === 'emprendedores' ? users.map(u => [u.nombre, u.correo, u.especialidad, data.projects.filter(p => p.owner === u.id).length]) : tab === 'avances' ? milestones.map(m => [data.projects.find(p => p.id === m.project)?.nombre, m.hito, m.notas, dateLabel(m.fecha)]) : projects.map(p => [p.nombre, p.especialidad, dateLabel(p.fecha), `${p.progreso}%`, p.estatus]);
  return <><Heading eyebrow="COORDINACIÓN / REPORTES" title="Información para acompañar mejor" description="Consulta, filtra y exporta el seguimiento de la incubadora." action={tab !== 'estadisticas' && <button className="button secondary" onClick={() => exportCSV(`reporte-${tab}.csv`, headings, rows)}>Exportar CSV para Excel</button>} /><div className="tabs">{[['emprendedores', 'Emprendedores'], ['proyectos', 'Proyectos'], ['avances', 'Avances'], ['estadisticas', 'Estadísticas']].map(([id, name]) => <button key={id} aria-pressed={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{name}</button>)}</div><div className="filters"><Field label="Especialidad" value={specialty} onChange={e => setSpecialty(e.target.value)}><option value="">Todas las especialidades</option>{specialties.map(s => <option key={s}>{s}</option>)}</Field>{tab !== 'emprendedores' && <Field label="Estatus de proyecto" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estatus</option>{['Pendiente', 'En revisión', 'En proceso', 'En incubación', 'Completado'].map(s => <option key={s}>{s}</option>)}</Field>}</div>
    {tab === 'estadisticas' ? <><Stats items={[[ 'Proyectos', projects.length], ['Emprendedores', users.length], ['Eventos activos', data.events.filter(e => e.estatus === 'Activo').length], ['Progreso promedio', `${Math.round(projects.reduce((sum, p) => sum + p.progreso, 0) / (projects.length || 1))}%`]]} /><div className="two-columns"><Panel title="Proyectos por especialidad">{specialties.map(s => { const count = projects.filter(p => p.especialidad === s).length; return <div className="chart-row" key={s}><div className="row between"><span>{s}</span><strong>{count}</strong></div><meter min="0" max={Math.max(projects.length, 1)} value={count} aria-label={`${s}: ${count} proyectos`} /></div>; })}</Panel><Panel title="Estatus de proyectos">{['Pendiente', 'En revisión', 'En proceso', 'En incubación', 'Completado'].map(s => <div className="status-row" key={s}><Badge>{s}</Badge><strong>{projects.filter(p => p.estatus === s).length}</strong></div>)}<Link className="text-link" to={`${base}/seguimiento`}>Ir al seguimiento →</Link></Panel></div></> : <Panel title={`Reporte de ${tab}`}><Table headings={headings} empty={!rows.length}>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{j === 0 ? <strong>{cell}</strong> : cell}</td>)}</tr>)}</Table></Panel>}
  </>;
}
