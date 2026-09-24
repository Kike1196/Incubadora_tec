import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { usePortalRoute } from '../../shared/portal/PortalLayout.jsx';
import { today, uid, dateLabel } from '../../shared/portal/data.js';
import { Badge, Field, Heading, Modal, Panel, Stats, Table, TextArea, formValues } from '../../shared/portal/ui.jsx';

const catalogs = {
  certamen: { title: 'Certamen de Proyectos', description: 'Selecciona el área que mejor representa tu propuesta de innovación.', items: [
    ['Sector Agroindustrial', 'Campo, pesca, acuacultura, tecnificación y sostenibilidad.'],
    ['Industria Eléctrica y Electrónica', 'Hardware, potencia, control, semiconductores y sistemas embebidos.'],
    ['Sector Energético y Electromovilidad', 'Energías renovables, almacenamiento, vehículos e infraestructura de recarga.'],
    ['Tecnologías para la Salud Humana', 'Salud digital, telemedicina, dispositivos médicos y biotecnología.'],
    ['Sostenibilidad Ambiental', 'Restauración ambiental, resiliencia y comunidades sostenibles.'],
    ['Bienes de Consumo Final', 'Productos y servicios para el consumidor final.'],
  ] },
  hackatec: { title: 'HackaTec', description: 'Un reto, un equipo y nuevas maneras de resolver problemas.', items: ['Ecosistemas de Desarrollo', 'Tecnologías Emergentes', 'Tecnologías para la Gestión Pública', 'Tecnologías para el Entretenimiento', 'Software Inteligente', 'HackaHer'].map(t => [t, 'Registra a tu equipo y organiza su propuesta de solución.']) },
  innobotica: { title: 'InnoBótica', description: 'Ingeniería, creatividad y tecnología en movimiento.', items: ['Robots Minisumo', 'Robots Seguidores de Línea', 'Robótica Aplicada', 'Robots Humanoides', 'Robots Buscadores', 'Vehículos Aéreos No Tripulados (VANT)', 'Sistemas Aeroespaciales tipo CanSat', 'Robot Soccer', 'Exhibición de Robótica Bioinspirada'].map(t => [t, 'Consulta tu categoría y prepara la participación de tu equipo.']) },
  innovaccion: { title: 'InnovAcción', description: 'Conecta tus ideas con nuevas oportunidades de transformación.', items: [['InnovAcción', 'Prepara una propuesta de participación. La convocatoria institucional definirá sus requisitos y fechas.']] },
  retos: { title: 'Retos de Transformación Nacional', description: 'Propuestas tecnológicas para los desafíos de nuestro entorno.', items: [['Retos de Transformación Nacional', 'Registra una propuesta. La institución definirá los retos y las condiciones de participación.']] },
};

