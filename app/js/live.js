import { FEED_URL, POLL_MS, BACKOFF_MS, MAX_FAILS } from './config.js';

/** { usd, updatedAt } from a gold-api.com response, or null when it is not a usable price. */
export function parseFeed(json) {
  if (!json || typeof json.price !== 'number' || !Number.isFinite(json.price) || json.price <= 0) return null;
  const at = Date.parse(json.updatedAt);
  return { usd: json.price, updatedAt: Number.isFinite(at) ? at : Date.now() };
}

/** One request to the feed. It gives up after 8 s, so a hung request never holds the status at "live" (QA24). */
export function fetchFeed() {
  const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined;
  return fetch(FEED_URL, { cache: 'no-store', signal }).then((r) => {
    if (!r.ok) throw new Error(`feed ${r.status}`);
    return r.json();
  });
}

/**
 * Poll the live feed every POLL_MS; after MAX_FAILS failures in a row wait BACKOFF_MS between tries.
 * Returns { stop() }. The caller pauses it while the page is hidden.
 */
export function startLive({ fetchFn = fetchFeed, onPrice, onError = () => {}, schedule = (fn, ms) => setTimeout(fn, ms), cancel = clearTimeout }) {
  let fails = 0;
  let timer = null;
  let stopped = false;
  async function tick() {
    if (stopped) return;
    try {
      const p = parseFeed(await fetchFn());
      if (!p) throw new Error('unusable feed response');
      fails = 0;
      onPrice(p);
    } catch (err) {
      fails++;
      onError(err, fails);
    }
    if (!stopped) timer = schedule(tick, fails >= MAX_FAILS ? BACKOFF_MS : POLL_MS);
  }
  queueMicrotask(tick);
  return {
    stop() {
      stopped = true;
      cancel(timer);
    },
  };
}
