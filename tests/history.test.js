import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lastClose, yearShareBelow, tierOf, hintOf, newsVisible, compareClose } from '../app/js/history.js';

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

test('the news line shows until the next trading day has passed', () => {
  const muscat = (s) => new Date(Date.parse(s) - 4 * 3600e3); // Muscat wall-clock time to a UTC instant
  assert.equal(newsVisible('2026-11-25', muscat('2026-11-25T23:00:00Z')), true, 'same day');
  assert.equal(newsVisible('2026-11-25', muscat('2026-11-26T10:00:00Z')), true, 'Wednesday news on Thursday');
  assert.equal(newsVisible('2026-11-25', muscat('2026-11-27T10:00:00Z')), false, 'Wednesday news on Friday');
  assert.equal(newsVisible('2026-11-27', muscat('2026-11-28T10:00:00Z')), true, 'Friday news on Saturday');
  assert.equal(newsVisible('2026-11-27', muscat('2026-11-30T10:00:00Z')), true, 'Friday news on Monday');
  assert.equal(newsVisible('2026-11-27', muscat('2026-12-01T10:00:00Z')), false, 'Friday news on Tuesday');
  assert.equal(newsVisible(undefined, muscat('2026-11-25T10:00:00Z')), false);
});

test('the change line compares with the close before the price, and says when that was', () => {
  const muscat = (s) => Date.parse(s) - 4 * 3600e3;
  const daily = [{ d: '2026-11-26', c: 3500 }, { d: '2026-11-27', c: 3450 }, { d: '2026-11-30', c: 3470 }];
  // Saturday: Friday's last price against Thursday's close, which was not yesterday
  assert.deepEqual(compareClose(daily, Date.parse('2026-11-27T20:59:00Z'), muscat('2026-11-28T10:00:00Z')), { d: '2026-11-26', c: 3500, yesterday: false });
  // winter: Friday trades until 22:00 UTC, so its last price at 21:59 is still Friday's, against Thursday (TD2)
  assert.deepEqual(compareClose(daily, Date.parse('2026-11-27T21:59:00Z'), muscat('2026-11-29T10:00:00Z')), { d: '2026-11-26', c: 3500, yesterday: false });
  // the feed keeps moving its time on during the weekend (04:59 UTC on Saturday 28 Nov, price frozen at Friday's),
  // so a weekend time still means Friday's last price, against Thursday, not against Friday's own close
  assert.deepEqual(compareClose(daily.slice(0, 2), Date.parse('2026-11-28T04:59:21Z'), muscat('2026-11-28T10:00:00Z')), { d: '2026-11-26', c: 3500, yesterday: false });
  assert.deepEqual(compareClose(daily.slice(0, 2), Date.parse('2026-11-29T22:30:00Z'), muscat('2026-11-29T22:30:00Z')), { d: '2026-11-26', c: 3500, yesterday: false }); // Sunday before the 23:00 reopening
  // Monday: the live price against Friday's close
  assert.deepEqual(compareClose(daily.slice(0, 2), muscat('2026-11-30T10:00:00Z'), muscat('2026-11-30T10:00:00Z')), { d: '2026-11-27', c: 3450, yesterday: false });
  assert.deepEqual(compareClose(daily.slice(0, 2), Date.parse('2026-11-29T23:05:00Z'), Date.parse('2026-11-29T23:05:00Z')), { d: '2026-11-27', c: 3450, yesterday: false }); // Sunday after the reopening
  // Tuesday: against Monday's close, yesterday
  assert.deepEqual(compareClose(daily, muscat('2026-12-01T10:00:00Z'), muscat('2026-12-01T10:00:00Z')), { d: '2026-11-30', c: 3470, yesterday: true });
  assert.equal(compareClose([], Date.now(), Date.now()), null);
});
