import { ProjectForm } from './ProjectForm';
import { Projects, ProjectDetail } from '../../shared/projects/Projects';
import { Tutoring } from '../../shared/tutoring/Tutoring';
import { participantRoutes } from '../../shared/events/routes';

export const studentRoutes = [
  ...participantRoutes,
  ['proyectos', <Projects />],
  ['proyectos/nuevo', <ProjectForm />],
  ['proyectos/:id', <ProjectDetail />],
  ['proyectos/:id/editar', <ProjectForm />],
  ['avances', <ProjectDetail advances />],
  ['tutorias', <Tutoring />],
  ...['agenda', 'historial', 'agendar'].map(tab => [`tutorias/${tab}`, <Tutoring initialTab={tab} />]),
];
