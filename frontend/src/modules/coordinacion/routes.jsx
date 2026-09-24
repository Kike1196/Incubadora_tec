import { EventManagement, EventForm } from './EventManagement';
import { Users, Roles } from './Users';
import { Reports } from './Reports';
import RegistrationReview from './RegistrationReview';
import { Projects, ProjectDetail } from '../../shared/projects/Projects';
import { Application } from '../../shared/applications/Application';
import { Tutoring } from '../../shared/tutoring/Tutoring';

export const coordinationRoutes = [
  ['eventos', <EventManagement />],
  ['usuarios', <Users />],
  ['roles', <Roles />],
  ['eventos/nuevo', <EventForm />],
  ['eventos/:id/editar', <EventForm />],
  ['eventos/inscripciones', <EventManagement initialTab="inscripciones" />],
  ['eventos/tipos', <EventManagement initialTab="tipos" />],
  ['inscripciones', <EventManagement initialTab="inscripciones" />],
  ['seguimiento', <Projects />],
  ['seguimiento/:id', <ProjectDetail />],
  ['reportes', <Reports />],
  ...['proyectos', 'emprendedores', 'avances', 'estadisticas'].map(tab => [`reportes/${tab}`, <Reports initialTab={tab} />]),
  ['solicitudes', <Application admin />],
  ['registros', <RegistrationReview />],
  ['tutorias', <Tutoring />],
  ...['agenda', 'historial', 'disponibilidad'].map(tab => [`tutorias/${tab}`, <Tutoring initialTab={tab} />]),
];
