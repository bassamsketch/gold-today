import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Load app/sw.js with a fake service-worker global and a recording cache.
function loadWorker(fetchImpl) {
  const listeners = {}, store = new Map(), waits = [];
  const self = { addEventListener: (type, fn) => { listeners[type] = fn; }, location: { origin: 'https://app.test' }, skipWaiting() {}, clients: { claim() {} } };
  const cache = { put: async (key, res) => { store.set(typeof key === 'string' ? key : key.url, await res.text()); }, match: async () => undefined };
  // opening a cache takes real time in a browser, so the page reads the response first
  const caches = { open: () => new Promise((r) => setTimeout(() => r(cache), 5)), keys: async () => [], match: async () => undefined };
  new Function('self', 'caches', 'fetch', readFileSync(new URL('../app/sw.js', import.meta.url), 'utf8'))(self, caches, fetchImpl);
  const fire = async (request) => {
    let responded;
    listeners.fetch({ request, respondWith: (p) => { responded = p; }, waitUntil: (p) => waits.push(p) });
    const res = await responded;
    await res.text(); // the page reads the body, as a browser would
    await Promise.allSettled(waits);
    await new Promise((r) => setTimeout(r, 10));
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
