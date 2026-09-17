import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePortal } from './PortalContext';
import { usePortalRoute } from './PortalLayout';
import { dateLabel, money, today, uid } from './data';
import { Badge, Empty, Field, Heading, Modal, Panel, Stats, Table, TextArea, download, exportCSV, formValues } from './ui';

export const occupied = (data, event) => event.ocupados + data.registrations.filter(r => r.event === event.id && r.estatus === 'Confirmada').length;
const closed = event => event.estatus !== 'Activo' || event.fecha < today();
export function Events() {
  const { data, setData, notify } = usePortal();
  const { base, userId, role } = usePortalRoute();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const events = data.events.filter(e => e.estatus === 'Activo' && (!filter || e.tipo === filter) && e.nombre.toLowerCase().includes(search.toLowerCase()));
  function register(event) {
    if (closed(event) || occupied(data, event) >= event.cupo || data.registrations.some(r => r.event === event.id && r.user === userId)) return;
    if (event.precio > 0) { navigate(`${base}/eventos/${event.id}/checkout`); return; }
    setData(previous => {
      const current = previous.events.find(e => e.id === event.id);
      if (!current || occupied(previous, current) >= current.cupo || previous.registrations.some(r => r.event === event.id && r.user === userId)) return previous;
      return { ...previous, registrations: [...previous.registrations, { id: uid(), event: event.id, user: userId, estatus: 'Confirmada' }] };
    });
    notify('Inscripción de demostración confirmada. Puedes verla en Mis inscripciones.');
  }
  return <><Heading eyebrow={`${role === 'externo' ? 'EXTERNO' : 'EMPRENDEDOR'} / EVENTOS`} title="Aprende, conecta y emprende" description="Encuentra tu próxima actividad y sigue desarrollando tu proyecto." action={<Link className="button secondary" to={`${base}/inscripciones`}>Mis inscripciones</Link>} /><div className="filters"><Field label="Buscar evento" placeholder="Nombre de la actividad…" value={search} onChange={e => setSearch(e.target.value)} /><Field label="Tipo de evento" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos los tipos</option>{data.eventTypes.map(t => <option key={t}>{t}</option>)}</Field></div><div className="event-grid">{events.map(event => {
    const registered = data.registrations.some(r => r.event === event.id && r.user === userId);
    const full = occupied(data, event) >= event.cupo;
    return <article className="event-card" key={event.id}><div className="event-top"><span className="eyebrow">{event.tipo}</span><span className="date-tile">{event.fecha.slice(8)}<small>{new Date(event.fecha + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short' })}</small></span></div><div className="event-content"><h2>{event.nombre}</h2><p className="muted">{event.descripcion}</p><dl className="event-meta"><div><dt>Fecha</dt><dd>{dateLabel(event.fecha)} · {event.hora}</dd></div><div><dt>Modalidad</dt><dd>{event.modalidad}</dd></div><div><dt>Lugares</dt><dd>{occupied(data, event)} / {event.cupo} ocupados</dd></div></dl><div className="row between"><strong className="price">{event.precio ? `${money(event.precio)} MXN` : 'Gratuito'}</strong><Badge>{registered ? 'Confirmada' : closed(event) ? 'Finalizado' : full ? 'Cupo lleno' : 'Disponible'}</Badge></div><button className="button full-width" disabled={registered || full || closed(event)} onClick={() => register(event)}>{registered ? 'Ya estás inscrito' : closed(event) ? 'Inscripciones cerradas' : full ? 'Sin cupo' : event.precio ? 'Ver inscripción y pago →' : 'Inscribirme'}</button></div></article>;
  })}</div>{!events.length && <Empty>No hay eventos que coincidan con tu búsqueda.</Empty>}</>;
}

export function EventManagement({ initialTab = 'eventos' }) {
  const { data, update, setData, notify } = usePortal();
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
    {tab === 'inscripciones' && <Panel title="Personas inscritas"><Field label="Selecciona un evento" value={eventId} onChange={e => setEventId(e.target.value)}>{data.events.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</Field><Table headings={['Nombre', 'Correo', 'Rol', 'Estatus', 'Acción']} empty={!registrations.length}>{registrations.map(r => { const user = data.users.find(u => u.id === r.user); return <tr key={r.id}><td>{user?.nombre || 'Usuario de demostración'}</td><td>{user?.correo || '—'}</td><td>{user?.rol === 'estudiante' ? 'Emprendedor' : 'Externo'}</td><td><Badge>{r.estatus}</Badge></td><td><button className="text-button danger" onClick={() => { if (data.payments.some(p => p.event === r.event && p.user === r.user && p.estatus === 'Pagado')) { notify('Esta inscripción tiene un pago asociado. La cancelación y el reembolso requieren la integración de pagos.'); return; } setData(previous => ({ ...previous, registrations: previous.registrations.filter(row => row.id !== r.id) })); notify('Inscripción eliminada de la demostración.'); }}>Quitar</button></td></tr>; })}</Table>{event && <p className="helper">{occupied(data, event)} de {event.cupo} lugares ocupados. El total incluye asistentes de ejemplo sin ficha individual.</p>}</Panel>}
    {typeModal && <Modal title="Nuevo tipo de evento" onClose={() => setTypeModal(false)}><form className="form-stack" onSubmit={e => { e.preventDefault(); const name = formValues(e).nombre.trim(); if (!name || data.eventTypes.some(t => t.toLowerCase() === name.toLowerCase())) { setError('Escribe un tipo nuevo que no esté en el catálogo.'); return; } setData(previous => ({ ...previous, eventTypes: [...previous.eventTypes, name] })); setTypeModal(false); setError(''); }}><Field label="Nombre" name="nombre" required maxLength={60} />{error && <p className="error" role="alert">{error}</p>}<button className="button">Guardar tipo</button></form></Modal>}
    {deleting && <Modal title="Desactivar evento" onClose={() => setDeleting(null)}><p>Se cerrarán las nuevas inscripciones de <strong>{deleting.nombre}</strong>. Se conservarán los registros existentes.</p><div className="form-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button" onClick={() => { update('events', { ...deleting, estatus: 'Inactivo' }); setDeleting(null); notify('Evento desactivado en la demostración.'); }}>Desactivar</button></div></Modal>}
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
  function submit(e) {
    e.preventDefault(); const values = formValues(e);
    if (existing && Number(values.cupo) < occupied(data, existing)) { setError('El cupo no puede ser menor que las inscripciones existentes.'); return; }
    update('events', { ...existing, ...values, id: existing?.id || uid(), cupo: Number(values.cupo), precio: paid ? Number(values.precio) : 0, ocupados: existing?.ocupados || 0 });
    notify('Evento guardado en el catálogo de demostración.'); navigate(`${base}/eventos`);
  }
  if (id && !existing) return <Empty>Evento no encontrado.</Empty>;
  return <><Heading title={existing ? 'Editar evento' : 'Nuevo evento'} description="Define la actividad, los lugares disponibles y su modalidad de inscripción." /><form className="form-stack" onSubmit={submit}><Panel title="Datos del evento"><div className="form-stack"><Field label="Nombre del evento" name="nombre" required maxLength={160} defaultValue={existing?.nombre} /><TextArea label="Descripción" name="descripcion" required maxLength={2000} defaultValue={existing?.descripcion} /><div className="form-grid"><Field label="Tipo" name="tipo" defaultValue={existing?.tipo}>{data.eventTypes.map(t => <option key={t}>{t}</option>)}</Field><Field label="Cupo" name="cupo" type="number" min="1" max="10000" required defaultValue={existing?.cupo || 30} /><Field label="Fecha" name="fecha" type="date" required defaultValue={existing?.fecha} /><Field label="Hora" name="hora" type="time" required defaultValue={existing?.hora || '09:00'} /><Field label="Modalidad" name="modalidad" defaultValue={existing?.modalidad || 'Presencial'}>{['Presencial', 'En línea', 'Híbrida'].map(t => <option key={t}>{t}</option>)}</Field><Field label="Estatus" name="estatus" defaultValue={existing?.estatus || 'Activo'}>{['Activo', 'Pendiente', 'Inactivo'].map(t => <option key={t}>{t}</option>)}</Field></div></div></Panel><Panel title="Inscripción y cobro"><label className="checkbox-label"><input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} /> Este evento requiere pago</label>{paid && <Field label="Precio por persona (MXN)" name="precio" type="number" min="1" max="100000" step="0.01" required defaultValue={existing?.precio || 350} />}<p className="helper">{paid ? 'El lugar se confirma únicamente después de un pago aprobado. En esta demostración se simula el resultado.' : 'La inscripción no tiene costo y se confirma al reservar un lugar.'}</p></Panel>{error && <p className="error" role="alert">{error}</p>}<div className="form-actions"><Link className="button secondary" to={`${base}/eventos`}>Cancelar</Link><button className="button">Guardar evento</button></div></form></>;
}

export function Checkout() {
  const { id } = useParams();
  const { data, setData, notify } = usePortal();
  const { base, userId } = usePortalRoute();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState('Pagado');
  const event = data.events.find(e => e.id === id);
  if (!event) return <Empty>Evento no encontrado.</Empty>;
  const registered = data.registrations.some(r => r.event === id && r.user === userId);
  const unavailable = registered || closed(event) || occupied(data, event) >= event.cupo;
  function pay(e) {
    e.preventDefault();
    if (unavailable) return;
    if (result === 'Rechazado') { setError('Pago de prueba rechazado. Tu inscripción no se confirmó y no se realizó ningún cargo. Puedes volver a intentarlo.'); return; }
    setData(previous => {
      const current = previous.events.find(e => e.id === id);
      if (!current || closed(current) || occupied(previous, current) >= current.cupo || previous.registrations.some(r => r.event === id && r.user === userId)) return previous;
      return { ...previous, payments: [...previous.payments, { id: `DEMO-${uid().slice(0, 8)}`, event: id, user: userId, importe: current.precio, fecha: today(), estatus: 'Pagado' }], registrations: [...previous.registrations, { id: uid(), event: id, user: userId, estatus: 'Confirmada' }] };
    });
    notify('Pago simulado aprobado e inscripción de demostración confirmada. No se realizó ningún cobro.'); navigate(`${base}/pagos`);
  }
  return <><Heading title="Confirma tu inscripción" description="Revisa los detalles de tu actividad antes de continuar." /><ol className="checkout-steps"><li>1 · Seleccionar evento</li><li className="active">2 · Confirmar datos</li><li>3 · Pago</li><li>4 · Comprobante</li></ol><div className="two-columns"><Panel title={event.nombre}><p className="muted">{dateLabel(event.fecha)} · {event.hora} · {event.modalidad}</p><p>{event.descripcion}</p><hr /><div className="row between"><strong>Total de inscripción</strong><strong className="checkout-total">{money(event.precio)} <small>MXN</small></strong></div><p className="helper">Incluye acceso a la actividad. Constancia al cumplir los requisitos de participación.</p></Panel><Panel title="Método de pago"><form className="form-stack" onSubmit={pay}><div className="payment-method">Tarjeta · Checkout seguro del proveedor</div><p className="info-box">La pasarela institucional todavía no está conectada. Aquí puedes probar el flujo sin introducir datos bancarios ni realizar cobros.</p><Field label="Resultado de la simulación" value={result} onChange={e => { setResult(e.target.value); setError(''); }}><option>Pagado</option><option>Rechazado</option></Field><label className="checkbox-label"><input type="checkbox" required /> Revisé el evento, su fecha y el importe.</label>{error && <p className="error" role="alert">{error}</p>}{unavailable && <p role="status">{registered ? 'Ya tienes una inscripción para este evento.' : 'El evento ya no está disponible o no tiene cupo.'}</p>}<button className="button" disabled={unavailable}>Simular pago de prueba</button><Link className="text-link" to={`${base}/eventos`}>← Volver a los eventos</Link></form></Panel></div></>;
}

export function Payments() {
  const { data } = usePortal();
  const { role, userId, base } = usePortalRoute();
  const [status, setStatus] = useState('');
  const [receipt, setReceipt] = useState(null);
  const payments = data.payments.filter(p => (role === 'admin' || p.user === userId) && (!status || p.estatus === status));
  const rows = payments.map(p => [p.id, data.users.find(u => u.id === p.user)?.nombre || '—', data.events.find(e => e.id === p.event)?.nombre || '—', p.importe, p.estatus, p.fecha]);
  function receiptText(p) { return `COMPROBANTE DE DEMOSTRACIÓN — SIN VALIDEZ FISCAL\nIncubadora ITS\nFolio: ${p.id}\nEvento: ${data.events.find(e => e.id === p.event)?.nombre}\nImporte de prueba: ${money(p.importe)} MXN\nFecha: ${dateLabel(p.fecha)}\nNo se realizó ningún cobro real.`; }
  return <><Heading eyebrow={role === 'admin' ? 'COORDINACIÓN / PAGOS' : 'INSCRIPCIONES / PAGOS'} title={role === 'admin' ? 'Gestión de cobros y pagos' : 'Mis pagos y comprobantes'} description="Consulta el estado de las transacciones y el detalle de tus actividades." action={role === 'admin' && <button className="button secondary" onClick={() => exportCSV('pagos-demostracion.csv', ['Folio', 'Usuario', 'Evento', 'Importe MXN', 'Estado', 'Fecha'], rows)}>Exportar CSV</button>} />{role === 'admin' && <Stats items={[[ 'Cobrado (demo)', money(data.payments.filter(p => p.estatus === 'Pagado').reduce((s, p) => s + p.importe, 0))], ['Pendiente', money(data.payments.filter(p => p.estatus === 'Pendiente').reduce((s, p) => s + p.importe, 0))], ['Pagados', data.payments.filter(p => p.estatus === 'Pagado').length], ['Reembolsos', data.payments.filter(p => p.estatus === 'Reembolsado').length]]} />}<Panel title="Movimientos"><Field label="Estado del pago" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{['Pagado', 'Pendiente', 'Rechazado', 'Reembolsado'].map(s => <option key={s}>{s}</option>)}</Field><Table headings={['Folio / fecha', ...(role === 'admin' ? ['Usuario'] : []), 'Evento', 'Importe', 'Estado', 'Comprobante']} empty={!payments.length}>{payments.map(p => <tr key={p.id}><td><strong>{p.id}</strong><small>{dateLabel(p.fecha)}</small></td>{role === 'admin' && <td>{data.users.find(u => u.id === p.user)?.nombre}</td>}<td>{data.events.find(e => e.id === p.event)?.nombre}</td><td className="nowrap">{money(p.importe)}</td><td><Badge>{p.estatus}</Badge></td><td><button className="text-button" onClick={() => setReceipt(p)}>Ver</button></td></tr>)}</Table>{role !== 'admin' && <Link className="text-link" to={`${base}/eventos`}>Explorar eventos →</Link>}</Panel>{receipt && <Modal title="Comprobante de prueba" onClose={() => setReceipt(null)}><pre className="receipt">{receiptText(receipt)}</pre><button className="button" onClick={() => download(`comprobante-${receipt.id}.txt`, receiptText(receipt))}>Descargar comprobante de prueba</button></Modal>}</>;
}

export function Registrations() {
  const { data, setData, notify } = usePortal();
  const { base, userId } = usePortalRoute();
  const [cancel, setCancel] = useState(null);
  const registrations = data.registrations.filter(r => r.user === userId);
  return <><Heading title="Mis inscripciones" description="Tus próximas experiencias en la incubadora." action={<Link className="button" to={`${base}/eventos`}>Explorar eventos</Link>} /><Panel><Table headings={['Evento', 'Fecha', 'Modalidad', 'Estatus', 'Acción']} empty={!registrations.length}>{registrations.map(r => { const event = data.events.find(e => e.id === r.event); return <tr key={r.id}><td><strong>{event?.nombre}</strong></td><td>{dateLabel(event?.fecha)}</td><td>{event?.modalidad}</td><td><Badge>{r.estatus}</Badge></td><td>{event?.precio ? <Link className="text-link" to={`${base}/pagos`}>Ver pago</Link> : <button className="text-button danger" onClick={() => setCancel(r)}>Cancelar inscripción</button>}</td></tr>; })}</Table></Panel>{cancel && <Modal title="Cancelar inscripción" onClose={() => setCancel(null)}><p>Se liberará tu lugar en este evento gratuito.</p><div className="form-actions"><button className="button secondary" onClick={() => setCancel(null)}>Conservar lugar</button><button className="button" onClick={() => { setData(previous => ({ ...previous, registrations: previous.registrations.filter(r => r.id !== cancel.id) })); setCancel(null); notify('Inscripción de demostración cancelada.'); }}>Cancelar inscripción</button></div></Modal>}</>;
}
