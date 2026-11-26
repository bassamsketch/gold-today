import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recordHigh, pastFalls, higherOdds, moveSince, yearRange, closeYearsAgo, bestPrice, historyWindow, recordX } from '../app/js/insights.js';

test('the worst 10 years name the month they started, not the peak', () => {
  assert.equal(higherOdds(history.monthly, 10).worstMonth, '1980-07');
});

test('bestPrice uses the newer of the saved price and the last close, and says when it is old', () => {
  const daily = [{ d: '2026-11-24', c: 3600 }, { d: '2026-11-25', c: 3574 }];
  const now = Date.parse('2026-11-26T10:00:00Z');
  // a saved price from before the last close loses to the close (21:00 UTC that day)
  assert.deepEqual(bestPrice({ usd: 3700, updatedAt: Date.parse('2026-11-25T08:00:00Z') }, daily, now), { usd: 3574, at: Date.parse('2026-11-25T21:00:00Z'), old: true });
  // a fresh live price wins and is not old
  assert.deepEqual(bestPrice({ usd: 3580, updatedAt: now - 60e3 }, daily, now), { usd: 3580, at: now - 60e3, old: false });
  // no saved price at all: the close
  assert.equal(bestPrice({ usd: null, updatedAt: null }, daily, now).usd, 3574);
  assert.equal(bestPrice({ usd: null }, [], now), null);
});

test('historyWindow keeps 60 completed months before the current one', () => {
  const m = Array.from({ length: 70 }, (_, i) => ({ d: `${2021 + Math.floor((i + 1) / 12)}-${String(((i + 1) % 12) + 1).padStart(2, '0')}`, c: i }));
  // the data ends in 2026-11; in November the last entry is this month's running close and is left out
  assert.equal(m.at(-1).d, '2026-11');
  const nov = historyWindow(m, Date.parse('2026-11-26T10:00:00Z'));
  assert.equal(nov.length, 60);
  assert.equal(nov.at(-1).d, '2026-10');
  // on 1 December, before December's first close, November is complete and stays
  const dec = historyWindow(m, Date.parse('2026-12-01T06:00:00Z'));
  assert.equal(dec.at(-1).d, '2026-11');
});

test('recordX puts a daily record inside its own month, before that month-end point', () => {
  // points are month-end closes; 28 January sits just before the January point
  assert.ok(Math.abs(recordX('2021-11', { d: '2026-01-28', day: true }) - (50 - 1 + 28 / 31)) < 1e-9);
  assert.equal(recordX('2021-11', { d: '2026-01', day: false }), 50);
  assert.equal(recordX('2021-11', { d: '1980-01', day: false }), null);
});

const history = JSON.parse(readFileSync(new URL('../app/data/history.json', import.meta.url), 'utf8'));
const months = (start, values) => values.map((c, i) => {
  const [y, m] = start.split('-').map(Number);
  const n = y * 12 + (m - 1) + i;
  return { d: `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`, c };
});

test('recordHigh prefers a daily close above the monthly ones, and the live price above both', () => {
  const h = { daily: [{ d: '2026-01-28', c: 5418.55 }, { d: '2026-02-02', c: 5000 }], monthly: months('2026-01', [5100, 5278.51]) };
  assert.deepEqual(recordHigh(h, 3574), { usd: 5418.55, d: '2026-01-28', day: true, live: false });
  assert.deepEqual(recordHigh({ daily: [], monthly: months('1980-01', [675.31]) }, null), { usd: 675.31, d: '1980-01', day: false, live: false });
  assert.deepEqual(recordHigh(h, 5500), { usd: 5500, d: null, day: false, live: true });
  assert.equal(recordHigh(null, 3574), null);
});

test('pastFalls lists only completed falls of 20% or more', () => {
  // a 25% fall that regains the peak 7 months after it, then a 15% dip, then an unfinished 30% fall
  const m = months('1971-01', [100, 90, 80, 75, 80, 90, 95, 100, 110, 94, 110, 120, 84, 90]);
  const falls = pastFalls(m);
  assert.equal(falls.length, 1);
  assert.equal(falls[0].year, '1971');
  assert.ok(Math.abs(falls[0].depth - 0.25) < 1e-9);
  assert.equal(falls[0].months, 7);
});

test('pastFalls on the real data finds the five falls since 1971', () => {
  const falls = pastFalls(history.monthly);
  assert.deepEqual(falls.map((x) => x.year), ['1973', '1974', '1980', '2008', '2011']);
  assert.deepEqual(falls.map((x) => x.months), [6, 43, 316, 18, 106]);
  assert.equal(Math.round(falls[2].depth * 100), 62);
});

test('higherOdds counts how often the price was higher, the usual and the worst result', () => {
  const ten = higherOdds(history.monthly, 10);
  assert.equal(ten.tens, 8);
  assert.equal(ten.worstFrom, '1980');
  assert.equal(Math.round(ten.worst * 100), -44);
  assert.ok(ten.typical > 0);
  assert.equal(higherOdds(history.monthly, 1).tens, 6);
  // a steady rise is always higher
  const up = higherOdds(months('1971-01', Array.from({ length: 30 }, (_, i) => 100 + i)), 1);
  assert.equal(up.share, 1);
  assert.equal(higherOdds(months('1971-01', [1, 2, 3]), 5), null);
});

test('moveSince compares with the last close on or before that many days ago, in Muscat', () => {
  const daily = [{ d: '2026-11-17', c: 3800 }, { d: '2026-11-18', c: 3725.18 }, { d: '2026-11-25', c: 3574 }];
  const now = new Date('2026-11-25T12:00:00Z');
  assert.ok(Math.abs(moveSince(daily, 3574, now, 7) - (3574 / 3725.18 - 1)) < 1e-12);
  assert.equal(moveSince(daily, 3574, now, 30), null);
  assert.equal(moveSince(daily, null, now, 7), null);
});

test('yearRange finds the lowest and highest close of the last 365 days', () => {
  const daily = [{ d: '2025-11-01', c: 9999 }, { d: '2026-01-28', c: 5418.55 }, { d: '2026-11-20', c: 3538.19 }, { d: '2026-11-25', c: 3574 }];
  assert.deepEqual(yearRange(daily, new Date('2026-11-25T12:00:00Z')), { lo: { d: '2026-11-20', c: 3538.19 }, hi: { d: '2026-01-28', c: 5418.55 } });
  assert.equal(yearRange([], new Date()), null);
});

test('closeYearsAgo finds the same month some years back', () => {
  const m = months('2016-11', Array.from({ length: 121 }, (_, i) => 1000 + i));
  assert.deepEqual(closeYearsAgo(m, 5), { d: '2021-11', c: 1060 });
  assert.deepEqual(closeYearsAgo(m, 10), { d: '2016-11', c: 1000 });
  assert.equal(closeYearsAgo(m, 11), null);
});
