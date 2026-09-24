import { useEffect, useRef, useState } from 'react';
import { readDraft, writeDraft, removeDraft } from './draft.js';
import { phoneError } from './validation.js';
import { registrationSections } from './reviewLayout.js';
import spec from './registration-fields.json';
import { usePortal } from '../portal/PortalContext.jsx';
import { Field, TextArea, Panel, Table, Badge } from '../portal/ui.jsx';
import { uid } from '../portal/data.js';
import { registrationDate } from './metadata';
import { DownloadRegistration } from './DownloadRegistration';

const categories = ['Convencionales', 'Discapacitados', 'Indígenas', 'Mujeres', 'Hombres', 'Total'];
const keys = ['convencionales', 'discapacitados', 'indigenas', 'mujeres', 'hombres', 'total'];
export function registrationSummary(record) {
  const d = record.datos;
  return { registro_id: record.id, nombre: d['empresa.nombre'], descripcion: d['descripcion.problema']?.slice(0, 3000), producto_servicio: d['descripcion.producto']?.slice(0, 3000), especialidad: d['principal.especialidad'] || '', telefono: d['principal.telefono_celular'] || '' };
}
export function availableRegistration(data, userId, linkedId) {
  return (data.initialRegistrations || []).find(r => linkedId ? r.id === linkedId : r.user === userId && !data.projects.some(p => p.registro_id === r.id) && !data.requests.some(s => s.registro_id === r.id));
}

