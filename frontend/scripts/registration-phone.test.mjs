import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneError } from '../src/shared/registration/validation.js';

test('accepts optional empty phones and supported formats including pasted outer spaces', () => {
  for (const value of ['', '   ', '8441234567', '+52 (844) 123-4567', ' 8441234567 ', '1'.repeat(20)]) {
    assert.equal(phoneError(value), '', value);
  }
});

test('rejects placeholders, short numbers, unsupported characters and excessive length', () => {
  for (const value of ['N/A', 'No tengo', '844123456', '1'.repeat(21), '844.123.4567', '8441234567 ext 1']) {
    assert.notEqual(phoneError(value), '', value);
  }
});
