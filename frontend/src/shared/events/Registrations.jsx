import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel } from '../portal/data.js';
import { Badge, Heading, Modal, Panel, Table } from '../portal/ui.jsx';



export function Registrations() {
  const { data, register: registerEvent, remove, notify, paymentsMode } = usePortal();
  const { base, userId } = usePortalRoute();
  const [cancel, setCancel] = useState(null);
  const registrations = data.registrations.filter(r => r.user === userId);
  return <><Heading title="Mis inscripciones" description="Tus próximas experiencias en la incubadora." action={<Link className="button" to={`${base}/eventos`}>Explorar eventos</Link>} /><Panel><Table headings={['Evento', 'Fecha', 'Modalidad', 'Estatus', 'Acción']} empty={!registrations.length}>{registrations.map(r => { const event = data.events.find(e => e.id === r.event); return <tr key={r.id}><td><strong>{event?.nombre}</strong></td><td>{dateLabel(event?.fecha)}</td><td>{event?.modalidad}</td><td><Badge>{r.estatus}</Badge></td><td><div className="row">{event?.precio > 0 && <Link className="text-link" to={`${base}/pagos`}>Ver pago</Link>}<button className="text-button danger" onClick={() => setCancel(r)}>Cancelar inscripción</button></div></td></tr>; })}</Table></Panel>{cancel && <Modal title="Cancelar inscripción" onClose={() => setCancel(null)}><p>Se liberará tu lugar. Si hay un pago de prueba, quedará marcado como reembolsado sin movimientos de dinero real.</p><div className="form-actions"><button className="button secondary" onClick={() => setCancel(null)}>Conservar lugar</button><button className="button" onClick={async () => { if (await remove('registrations', cancel.id)) { setCancel(null); notify('Inscripción cancelada.'); } }}>Cancelar inscripción</button></div></Modal>}</>;
}
