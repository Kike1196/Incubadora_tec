import { coordinationRoutes } from './modules/coordinacion/routes';
import { studentRoutes } from './modules/estudiantes/routes';
import { externalRoutes } from './modules/externos/routes';
import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams } from 'react-router-dom';
import RutaProtegida from './modules/autenticacion/RutaProtegida.jsx';
import Landing from './modules/publico/Landing.jsx';
import Login from './modules/autenticacion/Login.jsx';
import Registro from './modules/autenticacion/Registro.jsx';
import { PortalProvider } from './shared/portal/PortalContext.jsx';
import PortalLayout from './shared/portal/PortalLayout.jsx';
import Home from './shared/portal/Home.jsx';
import { Payments } from './shared/events/Payments.jsx';
import Innovation from './modules/innovacion/Innovation.jsx';
import { rolePaths } from './shared/portal/data.js';
import './shared/portal/portal.css';

function InnovationLayout({ preview }) {
  const [params] = useSearchParams();
  const role = preview ? (params.get('rol') === 'admin' ? 'admin' : 'estudiante') : localStorage.getItem('rol');
  return <PortalLayout role={role} preview={preview} innovation />;
}

const actorRoutes = { admin: coordinationRoutes, estudiante: studentRoutes, externo: externalRoutes };

function portalRoutes(role, preview) {
  const base = `${preview ? '/vista-previa' : ''}/${rolePaths[role]}`;
  const layout = <PortalLayout role={role} preview={preview} />;
  return <Route key={base} path={base} element={preview ? layout : <RutaProtegida rolesPermitidos={[role]}>{layout}</RutaProtegida>}>
    <Route index element={<Navigate to="inicio" replace />} />
    <Route path="inicio" element={<Home />} />
    <Route path="pagos" element={<Payments />} />
    {actorRoutes[role].map(([path, element]) => <Route key={path} path={path} element={element} />)}
  </Route>;
}

export function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Registro />} />
    <Route path="/vista-previa" element={<Navigate to="/vista-previa/emprendedor/inicio" replace />} />
    {[false, true].flatMap(preview => ['estudiante', 'admin', 'externo'].map(role => portalRoutes(role, preview)))}
    {[false, true].map(preview => <Route key={`innovation-${preview}`} path={`${preview ? '/vista-previa' : ''}/innovatecnm`} element={preview ? <InnovationLayout preview /> : <RutaProtegida rolesPermitidos={['admin', 'estudiante']}><InnovationLayout /></RutaProtegida>}>
      <Route index element={<Navigate to="inicio" replace />} />
      {['inicio', 'certamen', 'hackatec', 'innobotica', 'innovaccion', 'retos', 'registros'].map(section => <Route key={section} path={section} element={<Innovation section={section} />} />)}
    </Route>)}
    <Route path="*" element={<div className="not-found"><h1>Página no encontrada</h1><p>La dirección no corresponde a una pantalla disponible.</p><Link className="button" to="/">Volver al inicio</Link></div>} />
  </Routes>;
}

export default function App() {
  return <BrowserRouter><PortalProvider><AppRoutes /></PortalProvider></BrowserRouter>;
}
