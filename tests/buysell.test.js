import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasNumbers } from '../app/js/views/buysell.js';
import { t } from '../app/js/i18n.js';

test('the Clear button shows beside the example once any box holds a number', () => {
  assert.equal(hasNumbers('', ''), false);
  assert.equal(hasNumbers('  ', '', ''), false);
  assert.equal(hasNumbers('20', ''), true);
  assert.equal(hasNumbers('', '950.000'), true);
  assert.equal(t('ar', 'clearFields'), 'مسح');
  assert.equal(t('en', 'clearFields'), 'Clear');
  assert.equal(t('ar', 'showExample'), 'عرض مثال');
});
