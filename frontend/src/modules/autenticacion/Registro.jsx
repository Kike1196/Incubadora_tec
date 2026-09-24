import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../shared/api/client.js";
import { errorMessage } from "../../shared/portal/PortalContext.jsx";

const TIPOS_REGISTRO = [
  { valor: "estudiante", etiqueta: "Emprendedor (estudiante ITS)" },
  { valor: "externo", etiqueta: "Externo (empresa / mentor / público)" },
];

export default function Registro() {
  const [tipo, setTipo] = useState("estudiante");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  async function manejarEnvio(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      await api.post("/auth/registro", {
        nombre,
        correo,
        password,
        rol: tipo,
      });
      navigate("/login");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-appbg flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-2xl text-guinda">ITS</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="font-display text-2xl text-guinda-dark mb-6">
            Crear cuenta
          </h1>

          {/* Selector de tipo de registro */}
          <div className="flex gap-2 mb-6">
            {TIPOS_REGISTRO.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => setTipo(t.valor)}
                className={`flex-1 text-xs rounded-md px-3 py-2 border transition-colors ${
                  tipo === t.valor
                    ? "bg-guinda text-white border-guinda"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>

          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label htmlFor="nombre" className="block text-sm text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-institucional"
              />
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm text-gray-700 mb-1">
                {tipo === "estudiante" ? "Correo institucional" : "Correo"}
              </label>
              <input
                id="correo"
                type="email"
                required
                placeholder="nombre@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-institucional"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-institucional"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-guinda hover:bg-guinda-dark text-white rounded-md py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
            >
              {cargando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-institucional font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}