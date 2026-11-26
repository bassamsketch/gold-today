import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasNumbers, OFFER_VIEW, PRICE_VIEW } from '../app/js/views/buysell.js';
import { t, STRINGS } from '../app/js/i18n.js';

test('the Clear button shows beside the example once any box holds a number', () => {
  assert.equal(hasNumbers('', ''), false);
  assert.equal(hasNumbers('  ', '', ''), false);
  assert.equal(hasNumbers('20', ''), true);
  assert.equal(hasNumbers('', '950.000'), true);
  assert.equal(t('ar', 'clearFields'), 'مسح');
  assert.equal(t('en', 'clearFields'), 'Clear');
  assert.equal(t('ar', 'showExample'), 'عرض مثال');
});

test('every offer verdict has a headline, a note, a tip and an icon, in both languages', () => {
  for (const verdict of ['above', 'close', 'usual', 'low']) {
    const v = OFFER_VIEW[verdict];
    assert.ok(v && v.icon, verdict);
    for (const key of [v.head, v.note, v.tip]) {
      assert.ok(STRINGS.ar[key] && STRINGS.en[key], `${verdict}: ${key}`);
    }
  }
});

test('every price verdict has a headline, a tip and an icon, in both languages', () => {
  for (const pos of ['below', 'within', 'above', 'under']) {
    const v = PRICE_VIEW[pos];
    assert.ok(v && v.icon, pos);
    for (const key of [v.head, v.tip, v.tipBar].filter(Boolean)) assert.ok(STRINGS.ar[key] && STRINGS.en[key], `${pos}: ${key}`);
  }
});
