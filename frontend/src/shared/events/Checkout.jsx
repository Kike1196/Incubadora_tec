import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePortal } from '../portal/PortalContext.jsx';
import { usePortalRoute } from '../portal/PortalLayout.jsx';
import { dateLabel, money } from '../portal/data.js';
import { Empty, Field, Heading, Panel } from '../portal/ui.jsx';
import { occupied, closed } from './helpers.js';

export function Checkout() {
  const { id } = useParams();
  const { data, register: registerEvent, remove, notify, paymentsMode } = usePortal();
  const { base, userId } = usePortalRoute();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [result, setResult] = useState('Pagado');
  const event = data.events.find(e => e.id === id);
  if (!event) return <Empty>Evento no encontrado.</Empty>;
  const registered = data.registrations.some(r => r.event === id && r.user === userId);
  const unavailable = registered || closed(event) || occupied(data, event) >= event.cupo;
  async function pay(e) {
    e.preventDefault();
    if (unavailable) return;
    const response = await registerEvent(id, userId, result);
    if (!response) return;
    if (!response.confirmed) { setError('Pago de prueba rechazado. No se reservó lugar ni se realizó ningún cargo. Puedes volver a intentarlo.'); return; }
    notify('Pago de prueba registrado e inscripción confirmada. No se realizó ningún cobro.'); navigate(`${base}/pagos`);
  }
  return <><Heading title="Confirma tu inscripción" description="Revisa los detalles de tu actividad antes de continuar." /><ol className="checkout-steps"><li>1 · Seleccionar evento</li><li className="active">2 · Confirmar datos</li><li>3 · Pago</li><li>4 · Comprobante</li></ol><div className="two-columns"><Panel title={event.nombre}><p className="muted">{dateLabel(event.fecha)} · {event.hora} · {event.modalidad}</p><p>{event.descripcion}</p><hr /><div className="row between"><strong>Total de inscripción</strong><strong className="checkout-total">{money(event.precio)} <small>MXN</small></strong></div><p className="helper">La inscripción incluye acceso a la actividad en la fecha y modalidad indicadas.</p></Panel><Panel title="Método de pago"><form className="form-stack" onSubmit={pay}><div className="payment-method">Pago de prueba · Sin cobro real</div><p className="info-box">La pasarela institucional todavía no está conectada. Aquí puedes probar el flujo sin introducir datos bancarios ni realizar cobros.</p><Field label="Resultado de la simulación" value={result} onChange={e => { setResult(e.target.value); setError(''); }}><option>Pagado</option><option>Rechazado</option></Field><label className="checkbox-label"><input type="checkbox" required /> Revisé el evento, su fecha y el importe.</label>{error && <p className="error" role="alert">{error}</p>}{unavailable && <p role="status">{registered ? 'Ya tienes una inscripción para este evento.' : 'El evento ya no está disponible o no tiene cupo.'}</p>}{paymentsMode !== 'prueba' && <p role="alert">Los pagos no están habilitados.</p>}<button className="button" disabled={unavailable || paymentsMode !== 'prueba'}>Simular pago de prueba</button><Link className="text-link" to={`${base}/eventos`}>← Volver a los eventos</Link></form></Panel></div></>;
}
