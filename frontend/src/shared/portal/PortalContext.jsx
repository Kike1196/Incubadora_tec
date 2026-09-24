import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { previewRegistrationMetadata } from '../registration/metadata';
import { initialData, today, uid } from './data.js';

const Context = createContext(null);
export const PortalContext = Context;
const emptyData = () => Object.fromEntries([...Object.keys(initialData()), 'members', 'documents', 'history', 'initialRegistrations'].map(key => [key, []]));
export const errorMessage = error => {
  const detail = error.response?.data?.detail;
  return typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(e => e.msg).join('. ') : 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
};

export function PortalProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const preview = location.pathname.startsWith('/vista-previa');
  const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('access_token');
  const identity = preview ? 'preview' : token || 'anonymous';
  const [loadedFor, setLoadedFor] = useState(preview ? identity : null);
  const [data, setData] = useState(() => preview ? { ...emptyData(), ...initialData() } : emptyData());
  const [user, setUser] = useState(null);
  const [notice, notify] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [paymentsMode, setPaymentsMode] = useState(preview ? 'prueba' : 'deshabilitado');
  const inFlight = useRef(false);
  const refreshSequence = useRef(0);
  const activeIdentity = useRef(identity);
  activeIdentity.current = identity;

  async function refresh() {
    const captured = identity;
    const sequence = ++refreshSequence.current;
    try {
      const response = await api.get('/portal/state');
      if (activeIdentity.current !== captured || sequence !== refreshSequence.current) return false;
      setData(response.data.data); setUser(response.data.user);
      localStorage.setItem('rol', response.data.user.rol);
      setPaymentsMode(response.data.paymentsMode);
      setLoadedFor(captured); setError('');
      return true;
    } catch (err) {
      if (activeIdentity.current !== captured || sequence !== refreshSequence.current) return false;
      setError(errorMessage(err));
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token'); localStorage.removeItem('rol');
        setUser(null); setData(emptyData()); navigate('/login');
      }
      return false;
    }
  }
  useEffect(() => {
    setError(''); notify(''); setUser(null);
    if (preview) { setData({ ...emptyData(), ...initialData() }); setLoadedFor(identity); setPaymentsMode('prueba'); }
    else if (token) { setData(emptyData()); refresh(); }
    else { setData(emptyData()); setLoadedFor(identity); }
  }, [identity]);

  useEffect(() => {
    const onFocus = () => {
      if (!preview && token && !inFlight.current && !document.querySelector('form[data-unsaved="true"]')) refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [identity]);

  async function perform(action) {
    if (inFlight.current) return null;
    inFlight.current = true; setBusy(true); setError(''); notify('');
    try {
      const response = await action();
      if (!(await refresh())) {
        setError('La operación se guardó, pero no pudimos actualizar la pantalla. Pulsa Actualizar datos.');
        return null;
      }
      return response.data;
    } catch (err) {
      setError(errorMessage(err));
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token'); localStorage.removeItem('rol'); navigate('/login');
      }
      return null;
    } finally { inFlight.current = false; setBusy(false); }
  }
  async function update(collection, item) {
    if (preview) {
      setData(previous => {
        const rows = previous[collection];
        const existing = rows.find(row => row.id === item.id);
        const saved = collection === 'initialRegistrations'
          ? { ...item, datos: { ...item.datos, ...previewRegistrationMetadata(rows, existing) } }
          : item;
        return { ...previous, [collection]: existing ? rows.map(row => row.id === item.id ? { ...row, ...saved } : row) : [...rows, saved] };
      });
      return true;
    }
    return (await perform(() => api.put(`/portal/${collection}/${item.id}`, item))) !== null;
  }
  async function remove(collection, id) {
    if (preview) { setData(previous => ({ ...previous, [collection]: previous[collection].filter(row => row.id !== id) })); return true; }
    return (await perform(() => api.delete(`/portal/${collection}/${id}`))) !== null;
  }
  async function register(eventId, userId, resultado = null) {
    if (preview) {
      const event = data.events.find(e => e.id === eventId);
      const confirmed = resultado !== 'Rechazado';
      setData(previous => ({ ...previous,
        payments: event.precio ? [...previous.payments, { id: uid(), event: eventId, user: userId, importe: event.precio, estatus: resultado, fecha: today(), modo: 'prueba' }] : previous.payments,
        registrations: confirmed ? [...previous.registrations, { id: uid(), event: eventId, user: userId, estatus: 'Confirmada' }] : previous.registrations,
      }));
      return { confirmed };
    }
    return perform(() => api.post(`/portal/events/${eventId}/register`, { resultado }));
  }
  async function addType(nombre) {
    if (preview) { setData(previous => ({ ...previous, eventTypes: [...previous.eventTypes, nombre] })); return true; }
    return (await perform(() => api.post('/portal/event-types', { nombre }))) !== null;
  }
  async function addMember(project, correo) {
    if (preview) { notify('Los integrantes se gestionan en el portal con sesión iniciada.'); return false; }
    return (await perform(() => api.post(`/portal/projects/${project}/members`, { correo }))) !== null;
  }
  async function downloadFile(file) {
    if (preview && file.data) {
      const link = document.createElement('a'); link.href = file.data; link.download = file.name; link.click(); return;
    }
    try {
      const response = await api.get(`/portal/documents/${file.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = file.name; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('No se pudo descargar el archivo. Verifica tu sesión e inténtalo de nuevo.'); }
  }
  async function reviewRegistration(id, estatus, estatus_anterior, observaciones) {
    if (preview) {
      setData(previous => ({ ...previous, initialRegistrations: (previous.initialRegistrations || []).map(r => r.id === id ? { ...r, estatus, observaciones, historial: [...(r.historial || []), { anterior: estatus_anterior, estatus, observaciones, nombre: 'Coordinación (demostración)', fecha: new Date().toISOString() }] } : r) }));
      return true;
    }
    return (await perform(() => api.post(`/portal/initial-registrations/${id}/review`, { estatus, estatus_anterior, observaciones }))) !== null;
  }
  async function downloadRegistration(registration) {
    if (preview) { notify('La descarga está disponible para registros reales aprobados.'); return false; }
    setError('');
    try {
      const response = await api.get(`/portal/initial-registrations/${registration.id}/download`, { responseType: 'blob' });
      const folio = (registration.datos?.['identificacion.folio'] || registration.id).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 100);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url; link.download = `registro-${folio}.docx`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (err) {
      let detail;
      try { detail = JSON.parse(await err.response?.data?.text()).detail; } catch { /* Error sin cuerpo JSON. */ }
      setError(typeof detail === 'string' ? detail : 'No se pudo descargar el formato Word. Inténtalo de nuevo.');
      return false;
    }
  }
  async function downloadRegistrationFile(id, key, name) {
    try {
      const response = await api.get(`/portal/initial-registrations/${id}/files/${key}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = name; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('No se pudo descargar el anexo.'); }
  }
  return <Context.Provider value={{ data, user, preview, notice, notify, error, busy, loading: loadedFor !== identity,
    paymentsMode, update, remove, register, addType, addMember, downloadFile, downloadRegistration, downloadRegistrationFile, reviewRegistration, refresh }}>{children}</Context.Provider>;
}
export const usePortal = () => useContext(Context);
