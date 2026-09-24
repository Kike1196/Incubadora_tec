import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel, money } from '../portal/data.js';
import { Badge, Empty, Field, Heading } from '../portal/ui.jsx';
import { occupied, closed } from './helpers.js';

export function Events() {
  const { data, register: registerEvent, remove, notify, paymentsMode } = usePortal();
  const { base, userId, role } = usePortalRoute();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const events = data.events.filter(e => e.estatus === 'Activo' && (!filter || e.tipo === filter) && e.nombre.toLowerCase().includes(search.toLowerCase()));
  async function register(event) {
    if (closed(event) || occupied(data, event) >= event.cupo || data.registrations.some(r => r.event === event.id && r.user === userId)) return;
    if (event.precio > 0) { navigate(`${base}/eventos/${event.id}/checkout`); return; }
    if (await registerEvent(event.id, userId)) notify('Inscripción confirmada. Puedes verla en Mis inscripciones.');
  }
  return <><Heading eyebrow={`${role === 'externo' ? 'EXTERNO' : 'EMPRENDEDOR'} / EVENTOS`} title="Aprende, conecta y emprende" description="Encuentra tu próxima actividad y sigue desarrollando tu proyecto." action={<Link className="button secondary" to={`${base}/inscripciones`}>Mis inscripciones</Link>} /><div className="filters"><Field label="Buscar evento" placeholder="Nombre de la actividad…" value={search} onChange={e => setSearch(e.target.value)} /><Field label="Tipo de evento" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos los tipos</option>{data.eventTypes.map(t => <option key={t}>{t}</option>)}</Field></div><div className="event-grid">{events.map(event => {
    const registered = data.registrations.some(r => r.event === event.id && r.user === userId);
    const full = occupied(data, event) >= event.cupo;
    return <article className="event-card" key={event.id}><div className="event-top"><span className="eyebrow">{event.tipo}</span><span className="date-tile">{event.fecha.slice(8)}<small>{new Date(event.fecha + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' })}</small></span></div><div className="event-content"><h2>{event.nombre}</h2><p className="muted">{event.descripcion}</p><dl className="event-meta"><div><dt>Fecha</dt><dd>{dateLabel(event.fecha)} · {event.hora}</dd></div><div><dt>Modalidad</dt><dd>{event.modalidad}</dd></div><div><dt>Lugares</dt><dd>{occupied(data, event)} / {event.cupo} ocupados</dd></div></dl><div className="row between"><strong className="price">{event.precio ? `${money(event.precio)} MXN` : 'Gratuito'}</strong><Badge>{registered ? 'Confirmada' : closed(event) ? 'Finalizado' : full ? 'Cupo lleno' : 'Disponible'}</Badge></div><button className="button full-width" disabled={registered || full || closed(event)} onClick={() => register(event)}>{registered ? 'Ya estás inscrito' : closed(event) ? 'Inscripciones cerradas' : full ? 'Sin cupo' : event.precio ? 'Ver inscripción y pago →' : 'Inscribirme'}</button></div></article>;
  })}</div>{!events.length && <Empty>No hay eventos que coincidan con tu búsqueda.</Empty>}</>;
}