export function FullRegistration({ registration, person, onReady, administrative = false, readOnly = false }) {
  const { update, downloadRegistrationFile, busy, notify } = usePortal();
  readOnly = readOnly || (!administrative && ['Pendiente', 'En revisión', 'Aprobado'].includes(registration?.estatus));
  const draftKey = `registration-draft:${administrative ? 'admin' : 'applicant'}:${person?.id || registration?.user || 'preview'}:${registration?.id || 'new'}`;
  const [restored, setRestored] = useState(() => readOnly ? null : readDraft(draftKey));
  const [dirty, setDirty] = useState(!!restored);
  const [draftWarning, setDraftWarning] = useState(restored?.pendingFiles ? 'Se recuperó el texto. Vuelve a seleccionar los anexos que no habías guardado.' : '');
  const previousDraftKey = useRef(draftKey);
  const recordId = useRef(registration?.id);
  const emissionDate = registration?.datos?.['identificacion.fecha'] || registrationDate();
  const folio = registration?.datos?.['identificacion.folio'] || '';
  const [values, setValues] = useState(() => restored?.values || registration?.datos || { 'identificacion.fecha': registrationDate(), 'identificacion.numero_solicitantes': '1', 'principal.correo1': person?.correo || '' });
  const [administration, setAdministration] = useState(restored?.administration || registration?.administracion || {});
  const [files, setFiles] = useState(registration?.archivos || {});
  const [changes, setChanges] = useState({});
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (!dirty || readOnly) return;
    const saved = writeDraft(draftKey, { values, administration, pendingFiles: !!Object.keys(changes).length || !!restored?.pendingFiles });
    if (!saved) setDraftWarning('No se pudo conservar el borrador en esta pestaña. Guarda el borrador antes de salir.');
    if (saved && previousDraftKey.current !== draftKey) removeDraft(previousDraftKey.current);
    previousDraftKey.current = draftKey;
  }, [values, administration, changes, dirty, readOnly, draftKey]);
  useEffect(() => {
    if (!dirty && !reading) return;
    const preventLoss = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty, reading]);
  const count = Math.min(20, Math.max(1, Number(values['identificacion.numero_solicitantes']) || 1));
  const participants = ['principal', ...Array.from({ length: count - 1 }, (_, i) => `socio_${i + 1}`)];
  function change(key, value, admin = false) {
    setDirty(true);
    if (admin) { setAdministration(prev => ({ ...prev, [key]: value })); return; }
    setComplete(false); onReady?.(null);
    setValues(prev => {
      const next = { ...prev, [key]: value };
      for (const person of participants) {
        if (key.startsWith(`${person}.dependientes_`)) next[`${person}.dependientes_total`] = String(Number(next[`${person}.dependientes_consanguineos`] || 0) + Number(next[`${person}.dependientes_otros`] || 0));
      }
      for (const col of keys) {
        if (key.startsWith('empleos.')) next[`empleos.total.${col}`] = String(Number(next[`empleos.actuales.${col}`] || 0) + Number(next[`empleos.generar.${col}`] || 0));
      }
      return next;
    });
  }
  function control(field, prefix, admin = false) {
    const name = `${prefix}.${field.key}`;
    const automatic = name === 'identificacion.folio' || name === 'identificacion.fecha';
    const val = name === 'identificacion.folio' ? folio : name === 'identificacion.fecha' ? emissionDate : (admin ? administration : values)[name] || '';
    const props = { name, value: val, readOnly: automatic, placeholder: name === 'identificacion.folio' ? 'Se asigna al guardar' : undefined, required: !admin && field.required, disabled: busy || reading || readOnly || (admin ? !administrative : administrative), onChange: e => change(name, e.target.value, admin), maxLength: field.type === 'textarea' ? 5000 : 300 };
    if (field.type === 'tel') {
      props.placeholder = 'Ej. 8441234567 (opcional)';
      props.title = 'De 10 a 20 caracteres. Si no tienes este teléfono, deja el campo vacío.';
      props.onChange = e => { e.target.setCustomValidity(''); change(name, e.target.value, admin); };
      props.onBlur = e => e.target.setCustomValidity(phoneError(e.target.value));
    }
    const label = field.label + (field.required && !admin ? ' *' : '');
    if (field.type === 'textarea') return <TextArea key={name} label={label} {...props} />;
    if (field.type === 'select') return <Field key={name} label={label} {...props}><option value="">Selecciona…</option>{field.options.map(o => <option key={o}>{o}</option>)}</Field>;
    return <Field key={name} label={label} type={field.type} {...props} min={field.type === 'number' ? 0 : undefined} step={field.key.startsWith('ingreso') ? '0.01' : '1'} />;
  }
  async function attach(key, file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !/\.(pdf|png|jpe?g)$/i.test(file.name)) { setError('Adjunta un PDF, PNG o JPG de hasta 2 MB.'); return; }
    setReading(true); setDirty(true); setError('');
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const item = { name: file.name, data };
      setFiles(prev => ({ ...prev, [key]: item })); setChanges(prev => ({ ...prev, [key]: item })); setComplete(false); onReady?.(null);
    } catch { setError('No se pudo leer el anexo.'); } finally { setReading(false); }
  }
  async function save(event) {
    event.preventDefault(); setError('');
    for (const input of event.currentTarget.querySelectorAll('input[type="tel"]:not(:disabled)')) {
      const message = phoneError(input.value);
      input.setCustomValidity(message);
      if (message) { input.focus(); input.reportValidity(); return; }
    }
    const finish = event.nativeEvent.submitter?.value === 'Pendiente';
    recordId.current ||= uid();
    const datos = Object.fromEntries(Object.entries(values).filter(([k]) => !['identificacion.folio', 'identificacion.fecha'].includes(k) && (!k.startsWith('socio_') || participants.some(p => k.startsWith(`${p}.`)))));
    const payload = { id: recordId.current, user: person?.id || registration?.user, datos, administracion: administrative ? administration : {}, archivos: Object.fromEntries(Object.entries(changes).filter(([k]) => participants.some(p => k.startsWith(`${p}.`)))), estatus: finish ? 'Pendiente' : 'Borrador' };
    if (!await update('initialRegistrations', payload)) return;
    removeDraft(draftKey); removeDraft(previousDraftKey.current);
    setDirty(false); setDraftWarning(''); setRestored(null);
    setChanges({}); setComplete(payload.estatus === 'Pendiente');
    notify(administrative ? 'Revisión guardada.' : finish ? 'Registro enviado. Coordinación revisará tus datos y anexos.' : 'Borrador guardado. Puedes continuar después.');
    if (!administrative) onReady?.(null);
  }
  return <form onSubmit={save} className="form-stack" data-unsaved={dirty || reading ? 'true' : undefined}>
    <Panel title="MODELO DE INCUBACIÓN DE EMPRESAS DEL SNEST">
      <p>PROCESO DE PRE-INCUBACIÓN · PROCEDIMIENTO DE CONTACTO INICIAL</p>
      <h2>FORMATO DE REGISTRO</h2><p>Código: {spec.code} · Revisión: {spec.revision} · Fecha de emisión: {emissionDate.split('-').reverse().join('/')}</p>
      <p>Completa el formato y envíalo a coordinación. Podrás crear el proyecto cuando el registro esté aprobado. Los campos con * son obligatorios. Guarda un borrador para continuar después.</p>
      <p className="helper">La fecha corresponde a la elaboración del registro. El folio se asigna automáticamente al guardar por primera vez y se conserva al realizar correcciones.</p>
      {!readOnly && <p className="helper">El texto sin guardar se recupera al recargar esta pestaña. Usa Guardar borrador para conservar también los anexos y continuar después de cerrar la pestaña.</p>}
      {draftWarning && <p role="status" className="info-box">{draftWarning}</p>}
      <p className="helper">La firma se captura como nombre completo para dejar constancia de la captura; no sustituye una firma autógrafa. La cita, revisión y autorización las completa coordinación.</p>
    </Panel>
    <Panel title="Estado del registro"><div className="row between"><Badge>{registration?.estatus || 'Borrador'}</Badge><DownloadRegistration registration={registration} /></div>
      {registration?.observaciones && <p className="info-box"><strong>Observaciones de coordinación: </strong>{registration.observaciones}</p>}
      {registration?.estatus === 'Pendiente' && <p>Tu registro está en la bandeja de coordinación, pendiente de revisión.</p>}
      {registration?.estatus === 'En revisión' && <p>Coordinación está revisando tu información y los anexos.</p>}
      {registration?.estatus === 'Correcciones solicitadas' && <p>Corrige las observaciones y vuelve a enviar el registro a revisión.</p>}
      {registration?.estatus === 'Aprobado' && <p>Coordinación aprobó el registro. Ya puedes continuar con el proyecto.</p>}
      {!!registration?.historial?.length && <details><summary>Historial de revisión</summary><Table headings={['Fecha', 'Responsable', 'Estado', 'Observaciones']}>{registration.historial.map((h, i) => <tr key={i}><td>{new Date(h.fecha).toLocaleString('es-MX')}</td><td>{h.nombre}</td><td>{h.estatus}</td><td>{h.observaciones || '—'}</td></tr>)}</Table></details>}
    </Panel>
    {registrationSections(spec).map(section => {
      if (section.id === 'review_block') return <Panel key={section.layoutKey} title={section.title}>
        <p><strong>Corresponde a:</strong> {section.scope}.</p>
        <p className="helper">Uso exclusivo de coordinación. Ubicación correspondiente a la página {section.prefix.split('_').pop()} del formato Word original.</p>
        <div className="registration-signatures">
          {[['elaboro', 'Elaboró'], ['reviso1', 'Revisó 1'], ['reviso2', 'Revisó 2'], ['autorizo', 'Autorizó']].map(([prefix, title]) => <fieldset key={prefix} className="registration-signature">
            <legend>{title}</legend>
            <div className="form-stack">{spec.sections.find(s => s.id === 'control').fields.filter(field => field.key.startsWith(`${prefix}_`)).map(field => control({ ...field, label: field.label.split(' — ').pop() }, section.prefix, true))}</div>
          </fieldset>)}
        </div>
      </Panel>;
      if (section.id === 'control') return <Panel key={section.id} title="Comentarios de coordinación">
        {section.fields.filter(field => field.key === 'comentarios').map(field => control(field, section.id, true))}
        {section.fields.some(field => field.key !== 'comentarios' && administration[`control.${field.key}`]) && <details>
          <summary>Revisión general guardada en la versión anterior</summary>
          <p className="helper">Estos datos se conservan como antecedente. La versión anterior no distinguía los seis bloques; registra cada revisión en el bloque correspondiente.</p>
          <dl>{section.fields.filter(field => field.key !== 'comentarios' && administration[`control.${field.key}`]).map(field => <div key={field.key}><dt>{field.label}</dt><dd>{administration[`control.${field.key}`]}</dd></div>)}</dl>
        </details>}
      </Panel>;
      if (section.id === 'socio') return <Panel key={section.id} title={section.title}>{count === 1 ? <p>No aplica: se registró un solo solicitante.</p> : participants.slice(1).map((p, i) => <fieldset key={p}><legend>Socio {i + 1}</legend><div className="form-grid">{section.fields.map(f => control(f, p))}</div></fieldset>)}</Panel>;
      if (section.id === 'empleos') return <Panel key={section.id} title={section.title}><p className="helper">Las categorías pueden superponerse. Indica el total de personas de cada fila, sin sumar las categorías.</p><Table headings={['Puestos', ...categories]}>{[['actuales', 'Actuales'], ['generar', 'Por generar'], ['total', 'Total']].map(([row, label]) => <tr key={row}><th>{label}</th>{keys.map((col, i) => <td key={col}><input aria-label={`${label}: ${categories[i]}`} type="number" min="0" step="1" required name={`empleos.${row}.${col}`} value={values[`empleos.${row}.${col}`] ?? ''} readOnly={row === 'total'} disabled={busy || reading || readOnly || administrative} onChange={e => change(`empleos.${row}.${col}`, e.target.value)} style={{ width: '6rem' }} /></td>)}</tr>)}</Table></Panel>;
      if (section.id === 'requisitos') return <Panel key={section.id} title={section.title}><p>Anexa la documentación del responsable y de cada socio. PDF, PNG o JPG; hasta 2 MB por archivo y 20 MB por registro.</p>{participants.map(personKey => <fieldset key={personKey}><legend>{personKey === 'principal' ? 'Solicitante principal' : `Socio ${personKey.split('_')[1]}`}</legend>{spec.documents.map(doc => { const key = `${personKey}.${doc.key}`; return <div className="form-stack" key={key}><strong>{doc.label}</strong>{files[key] && <span>{files[key].name} {registration?.archivos?.[key] && <button type="button" className="text-button" onClick={() => downloadRegistrationFile(registration.id, key, files[key].name)}>Descargar</button>}</span>}{!readOnly && !administrative && <input aria-label={`${personKey}: ${doc.label}`} type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={reading || busy} onChange={e => attach(key, e.target.files[0])} />}{control({ key, label: 'Revisó', type: 'text' }, 'revision', true)}</div>; })}<p>Formulario de registro de contacto inicial (DGEST-MIdE-CI-F-01): este registro en línea.</p>{control({ key: `${personKey}.formulario`, label: 'Revisó el formulario', type: 'text' }, 'revision', true)}</fieldset>)}</Panel>;
      return <Panel key={section.layoutKey || section.id} title={section.title}>{section.admin && <p className="helper">Uso exclusivo de coordinación.</p>}{section.id === 'estratificacion' && <Table headings={['Tamaño', 'Industria', 'Comercio', 'Servicios']}><tr><td>Micro Empresa</td><td>0–10</td><td>0–10</td><td>0–10</td></tr><tr><td>Pequeña Empresa</td><td>11–50</td><td>11–30</td><td>11–50</td></tr><tr><td>Mediana Empresa</td><td>51–250</td><td>31–100</td><td>51–100</td></tr></Table>}<div className="form-grid">{section.fields.map(f => control(f, section.id, section.admin))}</div></Panel>;
    })}
    {error && <p className="error" role="alert">{error}</p>}
    {!readOnly && <div className="form-actions">{administrative ? <button className="button" disabled={busy}>Guardar revisión</button> : <><button className="button secondary" value="Borrador" formNoValidate disabled={busy || reading}>Guardar borrador</button><button className="button" value="Pendiente" disabled={busy || reading}>Enviar a revisión</button></>}</div>}
    {complete && !administrative && <p className="info-box">Registro enviado a revisión.</p>}
  </form>;
}
