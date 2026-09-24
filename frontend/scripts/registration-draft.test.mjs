import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDraft, writeDraft, removeDraft } from '../src/shared/registration/draft.js';

test('recovers unsaved text and attachment warning, isolates users, clears saved drafts', () => {
  const entries = new Map();
  globalThis.sessionStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
  };
  try {
    const draft = { values: { 'empresa.nombre': 'Mi empresa', 'principal.telefono_celular': '001234' }, administration: {}, pendingFiles: true };
    assert.equal(writeDraft('user1:new', draft), true);
    assert.deepEqual(readDraft('user1:new'), draft);
    assert.equal(readDraft('user2:new'), null);
    removeDraft('user1:new');
    assert.equal(readDraft('user1:new'), null);
    entries.set('invalid', '{');
    assert.equal(readDraft('invalid'), null);
    entries.set('invalid', '{"values":[]}');
    assert.equal(readDraft('invalid'), null);
  } finally { delete globalThis.sessionStorage; }
});

test('unavailable or full browser storage does not crash the form', () => {
  globalThis.sessionStorage = {
    getItem() { throw new Error('Unavailable'); },
    setItem() { throw new Error('Quota exceeded'); },
    removeItem() { throw new Error('Unavailable'); },
  };
  try {
    assert.equal(readDraft('draft'), null);
    assert.equal(writeDraft('draft', { values: {} }), false);
    assert.doesNotThrow(() => removeDraft('draft'));
  } finally { delete globalThis.sessionStorage; }
});
