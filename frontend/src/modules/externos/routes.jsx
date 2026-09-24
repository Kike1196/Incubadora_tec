import { Application } from '../../shared/applications/Application';
import { participantRoutes } from '../../shared/events/routes';

export const externalRoutes = [
  ...participantRoutes,
  ['solicitud', <Application />],
];
