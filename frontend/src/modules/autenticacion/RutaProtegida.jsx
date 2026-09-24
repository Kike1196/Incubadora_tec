import { Navigate } from "react-router-dom";
import { usePortal } from '../../shared/portal/PortalContext.jsx';
import { rolePaths } from '../../shared/portal/data.js';

export default function RutaProtegida({ children, rolesPermitidos }) {
  const token = localStorage.getItem("access_token");
  const { user, loading, error, refresh } = usePortal();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading || !user) {
    return <div className="panel" role="status">{error || 'Cargando tu cuenta…'}{error && <button className="button" onClick={refresh}>Reintentar</button>}</div>;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to={`/${rolePaths[user.rol]}/inicio`} replace />;
  }

  return children;
}
