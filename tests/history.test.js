import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastClose, yearShareBelow, tierOf, hintOf } from '../app/js/history.js';

test('lastClose uses the session date and hides stale data', () => {
  const daily = [{ d: '2026-11-23', c: 3600 }, { d: '2026-11-24', c: 3556.37 }, { d: '2026-11-25', c: 3520 }];
  assert.equal(lastClose(daily, new Date('2026-11-25T10:00:00Z')).d, '2026-11-24');
  assert.equal(lastClose(daily, new Date('2026-11-25T22:00:00Z')).d, '2026-11-25');
  assert.equal(lastClose([{ d: '2026-11-19', c: 3700 }], new Date('2026-11-25T10:00:00Z')), null);
});

test('lastClose accepts Friday as yesterday on Monday', () => {
  assert.equal(lastClose([{ d: '2026-11-27', c: 3500 }], new Date('2026-11-30T10:00:00Z')).d, '2026-11-27');
});

test('year share, tiers and hints', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  const daily = Array.from({ length: 100 }, (_, i) => ({ d: new Date(Date.UTC(2026, 7, 1) + i * 864e5).toISOString().slice(0, 10), c: 4000 + i }));
  assert.equal(yearShareBelow(daily, 3500, now), 0);
  assert.equal(yearShareBelow(daily, 4050, now), 0.5);
  assert.deepEqual([0.05, 0.2, 0.5, 0.8, 0.95].map(tierOf), [0, 1, 2, 3, 4]);
  assert.deepEqual([0, 1, 2, 3, 4].map(hintOf), [0, 0, 1, 2, 2]);
});

test('year share ignores closes older than 365 days', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  const daily = [{ d: '2025-11-01', c: 1000 }, { d: '2026-11-01', c: 5000 }];
  assert.equal(yearShareBelow(daily, 4000, now), 0);
});
