import { Events } from './Events';
import { Checkout } from './Checkout';
import { Registrations } from './Registrations';

export const participantRoutes = [
  ['eventos', <Events />],
  ['eventos/:id/checkout', <Checkout />],
  ['inscripciones', <Registrations />],
];
