import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median, rollingCagr, percentile, buildForecast, validateForecastFile, surveyComparison } from '../app/js/forecast.js';

const series = (years, rate) => Array.from({ length: 12 * years + 1 }, (_, i) => ({
  d: `${1971 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`,
  c: 100 * Math.pow(1 + rate, i / 12),
}));

test('median of the five end-2027 targets', () => {
  assert.equal(median([4650, 5250, 5000, 5000, 4500]), 5000);
  assert.equal(median([4500, 5000]), 4750);
});

test('rollingCagr recovers a steady growth rate', () => {
  const r = rollingCagr(series(20, 0.1), 5);
  assert.equal(r.length, 12 * 15 + 1);
  assert.ok(r.every((x) => Math.abs(x - 0.1) < 1e-9));
});

test('rollingCagr skips months before 1971', () => {
  const pre = [{ d: '1970-12', c: 1 }];
  assert.equal(rollingCagr(pre.concat(series(10, 0.05)), 5).length, 12 * 5 + 1);
});

test('percentile interpolates linearly', () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([0, 10], 0.9), 9);
});

test('buildForecast shapes y1, y5 and y10', () => {
  const fc = { asOf: '2026-11-25', targets: [4650, 5250, 5000, 5000, 4500].map((usd) => ({ usd })), lbma: {} };
  const out = buildForecast(fc, series(30, 0.08), 3500);
  assert.deepEqual([out.y1.mid, out.y1.lo, out.y1.hi, out.y1.n], [5000, 4500, 5250, 5]);
  // spec 7.5 / D5: the 5 and 10-year bands apply history to today's price
  assert.ok(Math.abs(out.y5.mid - 3500 * Math.pow(1.08, 5)) < 1e-6);
  assert.ok(Math.abs(out.y10.mid - 3500 * Math.pow(1.08, 10)) < 1e-6);
});

test('buildForecast returns no 1-year view without targets', () => {
  const out = buildForecast({ asOf: '2026-11-25', targets: [], lbma: {} }, series(30, 0.08), 3500);
  assert.equal(out.y1, null);
  assert.ok(Math.abs(out.y5.mid - 3500 * Math.pow(1.08, 5)) < 1e-6);
  assert.ok(Math.abs(out.y10.mid - 3500 * Math.pow(1.08, 10)) < 1e-6);
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
