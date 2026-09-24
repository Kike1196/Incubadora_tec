import { DownloadRegistration } from '../src/shared/registration/DownloadRegistration.jsx';
import { FullRegistration } from '../src/shared/registration/FullRegistration.jsx';
import { registrationDate, previewRegistrationMetadata } from '../src/shared/registration/metadata.js';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import { AppRoutes } from '../src/App.jsx';
import { PortalProvider, PortalContext } from '../src/shared/portal/PortalContext.jsx';
import { initialData } from '../src/shared/portal/data.js';
import { occupied } from '../src/shared/events/helpers.js';

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
  ['coordinador/registros', 'Revisión de registros'],
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
assert.ok(render('/coordinador/usuarios').includes('Cargando tu cuenta'), 'Protected routes wait for server identity, not the stored role');
assert.ok(!render('/coordinador/usuarios').includes('Usuarios registrados'), 'No coordinator data before server authorization');
assert.ok(render('/innovatecnm/inicio').includes('Cargando tu cuenta'), 'Innovation waits for server identity');
delete globalThis.localStorage;

// Las rutas autenticadas reciben identidad y datos del servidor, sin catálogo demo.
const liveData = { ...initialData(), members: [], documents: [], history: [] };
for (const [role, id, path] of [['admin', 'ana', 'coordinador'], ['estudiante', 'diego', 'emprendedor'], ['externo', 'karla', 'externo']]) {
  globalThis.localStorage = { getItem: key => key === 'access_token' ? 'test-token' : role };
  const user = { ...liveData.users.find(u => u.id === id), nombre: `Cuenta real ${role}` };
  const context = { data: liveData, user, preview: false, loading: false, paymentsMode: 'prueba', refresh() {}, notify() {} };
  const live = target => renderToString(<StaticRouter location={target}><PortalContext.Provider value={context}><AppRoutes /></PortalContext.Provider></StaticRouter>);
  const home = live(`/${path}/inicio`);
  assert.ok(home.includes(user.nombre), 'Header uses authenticated account name');
  assert.ok(!home.includes('Vista de demostración'), 'Live portal never presents itself as a preview');
  assert.ok(home.includes('Actualizar datos'), 'Live portal offers refresh');
  assert.ok(live(`/${path}/eventos`).includes(role === 'admin' ? 'Gestión de eventos' : 'Aprende, conecta'), 'Live events render');
  if (role === 'estudiante') {
    assert.ok(live(`/${path}/proyectos/ecopack`).includes('Historial de estatus'), 'Live project exposes review history');
    assert.ok(live(`/${path}/proyectos`).includes('EcoPack'), 'Live projects render server data');
  }
  if (role === 'externo') {
    assert.equal(live('/coordinador/usuarios'), '', 'Server external identity cannot open coordinator route');
    assert.equal(live('/innovatecnm/inicio'), '', 'Server external identity cannot open innovation');
  }
}
delete globalThis.localStorage;
console.log(`PASS: ${pages.length} preview pages, ${links.size} internal links, authenticated identities, role boundaries, project history, empty states, checkout capacity and duplicate protection.`);

// El Word completo se captura antes de habilitar el segundo paso.
for (const path of ['emprendedor/proyectos/nuevo', 'externo/solicitud']) {
  const html = render(`/vista-previa/${path}`);
  for (const section of ['PARTE I.', 'PARTE II.', 'PARTE III.', 'PARTE IV.', 'PARTE V.', 'PARTE VI.', 'PARTE VII.', 'PARTE VIII.', 'REQUISITOS DE INGRESO', 'CITA CON COORDINADOR']) assert.ok(html.includes(section), section);
  assert.ok(html.includes('Guardar borrador'));
  assert.ok(html.includes('Enviar a revisión'));
  assert.ok(html.includes('type="file"'));
  assert.match(html, /name="principal.correo1"[^>]*required/);
  for (let block = 1; block <= 6; block++) assert.match(html, new RegExp(`name="control.bloque_${block}.autorizo_nombre"[^>]*disabled`));
}
console.log('PASS: formato completo, borrador, anexos y campos de coordinación protegidos.');

