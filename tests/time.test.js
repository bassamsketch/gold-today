import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMarketClosed, liveStatus, sessionDate } from '../app/js/time.js';

test('market closed window', () => {
  assert.equal(isMarketClosed(new Date('2026-11-25T12:00:00Z')), false); // Wednesday
  assert.equal(isMarketClosed(new Date('2026-11-27T21:30:00Z')), true);  // Friday after close
  assert.equal(isMarketClosed(new Date('2026-11-29T21:59:00Z')), true);  // Sunday before open
  assert.equal(isMarketClosed(new Date('2026-11-29T22:01:00Z')), false);
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
});

test('sessionDate rolls over three hours before midnight UTC', () => {
  assert.equal(sessionDate(new Date('2026-11-25T10:00:00Z')), '2026-11-25');
  assert.equal(sessionDate(new Date('2026-11-25T22:00:00Z')), '2026-11-26');
});
