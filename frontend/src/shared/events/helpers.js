import { today } from '../portal/data';
export const occupied = (data, event) => event.ocupados + data.registrations.filter(r => r.event === event.id && r.estatus === 'Confirmada').length;
export const closed = event => event.estatus !== 'Activo' || event.fecha < today();
