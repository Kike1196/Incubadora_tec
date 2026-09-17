import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { demoPeople, roleNames, rolePaths } from './data';
import { usePortal } from './PortalContext';

const links = {
  estudiante: [['inicio', 'Inicio'], ['proyectos', 'Proyectos'], ['avances', 'Mis avances'], ['eventos', 'Eventos'], ['tutorias', 'Tutorías'], ['pagos', 'Mis pagos'], ['inscripciones', 'Mis inscripciones']],
  admin: [['inicio', 'Inicio'], ['usuarios', 'Usuarios'], ['roles', 'Roles'], ['eventos', 'Eventos'], ['pagos', 'Pagos'], ['reportes', 'Reportes'], ['tutorias', 'Tutorías'], ['seguimiento', 'Seguimiento'], ['solicitudes', 'Solicitudes']],
  externo: [['inicio', 'Inicio'], ['eventos', 'Eventos'], ['solicitud', 'Solicitar ingreso'], ['pagos', 'Mis pagos'], ['inscripciones', 'Mis inscripciones']],
};

export const usePortalRoute = () => useOutletContext();
export default function PortalLayout({ role, preview = false, innovation = false }) {
  const { notice, notify } = usePortal();
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
    <header className="portal-header"><div className="portal-header-inner"><Link className="brand" to={home}><span className="brand-seal">ITS</span><span>Incubadora ITS<small>Ideas que se convierten en futuro</small></span></Link><div className="account"><span className="avatar" aria-hidden="true">{preview ? demoPeople[role][0] : roleNames[role][0]}</span><div><strong>{preview ? demoPeople[role] : 'Mi cuenta'}</strong><small>{roleNames[role]}</small></div><button className="text-button" onClick={logout}>{preview ? 'Salir de vista previa' : 'Cerrar sesión'}</button></div></div></header>
    <nav className="portal-nav" aria-label="Navegación principal"><div>{nav.map(([path, label]) => <NavLink key={path} to={`${base}/${path}${query}`} end={path === 'inicio'}>{label}</NavLink>)}{innovation ? <Link to={home}>← Incubadora</Link> : role !== 'externo' && <Link className="innovation-link" to={`${preview ? '/vista-previa' : ''}/innovatecnm/inicio${preview ? `?rol=${role}` : ''}`}>InnovaTecNM ↗</Link>}</div></nav>
    <main className="portal-main" id="contenido"><div className="preview-bar"><div><strong>Vista de demostración</strong><span>Datos de ejemplo. Los cambios duran hasta recargar; no se realizan cobros.</span></div>{preview && <label>Cambiar rol<select aria-label="Cambiar rol de vista previa" value={role} onChange={e => { notify(''); navigate(`/vista-previa/${rolePaths[e.target.value]}/inicio`); }}><option value="estudiante">Emprendedor</option><option value="admin">Coordinador</option><option value="externo">Externo</option></select></label>}</div>
      {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Cerrar aviso" onClick={() => notify('')}>×</button></div>}
      <div key={location.pathname}><Outlet context={{ role, preview, base, query, userId: role === 'admin' ? 'ana' : role === 'externo' ? 'karla' : 'diego' }} /></div>
    </main><footer className="portal-footer"><span>ITS · Incubadora en Línea</span><span>Emprendimiento · Innovación · Comunidad</span></footer>
  </div>;
}
