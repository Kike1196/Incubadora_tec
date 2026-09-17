import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePortal } from './PortalContext';
import { usePortalRoute } from './PortalLayout';
import { dateLabel, specialties, today, uid } from './data';
import { Badge, Empty, Field, Heading, Modal, Panel, Progress, Table, TextArea, formValues } from './ui';

export function Projects() {
  const { data } = usePortal();
  const { role, base, userId } = usePortalRoute();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const coordinator = role === 'admin';
  const rows = data.projects.filter(p => (coordinator || p.owner === userId) && p.nombre.toLowerCase().includes(search.toLowerCase()) && (!status || p.estatus === status));
  const path = coordinator ? 'seguimiento' : 'proyectos';
  return <><Heading eyebrow={coordinator ? 'COORDINACIÓN / SEGUIMIENTO' : 'EMPRENDEDOR / PROYECTOS'} title={coordinator ? 'Seguimiento de proyectos' : 'Mis proyectos'} description="De la primera idea a los resultados. Todo tu seguimiento en un solo lugar." action={!coordinator && <Link className="button" to={`${base}/proyectos/nuevo`}>+ Nuevo proyecto</Link>} /><Panel><div className="filters"><Field label="Buscar proyecto" placeholder="Nombre del proyecto…" value={search} onChange={e => setSearch(e.target.value)} /><Field label="Estatus" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estatus</option>{['Pendiente', 'En proceso', 'Completado'].map(s => <option key={s}>{s}</option>)}</Field></div><Table headings={['Proyecto', coordinator ? 'Emprendedor' : 'Inicio', 'Progreso', 'Estatus', coordinator ? 'Tareas abiertas' : 'Formato', 'Acciones']} empty={!rows.length}>{rows.map(p => <tr key={p.id}><td><strong>{p.nombre}</strong><small>{p.especialidad}</small></td><td>{coordinator ? data.users.find(u => u.id === p.owner)?.nombre || 'Sin asignar' : dateLabel(p.fecha)}</td><td><Progress value={p.progreso} /></td><td><Badge>{p.estatus}</Badge></td><td>{coordinator ? data.tasks.filter(t => t.project === p.id && t.estatus === 'Pendiente').length : p.file ? <a className="text-link" href={p.file.data} download={p.file.name}>Descargar</a> : <span className="muted">Sin adjunto</span>}</td><td><div className="row"><Link className="text-link" to={`${base}/${path}/${p.id}`}>Ver</Link>{!coordinator && <Link className="text-link" to={`${base}/proyectos/${p.id}/editar`}>Editar</Link>}</div></td></tr>)}</Table></Panel></>;
}

export function ProjectForm() {
  const { id } = useParams();
  const { data, update, notify } = usePortal();
  const { base, userId } = usePortalRoute();
  const navigate = useNavigate();
  const existing = data.projects.find(p => p.id === id && p.owner === userId);
  const [file, setFile] = useState(existing?.file);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  async function attach(event) {
    const chosen = event.target.files[0]; setError('');
    if (!chosen) return;
    if (!/\.(pdf|doc|docx)$/i.test(chosen.name) || chosen.size > 5 * 1024 * 1024) { setError('Selecciona un PDF, DOC o DOCX de hasta 5 MB.'); event.target.value = ''; return; }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { setFile({ name: chosen.name, data: reader.result }); setReading(false); };
    reader.onerror = () => { setError('No se pudo leer el archivo. Inténtalo de nuevo.'); setReading(false); };
    reader.readAsDataURL(chosen);
  }
  function save(event) {
    event.preventDefault(); const values = formValues(event);
    const progreso = values.estatus === 'Completado' ? 100 : values.estatus === 'Pendiente' ? 0 : Math.min(existing?.progreso || 0, 99);
    update('projects', { ...existing, ...values, id: existing?.id || uid(), owner: userId, progreso, file, comentario: existing?.comentario || '' });
    notify('Proyecto guardado en esta demostración.'); navigate(`${base}/proyectos`);
  }
  if (id && !existing) return <Empty>No se encontró el proyecto.</Empty>;
  return <><Heading title={existing ? 'Editar proyecto' : 'Nuevo proyecto'} description="Cuéntanos qué estás construyendo y da el primer paso." /><form onSubmit={save}><div className="two-columns form-columns"><Panel title="Información del proyecto"><div className="form-stack"><Field label="Nombre del proyecto" name="nombre" required maxLength={140} defaultValue={existing?.nombre} placeholder="Ej. EcoPack — empaques biodegradables" /><TextArea label="Descripción" name="descripcion" required maxLength={3000} defaultValue={existing?.descripcion} placeholder="¿Qué problema resuelve tu proyecto?" /><div className="form-grid"><Field label="Fecha de inicio" type="date" name="fecha" required defaultValue={existing?.fecha || today()} /><Field label="Estatus" name="estatus" defaultValue={existing?.estatus || 'Pendiente'}>{['Pendiente', 'En proceso', 'Completado'].map(s => <option key={s}>{s}</option>)}</Field></div><Field label="Especialidad" name="especialidad" defaultValue={existing?.especialidad || specialties[0]}>{specialties.map(s => <option key={s}>{s}</option>)}</Field></div></Panel><Panel title="Formato de registro"><p className="muted">Adjunta el formato de tu proyecto para consultarlo desde el listado.</p><label className="upload-box"><span aria-hidden="true">↑</span><strong>{file ? file.name : 'Selecciona tu archivo'}</strong><small>PDF, DOC o DOCX · Máximo 5 MB</small><input aria-label="Formato de registro" type="file" accept=".pdf,.doc,.docx" onChange={attach} /></label>{file && <button type="button" className="text-button" onClick={() => setFile(undefined)}>Quitar archivo</button>}{error && <p role="alert" className="error">{error}</p>}<p className="helper">El adjunto permanece solo durante esta vista de demostración.</p></Panel></div><div className="form-actions"><Link className="button secondary" to={`${base}/proyectos`}>Cancelar</Link><button className="button" disabled={reading}>{reading ? 'Leyendo archivo…' : 'Guardar proyecto'}</button></div></form></>;
}

