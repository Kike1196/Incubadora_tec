import { useState } from 'react';
import { usePortal } from '../portal/PortalContext';

export function DownloadRegistration({ registration }) {
  const { user, preview, busy, downloadRegistration } = usePortal();
  const [downloading, setDownloading] = useState(false);
  if (registration?.estatus !== 'Aprobado') return null;
  if (!preview && (!user || (user.rol !== 'admin' && user.id !== registration.user))) return null;
  async function download() {
    setDownloading(true);
    try { await downloadRegistration(registration); }
    finally { setDownloading(false); }
  }
  return <button type="button" className="button secondary small" disabled={busy || downloading || preview}
    title={preview ? 'La descarga está disponible para registros aprobados con sesión iniciada.' : undefined}
    onClick={download}>{downloading ? 'Preparando Word…' : 'Descargar formato Word'}</button>;
}
