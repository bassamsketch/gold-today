import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryKey } from '../app/js/views/buysell.js';
import { t } from '../app/js/i18n.js';

test('the example button turns into Clear once any box holds a number, and back when all are empty', () => {
  assert.equal(tryKey('', ''), 'showExample');
  assert.equal(tryKey('  ', '', ''), 'showExample');
  assert.equal(tryKey('20', ''), 'clearFields');
  assert.equal(tryKey('', '950.000'), 'clearFields');
  assert.equal(tryKey('', '', '3'), 'clearFields');
  assert.equal(t('ar', 'clearFields'), 'مسح');
  assert.equal(t('en', 'clearFields'), 'Clear');
});
