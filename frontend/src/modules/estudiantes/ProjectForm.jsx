import { FullRegistration, availableRegistration, registrationSummary } from '../../shared/registration/FullRegistration.jsx';
import { useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { usePortalRoute } from '../../shared/portal/PortalLayout.jsx';
import { today, uid } from '../../shared/portal/data.js';
import { Empty, Heading, Panel } from '../../shared/portal/ui.jsx';


export function ProjectForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data, update, notify, busy } = usePortal();
  const { base, userId } = usePortalRoute();
  const navigate = useNavigate();
  const existing = data.projects.find(p => p.id === id && p.owner === userId);
  const person = data.users.find(u => u.id === userId);
  const registration = availableRegistration(data, userId, existing?.registro_id || params.get('registro'));
  const ready = registration?.estatus === 'Aprobado' ? registration : null;
  const projectId = useRef(id);
  async function create() {
    if (!ready) return;
    projectId.current ||= uid();
    if (!await update('projects', { ...existing, ...registrationSummary(ready), id: projectId.current, owner: userId, fecha: existing?.fecha || today(), progreso: existing?.progreso || 0, comentario: existing?.comentario || '' })) return;
    notify('Proyecto creado a partir de tu registro.'); navigate(`${base}/proyectos`);
  }
  if (id && !existing) return <Empty>No se encontró el proyecto.</Empty>;
  return <><Heading title={existing ? 'Editar proyecto' : 'Nuevo proyecto'} description="Completa el formato, envíalo a revisión y espera la aprobación de coordinación para crear tu proyecto." />
    <FullRegistration registration={registration} person={person} readOnly={!!existing?.registro_id} />
    <Panel title="Paso 2. Proyecto"><p>La creación se habilita cuando coordinación aprueba el registro.</p><div className="form-actions"><Link className="button secondary" to={`${base}/proyectos`}>Volver</Link>{!existing?.registro_id && <button className="button" disabled={!ready || busy} onClick={create}>{existing ? 'Vincular registro al proyecto' : 'Crear proyecto con este registro'}</button>}</div></Panel>
  </>;
}
