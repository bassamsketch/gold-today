import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendClose } from '../scripts/append-close.mjs';

const base = () => ({
  source: 's',
  daily: [{ d: '2026-11-23', c: 3600 }, { d: '2026-11-24', c: 3556.37 }],
  monthly: [{ d: '2026-10', c: 3875.65 }, { d: '2026-11', c: 3518.96 }],
});

test('adds the day and updates the month', () => {
  const h = appendClose(base(), { usd: 3452.456, at: new Date('2026-11-25T21:00:00Z') });
  assert.deepEqual(h.daily.at(-1), { d: '2026-11-25', c: 3452.46 });
  assert.deepEqual(h.monthly.at(-1), { d: '2026-11', c: 3452.46 });
});

test('running twice on the same day keeps one entry', () => {
  let h = appendClose(base(), { usd: 3450, at: new Date('2026-11-25T21:00:00Z') });
  h = appendClose(h, { usd: 3460, at: new Date('2026-11-25T21:30:00Z') });
  assert.equal(h.daily.filter((x) => x.d === '2026-11-25').length, 1);
  assert.equal(h.daily.at(-1).c, 3460);
});

test('a new month starts a new monthly entry', () => {
  const h = appendClose(base(), { usd: 3500, at: new Date('2026-12-01T21:00:00Z') });
  assert.deepEqual(h.monthly.at(-1), { d: '2026-12', c: 3500 });
  assert.equal(h.monthly.length, 3);
});

test('daily history never exceeds 400 entries', () => {
  const h = base();
  h.daily = Array.from({ length: 400 }, (_, i) => ({ d: new Date(Date.UTC(2025, 0, 1) + i * 864e5).toISOString().slice(0, 10), c: 3000 }));
  const out = appendClose(h, { usd: 3500, at: new Date('2026-11-25T21:00:00Z') });
  assert.equal(out.daily.length, 400);
  assert.equal(out.daily.at(-1).d, '2026-11-25');
});
