import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, pieceCost, offerCheck, priceCheck, jewelleryVsBar } from '../app/js/calc.js';

const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol;
const pct = (x) => Math.round(x * 100);

test('priceCheck splits a shop price into gold, the extra, and what a shop pays back', () => {
  const r = priceCheck({ grams: 20, karat: 22, price: 950 }, 3574);
  assert.ok(near(r.gold, 810.0), r.gold);
  assert.ok(near(r.extra, 140.0), r.extra);
  assert.equal(pct(r.extraPct), 17);
  assert.deepEqual(r.band.map(pct), [13, 21]); // making 3 to 6 rials a gram, VAT 5% on the whole price
  assert.equal(r.position, 'within');
  assert.ok(near(r.back, 777.6), r.back);
  assert.equal(r.per100, 82);
  assert.ok(near(r.target, 49.48, 0.01), r.target);
  assert.equal(r.bar, false);
});

test('priceCheck places a price below, within or above the usual band, or under the gold value', () => {
  const at = (price) => priceCheck({ grams: 20, karat: 22, price }, 3574);
  assert.equal(at(880).position, 'below');
  assert.equal(at(1100).position, 'above');
  const under = at(800);
  assert.equal(under.position, 'under');
  assert.equal(under.band, null);
  assert.equal(under.target, null);
  assert.ok(near(under.back, 777.6));
});

test('priceCheck treats karat 24 as a bar only when the switch says so', () => {
  const bar = priceCheck({ grams: 10, karat: 24, price: 465, bar: true }, 3574);
  assert.equal(bar.bar, true);
  assert.deepEqual(bar.band.map(pct), [2, 14]); // premiums 2% to 9%, plus VAT if the shop charges it
  assert.ok(near(bar.back, bar.gold * 0.99, 1e-9));
  const piece = priceCheck({ grams: 10, karat: 24, price: 465, bar: false }, 3574);
  assert.equal(piece.bar, false);
  assert.equal(pct(piece.band[0]), 12);
  assert.equal(priceCheck({ grams: 10, karat: 22, price: 465, bar: true }, 3574).bar, false);
});

test('priceCheck refuses impossible input', () => {
  for (const input of [{ grams: 0, karat: 22, price: 900 }, { grams: 20, karat: 22, price: 0 }, { grams: 20, karat: 22, price: 2e6 }, { grams: 20, karat: 23, price: 900 }, { grams: NaN, karat: 22, price: 900 }]) {
    assert.equal(priceCheck(input, 3574), null, JSON.stringify(input));
  }
  assert.equal(priceCheck({ grams: 20, karat: 22, price: 950 }, null), null);
});

test('priceCheck judges the percentages the page prints, so the verdict never contradicts the range', () => {
  // 980 is 20.99% over the gold value and prints as 21%, inside "13% to 21%"; 913 is 12.7% and prints as 13%
  assert.equal(priceCheck({ grams: 20, karat: 22, price: 980 }, 3574).position, 'within');
  assert.equal(priceCheck({ grams: 20, karat: 22, price: 913 }, 3574).position, 'within');
  assert.equal(priceCheck({ grams: 20, karat: 22, price: 990 }, 3574).position, 'above');
});

test('priceCheck has no per-100 figure when the price is under the gold value', () => {
  assert.equal(priceCheck({ grams: 20, karat: 22, price: 500 }, 3574).per100, null);
});

test('pieceCost can leave VAT out, for a bar or coin', () => {
  const withVat = pieceCost({ grams: 10, karat: 24, rate: 44, making: 1, mode: 'perGram' }, 3574);
  const noVat = pieceCost({ grams: 10, karat: 24, rate: 44, making: 1, mode: 'perGram', vat: 0 }, 3574);
  assert.ok(near(withVat.total, 450 * 1.05, 1e-9));
  assert.ok(near(noVat.total, 450, 1e-9));
  assert.equal(noVat.vat, 0);
});

test('jewelleryVsBar gives what a shop pays back per 100 paid', () => {
  assert.deepEqual(jewelleryVsBar(3574), { bar: [90, 94], plain: 85, detailed: 80 });
  assert.equal(jewelleryVsBar(null), null);
});

test('parseNumber reads Arabic digits and both decimal styles', () => {
  assert.equal(parseNumber('٣٫٥'), 3.5);
  assert.equal(parseNumber('3,5'), 3.5);
  assert.equal(parseNumber('1,200'), 1200);
  assert.equal(parseNumber('1,200.5'), 1200.5);
  assert.equal(parseNumber('۱۲'), 12);
  assert.equal(parseNumber(' 12 '), 12);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
});

test('pieceCost adds making charge and 5% VAT', () => {
  const r = pieceCost({ grams: 10, karat: 21, rate: null, making: 2, mode: 'perGram' }, 3470);
  assert.ok(Math.abs(r.gold - 375.34) < 0.01);
  assert.equal(r.making, 20);
  assert.ok(Math.abs(r.vat - 19.767) < 0.01);
  assert.ok(Math.abs(r.total - 415.107) < 0.01);
});

test('pieceCost uses the shop rate and percent making when given', () => {
  const r = pieceCost({ grams: 10, karat: 22, rate: 40, making: 10, mode: 'percent' }, 3470);
  assert.equal(r.gold, 400);
  assert.equal(r.making, 40);
  assert.ok(Math.abs(r.total - 462) < 1e-9);
});

test('offerCheck verdicts', () => {
  const v = (o) => offerCheck({ grams: 10, karat: 22, offer: o }, 3470).verdict;
  assert.deepEqual([400, 390, 380, 360].map(v), ['above', 'close', 'usual', 'low']);
});

test('extreme inputs return null instead of NaN', () => {
  assert.equal(pieceCost({ grams: 0, karat: 22, rate: null, making: 0, mode: 'perGram' }, 3470), null);
  assert.equal(pieceCost({ grams: 10, karat: 22, rate: null, making: -1, mode: 'perGram' }, 3470), null);
  assert.equal(offerCheck({ grams: 10, karat: 22, offer: 0 }, 3470), null);
  assert.equal(offerCheck({ grams: null, karat: 22, offer: 100 }, 3470), null);
  assert.ok(pieceCost({ grams: 5000, karat: 24, rate: null, making: 100, mode: 'percent' }, 3470).total > 0);
});
