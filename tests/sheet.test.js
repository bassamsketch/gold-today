import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOutside } from '../app/js/ui/sheet.js';

test('a tap inside the sheet, even on its padding, does not count as the backdrop (QA7)', () => {
  const rect = { left: 0, top: 300, right: 390, bottom: 844 };
  assert.equal(isOutside(rect, 8, 500), false, 'inner gutter');
  assert.equal(isOutside(rect, 200, 120), true, 'above the sheet');
  assert.equal(isOutside(rect, 0, 0), false, 'keyboard clicks report 0,0');
});
