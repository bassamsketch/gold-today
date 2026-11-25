import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, pieceCost, offerCheck } from '../app/js/calc.js';

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
