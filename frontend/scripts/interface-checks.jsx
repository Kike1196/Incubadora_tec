import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { AppRoutes } from '../src/App';
import { PortalProvider } from '../src/portal/PortalContext';
import { initialData } from '../src/portal/data';
import { occupied } from '../src/portal/Events';

function render(path) {
  return renderToString(<StaticRouter location={path}><PortalProvider><AppRoutes /></PortalProvider></StaticRouter>);
}

const pages = [
  ['emprendedor/inicio', 'Hola, Diego'],
  ['emprendedor/proyectos', 'Mis proyectos'],
  ['emprendedor/proyectos/nuevo', 'Nuevo proyecto'],
  ['emprendedor/proyectos/ecopack', 'EcoPack'],
  ['emprendedor/proyectos/ecopack/editar', 'Editar proyecto'],
  ['emprendedor/avances', 'Avances de mi proyecto'],
  ['emprendedor/eventos', 'Aprende, conecta y emprende'],
  ['emprendedor/eventos/pitch/checkout', 'Confirma tu inscripción'],
  ['emprendedor/inscripciones', 'Mis inscripciones'],
  ['emprendedor/pagos', 'Mis pagos y comprobantes'],
  ['emprendedor/tutorias', 'Un espacio para avanzar juntos'],
  ['emprendedor/tutorias/agenda', 'Próximas sesiones'],
  ['emprendedor/tutorias/historial', 'Historial de tutorías'],
  ['coordinador/inicio', 'Panel de coordinación'],
  ['coordinador/usuarios', 'Usuarios registrados'],
  ['coordinador/roles', 'Roles y permisos'],
  ['coordinador/eventos', 'Gestión de eventos'],
  ['coordinador/eventos/nuevo', 'Nuevo evento'],
  ['coordinador/eventos/pitch/editar', 'Editar evento'],
  ['coordinador/eventos/tipos', 'Tipos de evento'],
  ['coordinador/eventos/inscripciones', 'Personas inscritas'],
  ['coordinador/pagos', 'Gestión de cobros y pagos'],
  ['coordinador/seguimiento', 'Seguimiento de proyectos'],
  ['coordinador/seguimiento/ecopack', 'EcoPack'],
  ['coordinador/reportes/proyectos', 'Reporte de proyectos'],
  ['coordinador/reportes/emprendedores', 'Reporte de emprendedores'],
  ['coordinador/reportes/avances', 'Reporte de avances'],
  ['coordinador/reportes/estadisticas', 'Proyectos por especialidad'],
  ['coordinador/tutorias', 'Próximas sesiones'],
  ['coordinador/tutorias/disponibilidad', 'Mi disponibilidad'],
  ['coordinador/tutorias/historial', 'Historial de tutorías'],
  ['coordinador/solicitudes', 'Solicitudes de ingreso'],
  ['externo/inicio', 'Hola, Karla'],
  ['externo/eventos', 'Aprende, conecta y emprende'],
  ['externo/solicitud', 'Tu idea puede ser el siguiente gran proyecto'],
  ['externo/pagos', 'Mis pagos y comprobantes'],
  ['externo/inscripciones', 'Mis inscripciones'],
  ['externo/eventos/pitch/checkout', 'Confirma tu inscripción'],
  ...['inicio', 'certamen', 'hackatec', 'innobotica', 'innovaccion', 'retos', 'registros'].flatMap(section => [
    [`innovatecnm/${section}?rol=estudiante`, 'INNOVATECNM'],
    [`innovatecnm/${section}?rol=admin`, 'INNOVATECNM'],
  ]),
];
const links = new Set();
for (const [path, expected] of pages) {
  const html = render(`/vista-previa/${path}`);
  assert.ok(html.includes(expected), `${path}: expected ${expected}`);
  assert.ok(html.includes('Vista de demostración'), `${path}: missing demo label`);
  for (const match of html.matchAll(/href="(\/vista-previa\/[^"#]*)"/g)) links.add(match[1].replaceAll('&amp;', '&'));
}
for (const link of links) assert.ok(!render(link).includes('Página no encontrada'), `Broken preview link: ${link}`);

const external = render('/vista-previa/externo/inicio');
assert.ok(!external.includes('href="/vista-previa/externo/proyectos'), 'External user must not have project navigation');
assert.ok(!external.includes('InnovaTecNM ↗'), 'External user must not have innovation navigation');
assert.ok(render('/vista-previa/emprendedor/proyectos/agrosensor').includes('Proyecto no encontrado'), 'Entrepreneur must not see another owner’s project detail');
assert.ok(render('/vista-previa/emprendedor/proyectos/agrosensor/editar').includes('No se encontró el proyecto'), 'Entrepreneur must not edit another owner’s project');
assert.ok(render('/vista-previa/emprendedor/eventos/no-existe/checkout').includes('Evento no encontrado'), 'Unknown checkout must have an empty state');
assert.ok(render('/ruta-inexistente').includes('Página no encontrada'), 'Unknown route needs a fallback');
const adminInnovation = render('/vista-previa/innovatecnm/inicio?rol=admin');
assert.ok(adminInnovation.includes('/vista-previa/innovatecnm/certamen?rol=admin'), 'Innovation navigation must preserve the preview role');
assert.ok(adminInnovation.includes('/vista-previa/innovatecnm/registros?rol=admin'), 'Innovation records link must preserve the preview role');

const data = initialData();
assert.equal(occupied(data, data.events.find(e => e.id === 'pitch')), 11);
assert.equal(occupied(data, data.events.find(e => e.id === 'finanzas')), 20);
const full = render('/vista-previa/emprendedor/eventos/finanzas/checkout');
assert.match(full, /button[^>]*disabled=""[^>]*>Simular pago de prueba/, 'Full event must disable checkout');
const ownRegistration = render('/vista-previa/emprendedor/eventos/feria/checkout');
assert.ok(ownRegistration.includes('Ya tienes una inscripción'), 'Duplicate checkout must be blocked');

// Test route guards with an isolated storage stub, without touching browser sessions.
globalThis.localStorage = { getItem: () => null };
assert.equal(render('/coordinador/usuarios'), '', 'Unauthenticated route must redirect');
globalThis.localStorage = { getItem: key => key === 'access_token' ? 'test-token' : 'externo' };
assert.equal(render('/coordinador/usuarios'), '', 'External role must not render coordinator routes');
assert.equal(render('/innovatecnm/inicio'), '', 'External role must not render protected innovation');
delete globalThis.localStorage;
console.log(`PASS: ${pages.length} page renders, ${links.size} internal links, role boundaries, empty states, checkout capacity and duplicate protection.`);