export function ProjectDetail({ advances = false }) {
  const { id } = useParams();
  const { data, update, notify } = usePortal();
  const { role, userId } = usePortalRoute();
  const projects = data.projects.filter(p => role === 'admin' || p.owner === userId);
  const [selected, setSelected] = useState(id || projects[0]?.id || '');
  const [modal, setModal] = useState('');
  const project = projects.find(p => p.id === selected);
  const milestones = data.milestones.filter(m => m.project === selected);
  const tasks = data.tasks.filter(t => t.project === selected);
  function saveMilestone(e) {
    e.preventDefault(); const values = formValues(e);
    update('milestones', { id: uid(), project: selected, hito: values.hito, notas: values.notas, fecha: values.fecha });
    update('projects', { ...project, progreso: Number(values.progreso), estatus: Number(values.progreso) === 100 ? 'Completado' : Number(values.progreso) > 0 ? 'En proceso' : 'Pendiente' });
    setModal(''); notify('Avance registrado en la demostración.');
  }
  return <><Heading eyebrow={role === 'admin' ? 'COORDINACIÓN / SEGUIMIENTO' : 'EMPRENDEDOR / AVANCES'} title={advances ? 'Avances de mi proyecto' : project?.nombre || 'Proyecto no encontrado'} description="Registra cada hito y mantén a tu equipo al tanto." action={project && role !== 'admin' && <button className="button" onClick={() => setModal('avance')}>+ Registrar avance</button>} />
    {advances && <div className="project-selector"><Field label="Proyecto" value={selected} onChange={e => setSelected(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Field></div>}
    {!project ? <Empty>No hay un proyecto disponible. Crea uno desde Mis proyectos.</Empty> : <><Panel><div className="row between"><div><h2>{project.nombre}</h2><p className="muted">{data.users.find(u => u.id === project.owner)?.nombre} · Desde {dateLabel(project.fecha)}</p></div><Badge>{project.estatus}</Badge></div><p>{project.descripcion}</p><div className="progress-section"><strong>Progreso general</strong><Progress value={project.progreso} /></div></Panel><Panel title="Bitácora de avances"><Table headings={['Hito', 'Notas', 'Fecha']} empty={!milestones.length}>{milestones.map(m => <tr key={m.id}><td><strong>{m.hito}</strong></td><td>{m.notas}</td><td className="nowrap">{dateLabel(m.fecha)}</td></tr>)}</Table></Panel><Panel><div className="row between"><h2>Tareas del proyecto</h2><button className="button secondary small" onClick={() => setModal('tarea')}>+ Agregar tarea</button></div><Table headings={['Tarea', 'Estatus', 'Creada', 'Acción']} empty={!tasks.length}>{tasks.map(t => <tr key={t.id}><td>{t.nombre}</td><td><Badge>{t.estatus}</Badge></td><td>{dateLabel(t.fecha)}</td><td><button className="text-button" onClick={() => { update('tasks', { ...t, estatus: t.estatus === 'Pendiente' ? 'Completado' : 'Pendiente' }); }}>{t.estatus === 'Pendiente' ? 'Completar' : 'Reabrir'}</button></td></tr>)}</Table></Panel><Panel title="Comentario del coordinador">{role === 'admin' ? <form onSubmit={e => { e.preventDefault(); update('projects', { ...project, comentario: formValues(e).comentario }); notify('Comentario guardado en la demostración.'); }}><TextArea label="Orientación para el emprendedor" name="comentario" defaultValue={project.comentario} maxLength={2000} /><button className="button small">Guardar comentario</button></form> : <p>{project.comentario || 'Todavía no hay comentarios de tu coordinador.'}</p>}</Panel></>}
    {modal === 'avance' && <Modal title="Registrar avance" onClose={() => setModal('')}><form className="form-stack" onSubmit={saveMilestone}><Field label="Hito" name="hito" required maxLength={140} /><TextArea label="Notas" name="notas" required maxLength={2000} /><div className="form-grid"><Field label="Fecha" name="fecha" type="date" defaultValue={today()} required /><Field label="Progreso general (%)" name="progreso" type="number" min="0" max="100" defaultValue={project.progreso} required /></div><button className="button">Guardar avance</button></form></Modal>}
    {modal === 'tarea' && <Modal title="Nueva tarea" onClose={() => setModal('')}><form className="form-stack" onSubmit={e => { e.preventDefault(); update('tasks', { id: uid(), project: selected, nombre: formValues(e).nombre, estatus: 'Pendiente', fecha: today() }); setModal(''); }}><Field label="¿Qué hay que hacer?" name="nombre" required maxLength={200} /><button className="button">Agregar tarea</button></form></Modal>}
  </>;
}
