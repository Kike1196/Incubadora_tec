export function readDraft(key) {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key));
    return draft && draft.values && typeof draft.values === 'object' && !Array.isArray(draft.values) ? draft : null;
  } catch { return null; }
}

export function writeDraft(key, draft) {
  try { sessionStorage.setItem(key, JSON.stringify(draft)); return true; }
  catch { return false; }
}

export function removeDraft(key) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}
