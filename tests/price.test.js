import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gramPrice, formatNum } from '../app/js/price.js';

test('gramPrice converts $/oz to OMR per gram by karat', () => {
  assert.ok(Math.abs(gramPrice(3470, 24) - 42.896) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 22) - 39.321) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 21) - 37.534) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 18) - 32.172) < 0.001);
});

test('formatNum groups thousands and fixes decimals', () => {
  assert.equal(formatNum(4403.2, 0), '4,403');
  assert.equal(formatNum(39.3214, 3), '39.321');
});
