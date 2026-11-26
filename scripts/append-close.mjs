// Daily GitHub Action step: add today's closing price to app/data/history.json (design 7.3, D7).
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseFeed } from '../app/js/live.js';
import { FEED_URL } from '../app/js/config.js';

const round2 = (x) => Math.round(x * 100) / 100;

/**
 * The trading day whose close a run at `at` can read from the live feed, or null. The close is the price at
 * 21:00 UTC (design D7), so only a weekday run in the following hour records it; GitHub can start scheduled
 * runs hours late, and a late run would save a later price under the wrong day.
 */
export function closeDay(at) {
  const day = at.getUTCDay();
  if (day === 0 || day === 6 || at.getUTCHours() !== 21) return null;
  return at.toISOString().slice(0, 10);
}

/** Add or replace the close for the UTC date of `at`, keep 400 daily entries, and set that month's close. */
export function appendClose(history, { usd, at }) {
  const d = at.toISOString().slice(0, 10), m = d.slice(0, 7), c = round2(usd);
  const daily = history.daily.filter((x) => x.d !== d).concat({ d, c }).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-400);
  const monthly = history.monthly.filter((x) => x.d !== m).concat({ d: m, c }).sort((a, b) => (a.d < b.d ? -1 : 1));
  return { ...history, daily, monthly };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const file = new URL('../app/data/history.json', import.meta.url);
  const now = new Date();
  const day = closeDay(now);
  if (!day) {
    console.log(`${now.toISOString()} is outside the hour after the 21:00 UTC close; nothing recorded`);
    process.exit(0);
  }
  if (JSON.parse(readFileSync(file, 'utf8')).daily.some((x) => x.d === day)) {
    console.log(`close for ${day} already recorded`); // the earlier of the two runs is nearer 21:00
    process.exit(0);
  }
  const res = await fetch(FEED_URL, { cache: 'no-store' });
  const price = res.ok ? parseFeed(await res.json()) : null;
  if (!price) {
    console.error(`no usable price from the feed (HTTP ${res.status})`);
    process.exit(1);
  }
  const history = appendClose(JSON.parse(readFileSync(file, 'utf8')), { usd: price.usd, at: now });
  writeFileSync(file, JSON.stringify(history));
  console.log(`close ${history.daily.at(-1).d} = ${history.daily.at(-1).c}`);
}
