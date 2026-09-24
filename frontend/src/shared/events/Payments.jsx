import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel, money } from '../portal/data.js';
import { Badge, Field, Heading, Modal, Panel, Stats, Table, download, exportCSV } from '../portal/ui.jsx';



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
