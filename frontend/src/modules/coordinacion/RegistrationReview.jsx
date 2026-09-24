import { useState } from 'react';
import { DownloadRegistration } from '../../shared/registration/DownloadRegistration';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { Badge, Field, Heading, Panel, Table, TextArea } from '../../shared/portal/ui.jsx';
import { FullRegistration } from '../../shared/registration/FullRegistration.jsx';

export default function RegistrationReview() {
  const { data, reviewRegistration, busy, notify } = usePortal();
  const [status, setStatus] = useState('Pendiente');
  const [selected, setSelected] = useState(null);
  const rows = (data.initialRegistrations || []).filter(r => !status || r.estatus === status);
  const record = (data.initialRegistrations || []).find(r => r.id === selected);
  return <><Heading title="Revisión de registros" description="Revisa los datos y anexos del formato antes de autorizar la creación del proyecto." />
    <Panel><Field label="Estado del registro" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{['Borrador', 'Pendiente', 'En revisión', 'Correcciones solicitadas', 'Aprobado'].map(s => <option key={s}>{s}</option>)}</Field>
      <Table headings={['Solicitante', 'Proyecto / idea', 'Estado', 'Observaciones', 'Acción']} empty={!rows.length}>{rows.map(r => <tr key={r.id}><td>{data.users.find(u => u.id === r.user)?.nombre}</td><td>{r.datos['empresa.nombre'] || 'Sin nombre'}</td><td><Badge>{r.estatus}</Badge></td><td>{r.observaciones || '—'}</td><td><div className="row"><button className="text-button" onClick={() => setSelected(r.id)}>Abrir registro</button><DownloadRegistration registration={r} /></div></td></tr>)}</Table>
    </Panel>
    {record && <section><button className="button secondary" onClick={() => setSelected(null)}>Cerrar registro</button>
      <FullRegistration key={`${record.id}:${record.estatus}`} registration={record} person={data.users.find(u => u.id === record.user)} administrative />
      <ReviewDecision key={`${record.id}:${record.estatus}`} record={record} busy={busy} onReview={async (next, note) => { if (await reviewRegistration(record.id, next, record.estatus, note)) { notify(`Registro: ${next}.`); } }} />
    </section>}
  </>;
}

function ReviewDecision({ record, busy, onReview }) {
  const [note, setNote] = useState('');
  return <Panel title="Decisión de coordinación">
    {record.estatus === 'Borrador' && <p>El solicitante todavía no ha enviado el registro.</p>}
    {record.estatus === 'Pendiente' && <button className="button" disabled={busy} onClick={() => onReview('En revisión', '')}>Iniciar revisión</button>}
    {record.estatus === 'En revisión' && <><TextArea label="Observaciones para el solicitante" value={note} onChange={e => setNote(e.target.value)} maxLength={5000} /><p>Para solicitar correcciones, indica qué datos o anexos debe corregir.</p><div className="form-actions"><button className="button secondary" disabled={busy || !note.trim()} onClick={() => onReview('Correcciones solicitadas', note)}>Solicitar correcciones</button><button className="button" disabled={busy} onClick={() => onReview('Aprobado', note)}>Aprobar registro</button></div></>}
    {record.estatus === 'Correcciones solicitadas' && <p>En espera de que el solicitante corrija y reenvíe el registro.</p>}
    {record.estatus === 'Aprobado' && <p>Registro aprobado. El solicitante puede continuar con su proyecto.</p>}
  </Panel>;
}
