import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePiece, sellEstimate, pieceGain, totalGain, okPaid, okBoughtYm } from '../app/js/gold.js';
import { gramPrice } from '../app/js/price.js';

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

test('estimates and gains are null without a live price', () => {
  const p = [piece({ boughtPrice: 300, boughtYm: '2019-03' })];
  assert.equal(sellEstimate(p, null), null);
  assert.equal(sellEstimate(p, NaN), null);
  assert.equal(pieceGain(p[0], undefined), null);
  assert.equal(totalGain(p, null), null);
});

test('a purchase date may be a year alone', () => {
  assert.equal(validatePiece({ grams: 10, karat: 21, boughtYm: '2019' }).boughtYm, '2019');
  assert.equal(validatePiece({ grams: 10, karat: 21, boughtYm: '2019-03' }).boughtYm, '2019-03');
  assert.equal(validatePiece({ grams: 10, karat: 21, boughtYm: '2019-13' }).boughtYm, null);
});

test('24 karat counts as a bar or coin: shops pay about 1% under, as in the price check (MG3)', () => {
  const usd = 3574, value = (k) => 10 * gramPrice(usd, k);
  const bar = sellEstimate([piece({ grams: 10, karat: 24 })], usd);
  assert.ok(Math.abs(bar.mid - value(24) * 0.99) < 1e-9);
  assert.ok(bar.low < bar.mid && bar.mid < bar.high);
  const ring = sellEstimate([piece({ grams: 10, karat: 22 })], usd);
  assert.ok(Math.abs(ring.mid - value(22) * 0.96) < 1e-9);
});

test('a price paid must be 1 to 1,000,000 rials, and a month bought not after this month (MG7, MG9)', () => {
  assert.equal(okPaid(0.001), false);
  assert.equal(okPaid(999999999999), false);
  assert.equal(okPaid(350.5), true);
  const now = new Date('2026-11-26T10:00:00Z');
  assert.equal(okBoughtYm(null, now), true);
  assert.equal(okBoughtYm('2026', now), true);
  assert.equal(okBoughtYm('2026-11', now), true);
  assert.equal(okBoughtYm('2026-12', now), false);
});
