// La vista previa simula la misma serie; los folios reales los asigna la API.
export function registrationDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function previewRegistrationMetadata(records, existing) {
  const highest = records.reduce((max, row) => {
    const match = (row.datos?.['identificacion.folio'] || '').trim().match(/([0-9]+)$/);
    const number = match ? BigInt(match[1]) : 0n;
    return number > max ? number : max;
  }, 0n);
  return {
    'identificacion.folio': existing?.datos?.['identificacion.folio'] || String(highest + 1n).padStart(6, '0'),
    'identificacion.fecha': existing?.datos?.['identificacion.fecha'] || registrationDate(),
  };
}
