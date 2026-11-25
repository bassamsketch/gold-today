import { test } from 'node:test';
import assert from 'node:assert/strict';
import { median, rollingCagr, percentile, buildForecast } from '../app/js/forecast.js';

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
  // after the first year the history bands start from the banks' 1-year median
  assert.ok(Math.abs(out.y5.mid - 5000 * Math.pow(1.08, 4)) < 1e-6);
  assert.ok(Math.abs(out.y10.mid - 5000 * Math.pow(1.08, 9)) < 1e-6);
});

test('buildForecast returns no 1-year view without targets', () => {
  const out = buildForecast({ asOf: '2026-11-25', targets: [], lbma: {} }, series(30, 0.08), 3500);
  assert.equal(out.y1, null);
  assert.ok(Math.abs(out.y5.mid - 3500 * Math.pow(1.08, 5)) < 1e-6);
  assert.ok(Math.abs(out.y10.mid - 3500 * Math.pow(1.08, 10)) < 1e-6);
});
