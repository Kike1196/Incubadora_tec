import { useEffect, useId, useRef } from 'react';

export function Heading({ eyebrow, title, description, action }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow || 'INCUBADORA ITS'}</p><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</header>;
}
export function Panel({ title, children, className = '' }) {
  return <section className={`panel ${className}`}>{title && <h2>{title}</h2>}{children}</section>;
}
export function Badge({ children }) {
  const positive = ['Activo', 'Completado', 'Pagado', 'Confirmada', 'Aprobada', 'Disponible'].includes(children);
  const negative = ['Rechazado', 'Rechazada', 'Cancelada', 'Cupo lleno'].includes(children);
  return <span className={`badge ${positive ? 'positive' : negative ? 'negative' : 'pending'}`}>{children}</span>;
}
export function Progress({ value }) {
  return <div className="progress-wrap"><progress max="100" value={value} aria-label={`Progreso: ${value}%`} /><span>{value}%</span></div>;
}
export function Empty({ children = 'Todavía no hay registros para mostrar.' }) {
  return <div className="empty-state"><span aria-hidden="true">○</span><p>{children}</p></div>;
}
export function Table({ headings, children, empty = false }) {
  return empty ? <Empty /> : <div className="table-scroll"><table><thead><tr>{headings.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span>{children ? <select id={id} {...props}>{children}</select> : <input id={id} {...props} />}</label>;
}
export function TextArea({ label, ...props }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span><textarea id={id} rows="4" {...props} /></label>;
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={id} onCancel={onClose}><div className="modal-heading"><h2 id={id}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana">×</button></div>{children}</dialog>;
}
export function Stats({ items }) {
  return <div className="stats-grid">{items.map(([label, value, description]) => <section className="stat" key={label}><p>{label}</p><strong>{value}</strong>{description && <small>{description}</small>}</section>)}</div>;
}
export function download(name, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportCSV(name, headings, rows) {
  const cell = value => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  download(name, '\uFEFF' + [headings, ...rows].map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
export const formValues = event => Object.fromEntries(new FormData(event.currentTarget));
