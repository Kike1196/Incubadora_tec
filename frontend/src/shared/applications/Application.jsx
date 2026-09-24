import { FullRegistration, availableRegistration, registrationSummary } from '../registration/FullRegistration.jsx';
import { registrationError } from '../registration/validation.js';
import { useState } from 'react';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel, today, uid } from '../portal/data.js';
import { Badge, Heading, Modal, Panel, Table } from '../portal/ui.jsx';


export function Application({ admin = false }) {
  const { data, update, notify, busy } = usePortal();
  const { userId } = usePortalRoute();
  const existing = data.requests.find(r => r.user === userId);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const registration = availableRegistration(data, userId, existing?.registro_id);
  const ready = registration?.estatus === 'Aprobado' ? registration : null;
  async function submit(e) {
    e.preventDefault(); if (existing && existing.estatus !== 'Rechazada') return;
    if (!ready) return;
    const values = registrationSummary(ready);
    const problem = registrationError(values);
    if (problem) { setError(problem); return; }
    if (!await update('requests', { ...values, id: existing?.id || uid(), user: userId, fecha: today(), estatus: 'En revisión' })) return; notify('Solicitud enviada. Puedes revisar su estado aquí.'); setError('');
  }
  if (admin) return <><Heading title="Solicitudes de ingreso" description="Conoce las ideas de quienes quieren sumarse a la incubadora." /><Panel><Table headings={['Solicitante', 'Proyecto', 'Especialidad', 'Fecha', 'Estado', 'Acción']} empty={!data.requests.length}>{data.requests.map(r => <tr key={r.id}><td>{data.users.find(u => u.id === r.user)?.nombre}</td><td>{r.nombre}</td><td>{r.especialidad}</td><td>{dateLabel(r.fecha)}</td><td><Badge>{r.estatus}</Badge></td><td><button className="text-button" onClick={() => setDetail(r)}>Revisar</button></td></tr>)}</Table></Panel>{detail && <Modal title={detail.nombre} onClose={() => setDetail(null)}><h3>Problema o necesidad</h3><p>{detail.descripcion}</p><h3>Producto o servicio</h3><p>{detail.producto_servicio || "Registro incompleto: rechaza la solicitud para que el solicitante lo complete."}</p><p>Correo: {data.users.find(u => u.id === detail.user)?.correo}</p>{detail.telefono && <p>Teléfono: {detail.telefono}</p>}{detail.registro_id && <FullRegistration key={detail.registro_id} registration={(data.initialRegistrations || []).find(r => r.id === detail.registro_id)} person={data.users.find(u => u.id === detail.user)} administrative />}<p className="info-box">Al aprobar, el solicitante pasará a ser emprendedor y se creará su proyecto.</p>{detail.estatus === 'En revisión' && <div className="form-actions"><button className="button secondary" onClick={async () => { if (await update('requests', { ...detail, estatus: 'Rechazada' })) setDetail(null); }}>Rechazar propuesta</button><button className="button" disabled={busy || (data.initialRegistrations || []).find(r => r.id === detail.registro_id)?.estatus !== 'Aprobado' || !!registrationError(detail)} onClick={async () => { if (await update('requests', { ...detail, estatus: 'Aprobada' })) { setDetail(null); notify('Solicitud aprobada. La cuenta ya es de emprendedor y tiene su proyecto.'); } }}>Aprobar propuesta</button></div>}</Modal>}</>;
  return <><Heading eyebrow="EXTERNO / SOLICITUD DE INGRESO" title="Tu idea puede ser el siguiente gran proyecto" description="Completa primero el formato de registro. Después podrás enviar tu solicitud de proyecto." /><div className="form-stack"><Panel title="Nueva solicitud">{existing && existing.estatus !== 'Rechazada' ? <div className="empty-state"><h3>Ya recibimos tu propuesta</h3><p>{existing.nombre}</p><p>Consulta el estado de tu solicitud en este panel.</p></div> : <><FullRegistration registration={registration} person={data.users.find(u => u.id === userId)} /><form onSubmit={submit}><p>Cuando coordinación apruebe el registro podrás enviar la solicitud de proyecto.</p>{error && <p className="error" role="alert">{error}</p>}<button className="button" disabled={!ready || busy}>{busy ? 'Enviando…' : 'Enviar solicitud de proyecto'}</button></form></>}</Panel><div><Panel title="Estado de mi solicitud">{existing ? <><Badge>{existing.estatus}</Badge><p>Enviada el {dateLabel(existing.fecha)}.</p><p className="muted">{existing.estatus === 'En revisión' ? 'La coordinación revisará tu proyecto para continuar con el proceso de ingreso.' : existing.estatus === 'Aprobada' ? 'Tu propuesta fue aprobada. Actualiza tu sesión para entrar al portal de emprendedor.' : 'Tu propuesta requiere ajustes. Puedes actualizarla y enviarla de nuevo.'}</p></> : <><Badge>Sin solicitud</Badge><p className="muted">Completa el formulario para dar el primer paso.</p></>}</Panel><Panel title="¿Cómo funciona?"><ol className="steps-list"><li>Comparte tu idea.</li><li>La coordinación revisa tu propuesta.</li><li>Recibe orientación para comenzar.</li></ol></Panel></div></div></>;
}
