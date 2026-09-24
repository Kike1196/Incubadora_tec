import { useState } from 'react';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { roleNames, specialties, uid } from '../../shared/portal/data.js';
import { Badge, Field, Heading, Modal, Panel, Table, formValues } from '../../shared/portal/ui.jsx';


export function Users() {
  const { data, user, update, remove, notify } = usePortal();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const rows = data.users.filter(u => `${u.nombre} ${u.correo}`.toLowerCase().includes(search.toLowerCase()) && (!filter || u.rol === filter));
  async function save(e) {
    e.preventDefault(); const values = formValues(e);
    if (data.users.some(u => u.id !== editing.id && u.correo.toLowerCase() === values.correo.trim().toLowerCase())) { setError('Ya existe un usuario con ese correo.'); return; }
    if (editing.id === user?.id && values.rol !== 'admin') { setError('Conserva tu rol de coordinador para mantener el acceso.'); return; }
    if (values.rol !== 'estudiante' && data.projects.some(p => p.owner === editing.id)) { setError('Este usuario tiene proyectos asociados; conserva su rol de Emprendedor.'); return; }
    if (!await update('users', { ...values, correo: values.correo.trim(), id: editing.id || uid() })) return; setEditing(null); setError(''); notify('Cuenta guardada.');
  }
  return <><Heading eyebrow="COORDINACIÓN / USUARIOS" title="Usuarios registrados" description="Las personas que forman parte de nuestra comunidad." action={<button className="button" onClick={() => { setEditing({}); setError(''); }}>+ Nuevo usuario</button>} /><Panel><div className="filters"><Field label="Buscar usuario" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre o correo…" /><Field label="Rol" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos los roles</option>{Object.entries(roleNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</Field></div><Table headings={['Nombre', 'Correo', 'Rol', 'Especialidad', 'Acciones']} empty={!rows.length}>{rows.map(u => <tr key={u.id}><td><strong>{u.nombre}</strong></td><td>{u.correo}</td><td><Badge>{roleNames[u.rol]}</Badge></td><td>{u.especialidad || '—'}</td><td><div className="row"><button className="text-button" onClick={() => { setEditing(u); setError(''); }}>Editar</button><button className="text-button danger" disabled={u.id === user?.id} onClick={() => setDeleting(u)}>Eliminar</button></div></td></tr>)}</Table><p className="helper">Las cuentas con historial asociado se conservan. No puedes eliminar tu propia cuenta.</p></Panel>
    {editing && <Modal title={editing.id ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setEditing(null)}><form className="form-stack" onSubmit={save}><Field label="Nombre completo" name="nombre" required maxLength={120} defaultValue={editing.nombre} /><Field label="Correo" name="correo" type="email" required defaultValue={editing.correo} /><Field label={editing.id ? "Nueva contraseña (opcional)" : "Contraseña inicial"} name="password" type="password" required={!editing.id} minLength={8} autoComplete="new-password" /><Field label="Rol" name="rol" defaultValue={editing.rol || 'estudiante'}>{Object.entries(roleNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Field><Field label="Especialidad" name="especialidad" defaultValue={editing.especialidad || ''}><option value="">Sin especialidad</option>{specialties.map(s => <option key={s}>{s}</option>)}</Field>{error && <p className="error" role="alert">{error}</p>}<button className="button">Guardar usuario</button></form></Modal>}
    {deleting && <Modal title="Eliminar usuario" onClose={() => setDeleting(null)}>{data.projects.some(p => p.owner === deleting.id) || data.registrations.some(r => r.user === deleting.id) || data.payments.some(p => p.user === deleting.id) ? <><p>Este usuario tiene proyectos, inscripciones o pagos asociados. Conserva su ficha para mantener el historial.</p><button className="button secondary" onClick={() => setDeleting(null)}>Volver</button></> : <><p>¿Eliminar a {deleting.nombre} de la incubadora?</p><div className="form-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button" onClick={async () => { if (await remove('users', deleting.id)) setDeleting(null); }}>Eliminar</button></div></>}</Modal>}
  </>;
}
export function Roles() {
  const { data } = usePortal();
  return <><Heading eyebrow="COORDINACIÓN / ROLES" title="Roles y permisos" description="Permisos aplicados por el servidor a cada cuenta." /><Panel><Table headings={['Rol', 'Descripción', 'Permisos generales']}>{data.roles.map(r => <tr key={r.id}><td><strong>{r.nombre}</strong></td><td>{r.descripcion}</td><td>{r.permisos}</td></tr>)}</Table><p className="helper">Asigna estos roles desde Usuarios. El catálogo define los accesos disponibles en la aplicación.</p></Panel></>;
}
