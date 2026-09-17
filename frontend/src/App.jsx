import { BrowserRouter, Routes, Route, Navigate, Link, useSearchParams } from 'react-router-dom';
import RutaProtegida from './routes/RutaProtegida.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import { PortalProvider } from './portal/PortalContext';
import PortalLayout from './portal/PortalLayout';
import Home from './portal/Home';
import { Projects, ProjectForm, ProjectDetail } from './portal/Projects';
import { Events, EventManagement, EventForm, Checkout, Payments, Registrations } from './portal/Events';
import { Users, Roles, Reports, Application, Tutoring } from './portal/Coordination';
import Innovation from './portal/Innovation';
import { rolePaths } from './portal/data';
import './portal/portal.css';

function InnovationLayout({ preview }) {
  const [params] = useSearchParams();
  const role = preview ? (params.get('rol') === 'admin' ? 'admin' : 'estudiante') : localStorage.getItem('rol');
  return <PortalLayout role={role} preview={preview} innovation />;
}

function portalRoutes(role, preview) {
  const base = `${preview ? '/vista-previa' : ''}/${rolePaths[role]}`;
  const layout = <PortalLayout role={role} preview={preview} />;
  return <Route key={base} path={base} element={preview ? layout : <RutaProtegida rolesPermitidos={[role]}>{layout}</RutaProtegida>}>
    <Route index element={<Navigate to="inicio" replace />} />
    <Route path="inicio" element={<Home />} />
    <Route path="eventos" element={role === 'admin' ? <EventManagement /> : <Events />} />
    <Route path="pagos" element={<Payments />} />
    {role === 'admin' ? <>
      <Route path="usuarios" element={<Users />} />
      <Route path="roles" element={<Roles />} />
      <Route path="eventos/nuevo" element={<EventForm />} />
      <Route path="eventos/:id/editar" element={<EventForm />} />
      <Route path="eventos/inscripciones" element={<EventManagement initialTab="inscripciones" />} />
      <Route path="eventos/tipos" element={<EventManagement initialTab="tipos" />} />
      <Route path="inscripciones" element={<EventManagement initialTab="inscripciones" />} />
      <Route path="seguimiento" element={<Projects />} />
      <Route path="seguimiento/:id" element={<ProjectDetail />} />
      <Route path="reportes" element={<Reports />} />
      {['proyectos', 'emprendedores', 'avances', 'estadisticas'].map(tab => <Route key={tab} path={`reportes/${tab}`} element={<Reports initialTab={tab} />} />)}
      <Route path="solicitudes" element={<Application admin />} />
    </> : <>
      <Route path="eventos/:id/checkout" element={<Checkout />} />
      <Route path="inscripciones" element={<Registrations />} />
    </>}
    {role === 'estudiante' && <>
      <Route path="proyectos" element={<Projects />} />
      <Route path="proyectos/nuevo" element={<ProjectForm />} />
      <Route path="proyectos/:id" element={<ProjectDetail />} />
      <Route path="proyectos/:id/editar" element={<ProjectForm />} />
      <Route path="avances" element={<ProjectDetail advances />} />
    </>}
    {role !== 'externo' && <><Route path="tutorias" element={<Tutoring />} />{['agenda', 'historial', ...(role === 'admin' ? ['disponibilidad'] : ['agendar'])].map(tab => <Route key={tab} path={`tutorias/${tab}`} element={<Tutoring initialTab={tab} />} />)}</>}
    {role === 'externo' && <Route path="solicitud" element={<Application />} />}
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
