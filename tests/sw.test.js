import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Load app/sw.js with a fake service-worker global and a recording cache.
function loadWorker(fetchImpl, cached = {}) {
  const listeners = {}, store = new Map(), waits = [];
  const self = { addEventListener: (type, fn) => { listeners[type] = fn; }, location: { origin: 'https://app.test' }, skipWaiting() {}, clients: { claim() {} } };
  const hit = async (req) => { const u = typeof req === 'string' ? req : req.url; return u in cached ? new Response(cached[u]) : undefined; };
  const cache = { put: async (key, res) => { store.set(typeof key === 'string' ? key : key.url, await res.text()); }, match: hit };
  // opening a cache takes real time in a browser, so the page reads the response first
  const caches = { open: () => new Promise((r) => setTimeout(() => r(cache), 5)), keys: async () => [], match: hit };
  // long network timeouts are shortened so the slow-network test runs quickly
  const quickTimers = (fn, ms) => setTimeout(fn, ms > 1000 ? 30 : ms);
  new Function('self', 'caches', 'fetch', 'setTimeout', readFileSync(new URL('../app/sw.js', import.meta.url), 'utf8'))(self, caches, fetchImpl, quickTimers);
  const fire = async (request) => {
    let responded;
    listeners.fetch({ request, respondWith: (p) => { responded = p; }, waitUntil: (p) => waits.push(p) });
    const res = await responded;
    const body = await res.text(); // the page reads the body, as a browser would
    await Promise.allSettled(waits);
    await new Promise((r) => setTimeout(r, 10));
    return body;
  };
  return { store, fire };
}

test('network-first data responses are stored in the cache', async () => {
  const w = loadWorker(async () => new Response('{"date":"new"}', { status: 200 }));
  await w.fire({ method: 'GET', mode: 'cors', url: 'https://app.test/gold-today/data/why.json' });
  assert.equal(w.store.get('https://app.test/gold-today/data/why.json'), '{"date":"new"}');
});

test('only the app page is kept as the offline page', async () => {
  const w = loadWorker(async () => new Response('page', { status: 200 }));
  await w.fire({ method: 'GET', mode: 'navigate', url: 'https://app.test/gold-today/' });
  assert.equal(w.store.get('./'), 'page');
  const w2 = loadWorker(async () => new Response('json', { status: 200 }));
  await w2.fire({ method: 'GET', mode: 'navigate', url: 'https://app.test/gold-today/data/why.json' });
  assert.equal(w2.store.get('./'), undefined);
});

const js = { method: 'GET', mode: 'cors', url: 'https://app.test/gold-today/js/main.js' };

test('scripts come from the network first, so a new page never runs old code', async () => {
  const w = loadWorker(async () => new Response('new code', { status: 200 }), { [js.url]: 'old code' });
  assert.equal(await w.fire(js), 'new code');
  assert.equal(w.store.get(js.url), 'new code');
});

test('scripts fall back to the cache offline or when the network hangs', async () => {
  const off = loadWorker(async () => { throw new TypeError('offline'); }, { [js.url]: 'old code' });
  assert.equal(await off.fire(js), 'old code');
  const slow = loadWorker(() => new Promise(() => {}), { [js.url]: 'old code' });
  assert.equal(await slow.fire(js), 'old code');
});

test('fonts and images come from the cache first', async () => {
  const font = { method: 'GET', mode: 'cors', url: 'https://app.test/gold-today/fonts/a.woff2' };
  const w = loadWorker(async () => new Response('net font', { status: 200 }), { [font.url]: 'cached font' });
  assert.equal(await w.fire(font), 'cached font');
});
