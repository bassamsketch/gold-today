import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validRates, perUsd, available, effective, fromRials, fmt } from '../app/js/money.js';

const rates = { asOf: '2026-11-25', source: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com', perUsd: { EUR: 0.91245, LBP: 89500 } };
const near = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;

test('the rial, dirham and dollar are fixed to the dollar and need no rates file', () => {
  assert.equal(perUsd('OMR', null), 0.3845);
  assert.equal(perUsd('AED', null), 3.6725);
  assert.equal(perUsd('USD', null), 1);
  assert.ok(near(fromRials(40.466, 'AED', null), 386.506, 0.001), fromRials(40.466, 'AED', null)); // 40.466 / 0.3845 x 3.6725
  assert.equal(fromRials(40.466, 'OMR', null), 40.466);
});

test('the euro and the pound come from the rates file, the pound in millions', () => {
  assert.ok(near(fromRials(40.5, 'EUR', rates), 96.11, 0.01));
  assert.ok(near(fromRials(40.5, 'LBP', rates), 9.427, 0.001));
});

test('without valid rates the euro and pound are unavailable and show rials', () => {
  assert.equal(available('EUR', null), false);
  assert.equal(effective('EUR', null), 'OMR');
  assert.equal(effective('LBP', rates), 'LBP');
  assert.equal(effective('XYZ', rates), 'OMR');
  assert.deepEqual(validRates(rates), rates);
  assert.equal(validRates({ ...rates, perUsd: { EUR: 2, LBP: 89500 } }), null);
  assert.equal(validRates({ ...rates, perUsd: { EUR: 0.9, LBP: 5 } }), null);
  assert.equal(validRates({ ...rates, asOf: 'yesterday' }), null);
  assert.equal(validRates(null), null);
});

test('decimals follow the kind of figure and the currency', () => {
  assert.equal(fmt(40.466, 'OMR', 'gram'), '40.466');
  assert.equal(fmt(386.5, 'AED', 'gram'), '386.50');
  assert.equal(fmt(9.4271, 'LBP', 'gram'), '9.427');
  assert.equal(fmt(386.5, 'AED', 'short'), '387');
  assert.equal(fmt(40.47, 'OMR', 'short'), '40.5');
  assert.equal(fmt(4666.4, 'OMR', 'total'), '4,666');
  assert.equal(fmt(1130.34, 'LBP', 'total'), '1,130.3');
});

test('rials pass through untouched, so half-baisa amounts round as before', () => {
  assert.equal(fromRials(99.5, 'OMR', null), 99.5);
  assert.equal(fmt(fromRials(99.5, 'OMR', null), 'OMR', 'total'), '100');
});
