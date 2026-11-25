import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, startLive, fetchFeed } from '../app/js/live.js';
import { POLL_MS, BACKOFF_MS } from '../app/js/config.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

test('parseFeed reads the gold-api.com shape', () => {
  assert.deepEqual(parseFeed({ price: 3470.5, updatedAt: '2026-11-25T12:00:00Z' }), { usd: 3470.5, updatedAt: 1795608000000 });
  assert.equal(parseFeed({ price: 'x' }), null);
  assert.equal(parseFeed({ price: -1 }), null);
  assert.equal(parseFeed(null), null);
});

test('backs off to BACKOFF_MS after three failures', async () => {
  const delays = [];
  let next = null;
  startLive({
    fetchFn: async () => { throw new Error('offline'); },
    onPrice() {},
    schedule: (fn, ms) => { delays.push(ms); next = fn; return 0; },
    cancel() {},
  });
  await flush();
  await next();
  await next();
  assert.deepEqual(delays, [POLL_MS, POLL_MS, BACKOFF_MS]);
});

test('a good response is delivered and resets the delay', async () => {
  const delays = [], prices = [];
  let calls = 0, next = null;
  startLive({
    fetchFn: async () => { calls++; if (calls <= 3) throw new Error('x'); return { price: 3500, updatedAt: '2026-11-25T12:00:00Z' }; },
    onPrice: (p) => prices.push(p.usd),
    schedule: (fn, ms) => { delays.push(ms); next = fn; return 0; },
    cancel() {},
  });
  await flush();
  await next();
  await next();
  await next();
  assert.deepEqual(prices, [3500]);
  assert.equal(delays.at(-1), POLL_MS);
});

test('stop prevents further polling', async () => {
  const delays = [];
  const live = startLive({ fetchFn: async () => ({ price: 3500 }), onPrice() {}, schedule: (fn, ms) => { delays.push(ms); return 0; }, cancel() {} });
  live.stop();
  await flush();
  assert.equal(delays.length, 0);
});

test('the feed request carries a timeout signal', async () => {
  const real = globalThis.fetch;
  let opts = null;
  globalThis.fetch = async (url, o) => { opts = o; return new Response('{"price":3500}', { status: 200 }); };
  try {
    assert.deepEqual(await fetchFeed(), { price: 3500 });
    assert.ok(opts.signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = real;
  }
});
