import { coordinationNavigation } from '../../modules/coordinacion/navigation';
import { studentNavigation } from '../../modules/estudiantes/navigation';
import { externalNavigation } from '../../modules/externos/navigation';
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { demoPeople, roleNames, rolePaths } from './data.js';
import { usePortal } from './PortalContext.jsx';

const links = { estudiante: studentNavigation, admin: coordinationNavigation, externo: externalNavigation };

export const usePortalRoute = () => useOutletContext();
export default function PortalLayout({ role, preview = false, innovation = false }) {
  const { notice, notify, user, loading, error, busy, refresh } = usePortal();
  if (!preview && user) role = user.rol;
  const navigate = useNavigate();
  const location = useLocation();
  const base = `${preview ? '/vista-previa' : ''}/${innovation ? 'innovatecnm' : rolePaths[role]}`;
  const home = `${preview ? '/vista-previa' : ''}/${rolePaths[role]}/inicio`;
  const query = innovation && preview ? `?rol=${role}` : '';
  const nav = innovation ? [['inicio', 'Inicio'], ['certamen', 'Certamen'], ['hackatec', 'HackaTec'], ['innobotica', 'InnoBótica'], ['innovaccion', 'InnovAcción'], ['retos', 'Retos Nacionales'], ['registros', 'Registros']] : links[role];
  const logout = () => { if (!preview) { localStorage.removeItem('access_token'); localStorage.removeItem('rol'); } navigate('/'); };
  return <div className="portal-app">
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <div className="institution-bar">INSTITUTO TECNOLÓGICO DE SALTILLO <span>Centro de Emprendurismo y Negocios</span></div>
    <header className="portal-header"><div className="portal-header-inner"><Link className="brand" to={home}><span className="brand-seal">ITS</span><span>Incubadora ITS<small>Ideas que se convierten en futuro</small></span></Link><div className="account"><span className="avatar" aria-hidden="true">{preview ? demoPeople[role][0] : user?.nombre?.[0]}</span><div><strong>{preview ? demoPeople[role] : user?.nombre}</strong><small>{roleNames[role]}</small></div><button className="text-button" onClick={logout}>{preview ? 'Salir de vista previa' : 'Cerrar sesión'}</button></div></div></header>
    <nav className="portal-nav" aria-label="Navegación principal"><div>{nav.map(([path, label]) => <NavLink key={path} to={`${base}/${path}${query}`} end={path === 'inicio'}>{label}</NavLink>)}{innovation ? <Link to={home}>← Incubadora</Link> : role !== 'externo' && <Link className="innovation-link" to={`${preview ? '/vista-previa' : ''}/innovatecnm/inicio${preview ? `?rol=${role}` : ''}`}>InnovaTecNM ↗</Link>}</div></nav>
    <main className="portal-main" id="contenido">{preview && <div className="preview-bar"><div><strong>Vista de demostración</strong><span>Datos de ejemplo. Los cambios duran hasta recargar; no se realizan cobros.</span></div>{preview && <label>Cambiar rol<select aria-label="Cambiar rol de vista previa" value={role} onChange={e => { notify(''); navigate(`/vista-previa/${rolePaths[e.target.value]}/inicio`); }}><option value="estudiante">Emprendedor</option><option value="admin">Coordinador</option><option value="externo">Externo</option></select></label>}</div>}
      {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => notify('')}>×</button></div>}
      {!preview && <div className="row between"><span role="status">{busy ? 'Guardando cambios…' : 'Tu cuenta está conectada'}</span><button className="text-button" disabled={busy} onClick={refresh}>Actualizar datos</button></div>}
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p role="status">Cargando datos…</p> : <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} key={location.pathname}><Outlet context={{ role, preview, base, query, userId: preview ? (role === 'admin' ? 'ana' : role === 'externo' ? 'karla' : 'diego') : user?.id }} /></fieldset>}
    </main><footer className="portal-footer"><span>ITS · Incubadora en Línea</span><span>Emprendimiento · Innovación · Comunidad</span></footer>
  </div>;
}
