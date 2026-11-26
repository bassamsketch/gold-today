import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median, percentile, buildForecast, validateForecastFile, surveyComparison } from '../app/js/forecast.js';

test('median of the five end-2027 targets', () => {
  assert.equal(median([4650, 5250, 5000, 5000, 4500]), 5000);
  assert.equal(median([4500, 5000]), 4750);
});

test('percentile interpolates linearly', () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([0, 10], 0.9), 9);
});

test('buildForecast gives the middle, lowest and highest bank target only', () => {
  const fc = { asOf: '2026-11-25', targets: [4650, 5250, 5000, 5000, 4500].map((usd) => ({ usd })), lbma: {} };
  const out = buildForecast(fc);
  assert.deepEqual(Object.keys(out), ['y1']);
  assert.deepEqual([out.y1.mid, out.y1.lo, out.y1.hi, out.y1.n], [5000, 4500, 5250, 5]);
  assert.equal(buildForecast({ asOf: '2026-11-25', targets: [], lbma: {} }).y1, null);
});

const target = (usd) => ({ institution: 'A', institutionAr: 'أ', usd, horizon: '2027-12', published: '2026-11-24', url: 'https://x.test/a' });

test('validateForecastFile accepts any number of complete targets', () => {
  assert.deepEqual(validateForecastFile({ asOf: '2026-11-25', targets: [4500, 5000, 5200, 4800].map(target), lbma: { winners: [], survey: { year: 2026, avg: 4741.97 } } }), []);
  assert.deepEqual(validateForecastFile({ asOf: '2026-11-25', targets: [target(5000)] }), []);
  assert.ok(validateForecastFile({ asOf: '2026-11-25', targets: [] }).length > 0);
  assert.ok(validateForecastFile({ asOf: '2026-11-25', targets: [{ usd: 'x' }] }).length > 0);
  assert.ok(validateForecastFile({ asOf: '2026-11-25', targets: [target(5000)], lbma: { survey: { year: '2026' } } }).length > 0);
});

test('surveyComparison averages only the survey year', () => {
  const daily = [{ d: '2026-12-30', c: 4000 }, { d: '2026-12-31', c: 4200 }, { d: '2027-01-02', c: 9999 }];
  assert.deepEqual(surveyComparison({ survey: { year: 2026, avg: 4741.97 } }, daily), { year: 2026, avg: 4741.97, actual: 4100 });
  assert.equal(surveyComparison({ survey: { year: 2028, avg: 1 } }, daily), null);
  assert.equal(surveyComparison({}, daily), null);
});
