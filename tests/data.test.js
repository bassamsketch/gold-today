import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateForecastFile } from '../app/js/forecast.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../app/data/${f}`, import.meta.url), 'utf8'));

test('history daily closes are sorted, recent and plentiful', () => {
  const { daily } = read('history.json');
  assert.ok(daily.length >= 250);
  for (let i = 1; i < daily.length; i++) assert.ok(daily[i - 1].d < daily[i].d, `order at ${daily[i].d}`);
  assert.ok(daily.at(-1).d >= '2026-11-20');
  assert.ok(daily.every((x) => Number.isFinite(x.c) && x.c > 0));
});

test('history monthly closes run from 1971-01 without gaps', () => {
  const { monthly } = read('history.json');
  assert.equal(monthly[0].d, '1971-01');
  for (let i = 1; i < monthly.length; i++) {
    const [y0, m0] = monthly[i - 1].d.split('-').map(Number);
    const [y1, m1] = monthly[i].d.split('-').map(Number);
    assert.equal((y1 - y0) * 12 + (m1 - m0), 1, `gap before ${monthly[i].d}`);
  }
});

test('forecasts file is complete and names every source', () => {
  assert.deepEqual(validateForecastFile(read('forecasts.json')), []);
});

test('places and why line are complete', () => {
  const places = read('places.json');
  assert.ok(places.length >= 3);
  for (const p of places) {
    for (const k of ['ar', 'en', 'lineAr', 'lineEn']) assert.ok(p[k], `${p.en} ${k}`);
    assert.ok(Array.isArray(p.links) && p.links.length >= 1, `${p.en} links`);
    for (const l of p.links) assert.ok(l.ar && l.en && l.query, `${p.en} link`);
  }
  const why = read('why.json');
  for (const k of ['date', 'ar', 'en', 'source', 'url']) assert.ok(why[k], `why ${k}`);
});
