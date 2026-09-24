import { useState } from 'react';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel, today, uid } from '../portal/data.js';
import { Badge, Empty, Field, Heading, Modal, Panel, Table, formValues } from '../portal/ui.jsx';


export function Tutoring({ initialTab }) {
  const { data, update, remove, notify } = usePortal();
  const { role, userId } = usePortalRoute();
  const admin = role === 'admin';
  const [tab, setTab] = useState(initialTab || (admin ? 'agenda' : 'agendar'));
  const [selected, setSelected] = useState('');
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const appointments = data.appointments.filter(a => admin || a.user === userId);
  const available = data.slots.filter(s => s.fecha >= today() && !s.reservado && !data.appointments.some(a => a.slot === s.id && a.estatus === 'Confirmada'));
  async function createSlot(e) {
    e.preventDefault(); const values = formValues(e);
    if (values.fin <= values.inicio || data.slots.some(s => s.fecha === values.fecha && s.inicio < values.fin && s.fin > values.inicio)) { setError('Elige una hora de fin posterior al inicio y evita horarios superpuestos.'); return; }
    if (await update('slots', { ...values, id: uid(), coordinador: userId })) { setModal(false); setError(''); }
  }
  async function book(e) {
    e.preventDefault();
    if (!available.some(s => s.id === selected)) { setError('Selecciona un horario disponible.'); return; }
    if (!await update('appointments', { id: uid(), slot: selected, user: userId, estatus: 'Confirmada' })) return;
    setSelected(''); setError(''); setTab('agenda'); notify('Tutoría agendada.');
  }
  const shown = appointments.filter(a => { const slot = data.slots.find(s => s.id === a.slot); return tab === 'historial' ? a.estatus !== 'Confirmada' || slot?.fecha < today() : a.estatus === 'Confirmada' && slot?.fecha >= today(); });
  return <><Heading eyebrow={admin ? 'COORDINACIÓN / TUTORÍAS' : 'EMPRENDEDOR / TUTORÍAS'} title="Un espacio para avanzar juntos" description="Organiza las sesiones de acompañamiento de tu proyecto." /><div className="tabs">{(admin ? [['agenda', 'Agenda'], ['disponibilidad', 'Disponibilidad'], ['historial', 'Historial']] : [['agendar', 'Agendar'], ['agenda', 'Mis tutorías'], ['historial', 'Historial']]).map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>
    {tab === 'disponibilidad' ? <Panel><div className="row between"><h2>Mi disponibilidad</h2><button className="button" onClick={() => setModal(true)}>+ Agregar bloque</button></div><Table headings={['Día', 'Hora inicio', 'Hora fin', 'Estado', 'Acción']} empty={!data.slots.length}>{data.slots.map(s => { const booked = s.reservado || data.appointments.some(a => a.slot === s.id && a.estatus === 'Confirmada'); return <tr key={s.id}><td>{dateLabel(s.fecha)}</td><td>{s.inicio}</td><td>{s.fin}</td><td><Badge>{booked ? 'Reservado' : 'Disponible'}</Badge></td><td><button className="text-button danger" disabled={data.appointments.some(a => a.slot === s.id)} onClick={() => remove('slots', s.id)}>Eliminar</button></td></tr>; })}</Table></Panel> : tab === 'agendar' ? <Panel title="Agendar tutoría"><p className="muted">Selecciona un horario disponible para tu sesión.</p><form onSubmit={book}><div className="slot-grid">{available.map(s => <label key={s.id} className={`slot ${selected === s.id ? 'selected' : ''}`}><input type="radio" name="slot" value={s.id} checked={selected === s.id} onChange={() => setSelected(s.id)} required /><strong>{dateLabel(s.fecha)}</strong><span>{s.inicio} – {s.fin}</span><small>{data.users.find(u => u.id === s.coordinador)?.nombre}</small></label>)}</div>{!available.length && <Empty>No hay horarios disponibles por ahora.</Empty>}{error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={!available.length}>Confirmar tutoría</button></form></Panel> : <Panel title={tab === 'historial' ? 'Historial de tutorías' : 'Próximas sesiones'}><Table headings={['Fecha', 'Horario', admin ? 'Emprendedor' : 'Coordinador', 'Estado', 'Acción']} empty={!shown.length}>{shown.map(a => { const s = data.slots.find(s => s.id === a.slot); return <tr key={a.id}><td>{dateLabel(s?.fecha)}</td><td>{s?.inicio} – {s?.fin}</td><td>{admin ? data.users.find(u => u.id === a.user)?.nombre : data.users.find(u => u.id === s?.coordinador)?.nombre}</td><td><Badge>{a.estatus}</Badge></td><td>{a.estatus === 'Confirmada' && <div className="row">{admin && <button className="text-button" onClick={() => update('appointments', { ...a, estatus: 'Completado' })}>Completar</button>}<button className="text-button danger" onClick={async () => { if (await update('appointments', { ...a, estatus: 'Cancelada' })) notify('Tutoría cancelada.'); }}>Cancelar</button></div>}</td></tr>; })}</Table></Panel>}
    {modal && <Modal title="Agregar disponibilidad" onClose={() => setModal(false)}><form className="form-stack" onSubmit={createSlot}><Field label="Fecha" name="fecha" type="date" min={today()} required /><div className="form-grid"><Field label="Hora inicio" name="inicio" type="time" required /><Field label="Hora fin" name="fin" type="time" required /></div>{error && <p className="error" role="alert">{error}</p>}<button className="button">Agregar bloque</button></form></Modal>}
  </>;
}
