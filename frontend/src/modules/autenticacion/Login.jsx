import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../shared/api/client.js";
import { jwtDecode } from "jwt-decode";

export default function Login() {
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
      const { data } = await api.post("/auth/login", { correo, password });
      localStorage.setItem("access_token", data.access_token);

      // El backend regresa el rol dentro del JWT (claim "rol"); aquí lo
      // decodificamos rápido para redirigir sin pedirlo de nuevo al servidor.
      const payload = jwtDecode(data.access_token);
      localStorage.setItem("rol", payload.rol);

      if (payload.rol === "admin") navigate("/coordinador/inicio");
      else if (payload.rol === "estudiante") navigate("/emprendedor/inicio");
      else navigate("/externo/inicio");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
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
            Bienvenido de vuelta
          </h1>

          <form onSubmit={manejarEnvio} className="space-y-5">
            <div>
              <label
                htmlFor="correo"
                className="block text-sm text-gray-700 mb-1"
              >
                Correo institucional
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
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
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
              {cargando ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>
            
          <p className="text-center text-sm text-gray-600 mt-6">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="text-institucional font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}