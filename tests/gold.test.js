import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePiece, sellEstimate, pieceGain, totalGain } from '../app/js/gold.js';

const piece = (o) => ({ id: 'a', name: '', grams: 100, karat: 21, boughtPrice: null, boughtYm: null, ...o });

test('sell estimate applies the 2-6% deduction', () => {
  const e = sellEstimate([piece()], 3470);
  assert.ok(Math.abs(e.low - 3528.2) < 0.1 && Math.abs(e.high - 3678.3) < 0.1 && Math.abs(e.mid - 3603.2) < 0.1);
});

test('gain counts only pieces with a bought price', () => {
  const p = [piece({ boughtPrice: 3000, boughtYm: '2019-03' }), piece({ id: 'b', grams: 10, karat: 22 })];
  const g = totalGain(p, 3470);
  assert.equal(g.counted, 1);
  assert.equal(g.of, 2);
  assert.ok(Math.abs(g.amount - 603.2) < 0.1);
  assert.equal(pieceGain(p[1], 3470), null);
  assert.ok(Math.abs(pieceGain(p[0], 3470).pct - 0.2011) < 0.001);
});

test('totalGain is null when no piece has a bought price', () => {
  assert.equal(totalGain([piece()], 3470), null);
});

test('validatePiece fills optional fields and rejects bad weights or karats', () => {
  const v = validatePiece({ grams: 12.5, karat: 22 });
  assert.equal(v.name, '');
  assert.equal(v.boughtPrice, null);
  assert.equal(typeof v.id, 'string');
  assert.equal(validatePiece({ grams: 6000, karat: 22 }), null);
  assert.equal(validatePiece({ grams: 0, karat: 22 }), null);
  assert.equal(validatePiece({ grams: 10, karat: 20 }), null);
  assert.equal(validatePiece({ grams: 10, karat: 21, boughtYm: '2019-13' }).boughtYm, null);
});
