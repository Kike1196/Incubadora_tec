import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { usePortalRoute } from '../../shared/portal/PortalLayout.jsx';
import { dateLabel, money, uid } from '../../shared/portal/data.js';
import { Badge, Empty, Field, Heading, Modal, Panel, Table, TextArea, formValues } from '../../shared/portal/ui.jsx';
import { occupied } from '../../shared/events/helpers.js';

export function EventManagement({ initialTab = 'eventos' }) {
  const { data, update, remove, addType, notify } = usePortal();
  const { base } = usePortalRoute();
  const [tab, setTab] = useState(initialTab);
  const [eventId, setEventId] = useState(data.events[0]?.id || '');
  const [typeModal, setTypeModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const event = data.events.find(e => e.id === eventId);
  const registrations = data.registrations.filter(r => r.event === eventId);
  return <><Heading eyebrow="COORDINACIÓN / EVENTOS" title="Gestión de eventos" description="Organiza las actividades que hacen crecer a tu comunidad." action={<Link className="button" to={`${base}/eventos/nuevo`}>+ Nuevo evento</Link>} /><div className="tabs" aria-label="Secciones de eventos">{[['eventos', 'Eventos'], ['tipos', 'Tipos de evento'], ['inscripciones', 'Inscripciones']].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'eventos' && <Panel title="Eventos programados"><Table headings={['Evento', 'Tipo', 'Fecha', 'Cupo', 'Precio', 'Estatus', 'Acciones']} empty={!data.events.length}>{data.events.map(e => <tr key={e.id}><td><strong>{e.nombre}</strong><small>{e.modalidad}</small></td><td>{e.tipo}</td><td className="nowrap">{dateLabel(e.fecha)}</td><td>{occupied(data, e)} / {e.cupo}</td><td>{e.precio ? money(e.precio) : 'Gratuito'}</td><td><Badge>{e.estatus}</Badge></td><td><div className="row"><Link className="text-link" to={`${base}/eventos/${e.id}/editar`}>Editar</Link><button className="text-button danger" onClick={() => setDeleting(e)}>Desactivar</button></div></td></tr>)}</Table></Panel>}
    {tab === 'tipos' && <Panel><div className="row between"><h2>Tipos de evento</h2><button className="button small" onClick={() => setTypeModal(true)}>+ Nuevo tipo</button></div><Table headings={['Tipo', 'Eventos asociados']}>{data.eventTypes.map(t => <tr key={t}><td>{t}</td><td>{data.events.filter(e => e.tipo === t).length}</td></tr>)}</Table></Panel>}
    {tab === 'inscripciones' && <Panel title="Personas inscritas"><Field label="Selecciona un evento" value={eventId} onChange={e => setEventId(e.target.value)}>{data.events.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</Field><Table headings={['Nombre', 'Correo', 'Rol', 'Estatus', 'Acción']} empty={!registrations.length}>{registrations.map(r => { const user = data.users.find(u => u.id === r.user); return <tr key={r.id}><td>{user?.nombre || 'Usuario de demostración'}</td><td>{user?.correo || '—'}</td><td>{user?.rol === 'estudiante' ? 'Emprendedor' : 'Externo'}</td><td><Badge>{r.estatus}</Badge></td><td><button className="text-button danger" onClick={async () => { if (await remove('registrations', r.id)) notify('Inscripción cancelada.'); }}>Quitar</button></td></tr>; })}</Table>{event && <p className="helper">{occupied(data, event)} de {event.cupo} lugares ocupados. </p>}</Panel>}
    {typeModal && <Modal title="Nuevo tipo de evento" onClose={() => setTypeModal(false)}><form className="form-stack" onSubmit={async e => { e.preventDefault(); const name = formValues(e).nombre.trim(); if (!name || data.eventTypes.some(t => t.toLowerCase() === name.toLowerCase())) { setError('Escribe un tipo nuevo que no esté en el catálogo.'); return; } if (await addType(name)) { setTypeModal(false); setError(''); } }}><Field label="Nombre" name="nombre" required maxLength={60} />{error && <p className="error" role="alert">{error}</p>}<button className="button">Guardar tipo</button></form></Modal>}
    {deleting && <Modal title="Desactivar evento" onClose={() => setDeleting(null)}><p>Se cerrarán las nuevas inscripciones de <strong>{deleting.nombre}</strong>. Se conservarán los registros existentes.</p><div className="form-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button" onClick={async () => { if (await update('events', { ...deleting, estatus: 'Inactivo' })) { setDeleting(null); notify('Evento desactivado.'); } }}>Desactivar</button></div></Modal>}
  </>;
}
export function EventForm() {
  const { id } = useParams();
  const { data, update, notify } = usePortal();
  const { base } = usePortalRoute();
  const navigate = useNavigate();
  const existing = data.events.find(e => e.id === id);
  const [paid, setPaid] = useState(Boolean(existing?.precio));
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); const values = formValues(e);
    if (existing && Number(values.cupo) < occupied(data, existing)) { setError('El cupo no puede ser menor que las inscripciones existentes.'); return; }
    if (!await update('events', { ...existing, ...values, id: existing?.id || uid(), cupo: Number(values.cupo), precio: paid ? Number(values.precio) : 0, ocupados: existing?.ocupados || 0 })) return;
    notify('Evento guardado.'); navigate(`${base}/eventos`);
  }
  if (id && !existing) return <Empty>Evento no encontrado.</Empty>;
  return <><Heading title={existing ? 'Editar evento' : 'Nuevo evento'} description="Define la actividad, los lugares disponibles y su modalidad de inscripción." /><form className="form-stack" onSubmit={submit}><Panel title="Datos del evento"><div className="form-stack"><Field label="Nombre del evento" name="nombre" required maxLength={160} defaultValue={existing?.nombre} /><TextArea label="Descripción" name="descripcion" required maxLength={2000} defaultValue={existing?.descripcion} /><div className="form-grid"><Field label="Tipo" name="tipo" defaultValue={existing?.tipo}>{data.eventTypes.map(t => <option key={t}>{t}</option>)}</Field><Field label="Cupo" name="cupo" type="number" min="1" max="10000" required defaultValue={existing?.cupo || 30} /><Field label="Fecha" name="fecha" type="date" required defaultValue={existing?.fecha} /><Field label="Hora" name="hora" type="time" required defaultValue={existing?.hora || '09:00'} /><Field label="Modalidad" name="modalidad" defaultValue={existing?.modalidad || 'Presencial'}>{['Presencial', 'En línea', 'Híbrida'].map(t => <option key={t}>{t}</option>)}</Field><Field label="Estatus" name="estatus" defaultValue={existing?.estatus || 'Activo'}>{['Activo', 'Pendiente', 'Inactivo'].map(t => <option key={t}>{t}</option>)}</Field></div></div></Panel><Panel title="Inscripción y cobro"><label className="checkbox-label"><input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} /> Este evento requiere pago</label>{paid && <Field label="Precio por persona (MXN)" name="precio" type="number" min="1" max="100000" step="0.01" required defaultValue={existing?.precio || 350} />}<p className="helper">{paid ? 'El lugar se confirma después del pago de prueba. No se realizan cobros reales.' : 'La inscripción no tiene costo y se confirma al reservar un lugar.'}</p></Panel>{error && <p className="error" role="alert">{error}</p>}<div className="form-actions"><Link className="button secondary" to={`${base}/eventos`}>Cancelar</Link><button className="button">Guardar evento</button></div></form></>;
}
