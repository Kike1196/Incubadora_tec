import { Link } from "react-router-dom";

const eventos = [
  {
    etiqueta: "Taller",
    titulo: "Taller de Pitch Deck",
    fecha: "05 SEP",
  },
  {
    etiqueta: "Convocatoria",
    titulo: "Feria de Emprendimiento ITS",
    fecha: "18 SEP",
    detalle:
      "Nueva generación de incubación 2026–2027. Registro abierto para proyectos de base tecnológica del ITS. Cupo limitado.",
  },
  {
    etiqueta: "Capacitación",
    titulo: "Finanzas para startups",
    fecha: "01 OCT",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-appbg font-body text-gray-800">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-guinda">ITS</span>
            <span className="text-sm text-gray-500">Incubadora ITS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#inicio">Inicio</a>
            <Link to="/vista-previa/emprendedor/proyectos">Proyectos</Link>
            <a href="#eventos">Eventos</a>
            <Link to="/vista-previa/emprendedor/tutorias">Tutorías</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-institucional">
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="text-sm bg-guinda text-white px-4 py-2 rounded-md hover:bg-guinda-dark"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <section id="inicio" className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sm text-institucional mb-3">
          Instituto Tecnológico de Saltillo
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-guinda-dark max-w-2xl leading-tight">
          Centro de Emprendurismo y Negocios del ITS
        </h1>
        <p className="text-gray-600 max-w-xl mt-5 text-base">
          Evaluamos la factibilidad de tu proyecto y te acompañamos con
          asesoría legal, administrativa y de financiamiento.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/registro" className="button">Comenzar mi proyecto</Link>
          <Link to="/vista-previa/emprendedor/inicio" className="button secondary">Explorar interfaces de demostración →</Link>
        </div>
        <p className="mt-3 text-xs text-gray-500">Vista previa de Emprendedor, Coordinador y Externo con datos de ejemplo.</p>
      </section>

      <section id="eventos" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl text-guinda-dark mb-6">
          Noticias y eventos
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {eventos.map((ev) => (
            <div
              key={ev.titulo}
              className="bg-white rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-institucional font-medium">
                  {ev.etiqueta}
                </span>
                <span className="text-xs text-gray-400">{ev.fecha}</span>
              </div>
              <h3 className="font-display text-lg text-guinda-dark mb-2">
                {ev.titulo}
              </h3>
              {ev.detalle && (
                <p className="text-sm text-gray-600">{ev.detalle}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-display text-lg text-guinda-dark mb-2">
              Misión
            </h3>
            <p className="text-sm text-gray-600">
              Crear las condiciones para que la idea, el talento y la
              tecnología generen empresas competitivas.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg text-guinda-dark mb-2">
              Visión
            </h3>
            <p className="text-sm text-gray-600">
              Ser el modelo de incubación que impulsa el desarrollo
              socioeconómico de la comunidad ITS.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg text-guinda-dark mb-2">
              Valores
            </h3>
            <p className="text-sm text-gray-600">
              Responsabilidad social, ética profesional, honestidad y
              solidaridad.
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-gray-500 flex flex-col md:flex-row gap-2 md:justify-between">
        <span>Blvd. Venustiano Carranza #2400, Col. Tecnológico, Saltillo, Coahuila</span>
        <span>844 288 9460 · incubadora.its@saltillo.tecnm.mx</span>
      </footer>
    </div>
  );
}
