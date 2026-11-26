import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRates } from '../scripts/update-rates.mjs';

const good = { result: 'success', time_last_update_unix: 1795564951, rates: { USD: 1, EUR: 0.912451, LBP: 89500, OMR: 0.384497, AED: 3.6725 } };

test('parseRates keeps the euro and pound rates and the date of a good response', () => {
  assert.deepEqual(parseRates(good), { asOf: '2026-11-25', source: 'ExchangeRate-API', url: 'https://www.exchangerate-api.com', perUsd: { EUR: 0.91245, LBP: 89500 } });
});

test('parseRates refuses a failed or out-of-range response', () => {
  assert.equal(parseRates({ ...good, result: 'error' }), null);
  assert.equal(parseRates({ ...good, rates: { ...good.rates, EUR: 2 } }), null);
  assert.equal(parseRates({ ...good, rates: { ...good.rates, LBP: 5 } }), null);
  assert.equal(parseRates({ ...good, rates: {} }), null);
  assert.equal(parseRates(null), null);
});