export default function Innovation({ section = 'inicio' }) {
  const { data, update, notify } = usePortal();
  const { base, query, role, userId } = usePortalRoute();
  const [category, setCategory] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const catalog = catalogs[section];
  const records = data.innovation.filter(r => role === 'admin' || r.user === userId);
  const sourceNote = <p className="helper">Registro interno de propuestas. La participación oficial está sujeta a las convocatorias institucionales.</p>;
  async function register(e) {
    e.preventDefault(); const values = formValues(e);
    if (records.some(r => r.nombre.toLowerCase() === values.nombre.trim().toLowerCase() && r.categoria === category)) { setError('Ya existe una propuesta con ese nombre en esta categoría.'); return; }
    if (!await update('innovation', { ...values, nombre: values.nombre.trim(), id: uid(), user: userId, modulo: catalog.title, categoria: category, etapa: 'Local', estatus: 'Borrador', fecha: today() })) return; setCategory(null); setError(''); notify('Propuesta guardada. Puedes verla en Registros.');
  }
  return <><Heading eyebrow="INNOVATECNM / INNOVACIÓN Y EMPRENDIMIENTO" title={section === 'inicio' ? 'InnovaTecNM' : section === 'registros' ? 'Registro y seguimiento' : catalog.title} description={catalog?.description || 'Cumbre Nacional de Desarrollo Tecnológico, Emprendimiento e Innovación'} action={section !== 'registros' && <Link className="button secondary" to={`${base}/registros${query}`}>Ver registros</Link>} />
    {section === 'inicio' ? <><div className="innovation-hero"><p className="eyebrow">EL TALENTO TRANSFORMA</p><h2>Grandes ideas.<br />Impacto real.</h2><p>Un espacio para desarrollar proyectos, resolver retos y construir el futuro en equipo.</p><div className="stage-row"><span>01 · Local</span><span>02 · Regional</span><span>03 · Nacional</span></div></div><Stats items={[[ 'Certamen de Proyectos', '6', 'Categorías de participación'], ['HackaTec', '6', 'Retos para tu equipo'], ['InnoBótica', '8 + 1', 'Categorías y exhibición'], ['Otros eventos', '2', 'InnovAcción y Retos Nacionales']]} /><div className="module-grid">{Object.entries(catalogs).map(([key, value], index) => <Link className="module-card" key={key} to={`${base}/${key}${query}`}><span className="module-number">0{index + 1}</span><h2>{value.title}</h2><p>{value.description}</p><span className="module-arrow">↗</span></Link>)}</div>{sourceNote}</> : section === 'registros' ? <Panel title={role === 'admin' ? 'Propuestas registradas' : 'Mis propuestas'}><Table headings={['Proyecto / equipo', 'Evento', 'Categoría', 'Etapa', 'Estado', 'Acción']} empty={!records.length}>{records.map(r => <tr key={r.id}><td><strong>{r.nombre}</strong><small>{r.equipo}</small></td><td>{r.modulo}</td><td>{r.categoria}</td><td>{r.etapa}</td><td><Badge>{r.estatus}</Badge></td><td><button className="text-button" onClick={() => setDetail(r)}>Ver detalle</button></td></tr>)}</Table></Panel> : <><div className="category-grid">{catalog.items.map(([title, description], index) => <article className="category-card" key={title}><span className="category-number">{String(index + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p className="muted">{description}</p><button className="text-button" onClick={() => { setCategory(title); setError(''); }}>Preparar registro →</button></div></article>)}</div>{sourceNote}</>}
    {category && <Modal title="Preparar registro" onClose={() => setCategory(null)}><p className="info-box">{catalog.title} · {category}</p><form className="form-stack" onSubmit={register}><Field label="Nombre del proyecto" name="nombre" required maxLength={140} /><Field label="Nombre del equipo" name="equipo" required maxLength={100} /><Field label="Estudiante líder" name="lider" required maxLength={120} /><Field label="Asesor" name="asesor" required maxLength={120} /><TextArea label="Descripción de la propuesta" name="descripcion" required maxLength={2500} />{error && <p className="error" role="alert">{error}</p>}<button className="button">Guardar borrador</button></form></Modal>}
    {detail && <Modal title={detail.nombre} onClose={() => setDetail(null)}><dl className="event-meta"><div><dt>Equipo</dt><dd>{detail.equipo}</dd></div><div><dt>Líder</dt><dd>{detail.lider}</dd></div><div><dt>Asesor</dt><dd>{detail.asesor}</dd></div><div><dt>Registro</dt><dd>{dateLabel(detail.fecha)}</dd></div><div><dt>Categoría</dt><dd>{detail.categoria}</dd></div></dl><p>{detail.descripcion}</p><Badge>{detail.estatus}</Badge>{role === 'admin' && <form className="form-stack" onSubmit={async e => { e.preventDefault(); if (await update('innovation', { ...detail, ...formValues(e) })) { setDetail(null); notify('Seguimiento actualizado.'); } }}><Field label="Etapa" name="etapa" defaultValue={detail.etapa}>{['Local', 'Regional', 'Nacional'].map(t => <option key={t}>{t}</option>)}</Field><Field label="Estatus" name="estatus" defaultValue={detail.estatus}>{['Borrador', 'En revisión', 'Aprobada', 'Rechazada'].map(t => <option key={t}>{t}</option>)}</Field><button className="button">Guardar seguimiento</button></form>}</Modal>}
  </>;
}

