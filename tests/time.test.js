import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMarketClosed, liveStatus, sessionDate, closeHourUtc } from '../app/js/time.js';

test('the market is shut from 17:00 Friday to 18:00 Sunday, New York time (TD2)', () => {
  assert.equal(isMarketClosed(new Date('2026-11-25T12:00:00Z')), false); // Wednesday
  assert.equal(isMarketClosed(new Date('2026-11-27T21:30:00Z')), false); // winter Friday: trading until 22:00 UTC
  assert.equal(isMarketClosed(new Date('2026-11-27T22:00:00Z')), true);
  assert.equal(isMarketClosed(new Date('2026-11-29T22:30:00Z')), true);  // winter Sunday: opens at 23:00 UTC
  assert.equal(isMarketClosed(new Date('2026-11-29T23:01:00Z')), false);
  assert.equal(isMarketClosed(new Date('2026-07-17T21:00:00Z')), true);  // summer Friday
  assert.equal(isMarketClosed(new Date('2026-07-19T22:01:00Z')), false); // summer Sunday
});

test('the New York close is 21:00 UTC in summer time and 22:00 UTC in winter', () => {
  assert.equal(closeHourUtc('2026-07-15'), 21);
  assert.equal(closeHourUtc('2026-03-06'), 22); // the Friday before summer time starts on 8 March
  assert.equal(closeHourUtc('2026-03-09'), 21);
  assert.equal(closeHourUtc('2026-10-30'), 21); // the last Friday of summer time, which ends on 1 November
  assert.equal(closeHourUtc('2026-11-27'), 22);
});

test('liveStatus states', () => {
  const wed = Date.parse('2026-11-25T12:00:00Z');
  assert.equal(liveStatus({ price: null, updatedAt: null, fetchedAt: null, now: wed, startedAt: wed - 2e3 }), 'loading');
  assert.equal(liveStatus({ price: null, updatedAt: null, fetchedAt: null, now: wed, startedAt: wed - 20e3 }), 'none');
  assert.equal(liveStatus({ price: 3470, updatedAt: wed - 30e3, fetchedAt: wed - 5e3, now: wed }), 'live');
  assert.equal(liveStatus({ price: 3470, updatedAt: wed - 4 * 60e3, fetchedAt: wed - 4 * 60e3, now: wed }), 'recent');
  assert.equal(liveStatus({ price: 3470, updatedAt: wed - 20 * 60e3, fetchedAt: wed - 5e3, now: wed }), 'delayed');
  const sat = Date.parse('2026-11-28T12:00:00Z');
  assert.equal(liveStatus({ price: 3470, updatedAt: sat - 54e6, fetchedAt: sat - 5e3, now: sat }), 'closed');
  // a price older than Friday's close is not "Friday evening's last price": it says its own time (TD1)
  assert.equal(liveStatus({ price: 3470, updatedAt: Date.parse('2026-11-25T14:00:00Z'), fetchedAt: null, now: sat }), 'delayed');
});

test('sessionDate rolls over at the New York close', () => {
  assert.equal(sessionDate(new Date('2026-11-25T10:00:00Z')), '2026-11-25');
  assert.equal(sessionDate(new Date('2026-11-27T21:59:00Z')), '2026-11-27'); // winter Friday's last hour (TD2)
  assert.equal(sessionDate(new Date('2026-11-25T22:00:00Z')), '2026-11-26');
  assert.equal(sessionDate(new Date('2026-07-17T21:00:00Z')), '2026-07-18'); // summer
});