// Each signature group follows the same boundary as its original Word page.
const groupedForm = render('/vista-previa/emprendedor/proyectos/nuevo');
const boundaries = [
  ['principal.egreso', 'socio'],
  ['empresa.cp', 'empresa.colonia'],
  ['clasificacion.ventas', 'descripcion.nombre'],
  ['descripcion.diferenciacion', 'descripcion.ventajas'],
  ['descripcion.experiencia_empresarial', 'descripcion.motivacion'],
  ['revision.principal.formulario', 'control.comentarios'],
];
boundaries.forEach(([before, after], index) => {
  const marker = `name="control.bloque_${index + 1}.elaboro_nombre"`;
  assert.equal(groupedForm.split(marker).length - 1, 1);
  assert.ok(groupedForm.indexOf(`name="${before}"`) < groupedForm.indexOf(marker));
  const next = after === 'socio' ? groupedForm.indexOf('PARTE III.') : groupedForm.indexOf(`name="${after}"`);
  assert.ok(groupedForm.indexOf(marker) < next, `Block ${index + 1} must precede ${after}`);
});
const blockRecord = { id: 'review-blocks', datos: {}, administracion: { 'control.bloque_1.reviso1_nombre': 'Revisor principal', 'control.bloque_6.reviso1_nombre': 'Revisor requisitos' } };
const adminForm = renderToString(<PortalContext.Provider value={{ update() {}, notify() {} }}><FullRegistration registration={blockRecord} administrative /></PortalContext.Provider>);
assert.match(adminForm, /name="control.bloque_1.reviso1_nombre"[^>]*value="Revisor principal"/);
assert.match(adminForm, /name="control.bloque_6.reviso1_nombre"[^>]*value="Revisor requisitos"/);
assert.doesNotMatch(adminForm, /name="control.bloque_\d.reviso1_nombre"[^>]*disabled/);
console.log('PASS: seis revisiones independientes en el orden del Word y editables por coordinación.');

const reviewPage = render('/vista-previa/coordinador/registros');
for (const status of ['Borrador', 'Pendiente', 'En revisión', 'Correcciones solicitadas', 'Aprobado']) assert.ok(reviewPage.includes(status));
console.log('PASS: bandeja administrativa con estados de revisión.');

// El usuario ve metadatos automáticos y los registros históricos conservan su emisión.
const currentDate = registrationDate();
const freshForm = render('/vista-previa/emprendedor/proyectos/nuevo').replace(/<!--.*?-->/g, '');
assert.ok(freshForm.includes(`Fecha de emisión: ${currentDate.split('-').reverse().join('/')}`));
assert.ok(!freshForm.includes('01/03/2016'));
for (const name of ['identificacion.fecha', 'identificacion.folio']) {
  const input = freshForm.match(new RegExp(`<input[^>]*name="${name.replace('.', '\\.')}"[^>]*>`))?.[0];
  assert.ok(input?.includes('readonly=""'), `${name} must be read-only`);
}
assert.ok(freshForm.includes('Se asigna al guardar'));
const existingRecord = { id: 'historical', datos: { 'identificacion.folio': 'ITS-000145', 'identificacion.fecha': '2025-02-03' }, estatus: 'Borrador' };
const savedForm = renderToString(<PortalContext.Provider value={{ update() {}, notify() {} }}><FullRegistration registration={existingRecord} /></PortalContext.Provider>).replace(/<!--.*?-->/g, '');
assert.ok(savedForm.includes('Fecha de emisión: 03/02/2025'));
assert.ok(savedForm.includes('value="ITS-000145"'));
assert.equal(previewRegistrationMetadata([existingRecord])['identificacion.folio'], '000146');
assert.equal(previewRegistrationMetadata([existingRecord], existingRecord)['identificacion.fecha'], '2025-02-03');
assert.equal(previewRegistrationMetadata([existingRecord], existingRecord)['identificacion.folio'], 'ITS-000145');
console.log('PASS: fecha de elaboración, folio automático de solo lectura y continuidad de la serie demo.');

const downloadable = { id: 'approved-form', user: 'owner', estatus: 'Aprobado' };
const downloadButton = (user, record = downloadable, preview = false) => renderToString(<PortalContext.Provider value={{ user, preview, downloadRegistration() {} }}><DownloadRegistration registration={record} /></PortalContext.Provider>);
assert.ok(downloadButton({ id: 'owner', rol: 'estudiante' }).includes('Descargar formato Word'));
assert.ok(downloadButton({ id: 'coordinator', rol: 'admin' }).includes('Descargar formato Word'));
assert.equal(downloadButton({ id: 'other', rol: 'estudiante' }), '');
assert.equal(downloadButton(null), '');
for (const estatus of ['Borrador', 'Pendiente', 'En revisión', 'Correcciones solicitadas']) {
  assert.equal(downloadButton({ id: 'owner', rol: 'estudiante' }, { ...downloadable, estatus }), '');
}
assert.ok(downloadButton(null, downloadable, true).includes('disabled=""'));
console.log('PASS: descarga Word solo para registros aprobados, coordinación y titular.');
