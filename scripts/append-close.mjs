// Daily GitHub Action step: save the closing price of every trading day of the past week that is missing from
// app/data/history.json (design 7.3, D7). The close is the price at 21:00 UTC. A run in the hour after it reads the
// live feed. GitHub has started the scheduled runs about six hours late every day since 2026-11-26, so a late run
// reads the 21:00 UTC price from Dukascopy's free minute bars for spot gold instead (the bar that ends at 21:00,
// bid side). The script always exits 0, so the closes it did save are committed. When a close is more than two
// days overdue it writes `stuck=<days>` to $GITHUB_OUTPUT, and a later workflow step fails the job, so GitHub
// e-mails the owner.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseFeed } from '../app/js/live.js';
import { FEED_URL } from '../app/js/config.js';

const round2 = (x) => Math.round(x * 100) / 100;
const DAY = 864e5;
const CLOSE_HOUR = 21;
const BARS = 1440, BAR_BYTES = 24;
const OVERDUE = 2 * DAY;
const DUKASCOPY = 'https://datafeed.dukascopy.com/datafeed/XAUUSD';
const closeAt = (day) => Date.parse(`${day}T${CLOSE_HOUR}:00:00Z`);

/**
 * The trading day whose close a run at `at` can read from the live feed, or null. Only a weekday run in the hour
 * after 21:00 UTC can: later, the live price has moved on from the close.
 */
export function closeDay(at) {
  const day = at.getUTCDay();
  if (day === 0 || day === 6 || at.getUTCHours() !== CLOSE_HOUR) return null;
  return at.toISOString().slice(0, 10);
}

/**
 * Weekdays of the past `lookback` days whose 21:00 UTC close has passed by `now` and is not saved. Gaps before the
 * last saved close count too, so a day that failed once is tried again on the next run.
 */
export function missingCloseDays(history, now, lookback = 7) {
  const have = new Set(history.daily.map((x) => x.d));
  const out = [];
  for (let i = lookback; i >= 0; i--) {
    const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i, CLOSE_HOUR));
    const d = at.toISOString().slice(0, 10);
    if (at > now || have.has(d) || at.getUTCDay() === 0 || at.getUTCDay() === 6) continue;
    out.push(d);
  }
  return out;
}

/** Dukascopy's file of one day's minute bars (bid side). Its months count from 0. */
export function candleUrl(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${DUKASCOPY}/${y}/${String(Number(m) - 1).padStart(2, '0')}/${d}/BID_candles_min_1.bi5`;
}

/**
 * The price at 21:00 UTC from one day of unpacked minute bars (1440 bars of 24 bytes, big-endian: seconds from
 * midnight, open, close, low, high in thousandths of a dollar, volume): the close of the last traded bar before
 * 21:00. After an early close the bars stay flat at that price with no volume, so that bar still holds it.
 * Null when the file is empty or the day had no trading. Throws on anything but a whole day, so a file that is
 * still being written can never give a close.
 */
export function closeFromCandles(buf) {
  if (!buf.length) return null;
  if (buf.length !== BARS * BAR_BYTES) throw new Error(`not a whole day (${buf.length} bytes)`);
  let close = null;
  for (let o = 0; o < buf.length; o += BAR_BYTES) {
    if (buf.readInt32BE(o) >= CLOSE_HOUR * 3600) break;
    if (buf.readFloatBE(o + 20) > 0) close = buf.readInt32BE(o + 8) / 1000;
  }
  return close;
}

/** Add or replace the close for the UTC date of `at`, keep 400 daily entries, and set that month to its latest close. */
export function appendClose(history, { usd, at }) {
  const d = at.toISOString().slice(0, 10), m = d.slice(0, 7);
  const daily = history.daily.filter((x) => x.d !== d).concat({ d, c: round2(usd) }).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-400);
  const c = daily.filter((x) => x.d.startsWith(m)).at(-1).c;
  const monthly = history.monthly.filter((x) => x.d !== m).concat({ d: m, c }).sort((a, b) => (a.d < b.d ? -1 : 1));
  return { ...history, daily, monthly };
}

/**
 * Save every missing close it can. `fetchCandles(day)` gives a day's unpacked bars, or null on a 404.
 * `liveUsd(day)` gives the live price, or null. A day's Dukascopy file is read only after that UTC day has ended.
 * Returns the new history, the days saved, the days more than two days overdue that could not be read, and a log.
 */
export async function run({ history, now, fetchCandles, liveUsd }) {
  const saved = [], stuck = [], log = [];
  for (const day of missingCloseDays(history, now)) {
    let usd = null, why = '';
    if (day === closeDay(now)) {
      try { usd = await liveUsd(day); } catch (e) { why = e.message; }
      if (usd === null && !why) why = 'the live feed gave no price for today';
    } else if (+now < closeAt(day) + (24 - CLOSE_HOUR) * 3600e3) {
      log.push(`${day}: waiting for the UTC day to end before reading Dukascopy`);
      continue;
    } else {
      try {
        const candles = await fetchCandles(day);
        if (candles === null) why = 'Dukascopy has no file for this day (404)';
        else {
          usd = closeFromCandles(candles);
          if (usd === null) { log.push(`${day}: no trading that day, nothing to save`); continue; }
        }
      } catch (e) { why = `Dukascopy: ${e.message}`; }
    }
    if (usd === null) {
      log.push(`${day}: no close yet (${why})`);
      if (+now - closeAt(day) > OVERDUE) stuck.push(day);
      continue;
    }
    history = appendClose(history, { usd, at: new Date(closeAt(day)) });
    saved.push(day);
    log.push(`close ${day} = ${round2(usd)} (from ${day === closeDay(now) ? 'the live feed' : 'Dukascopy'})`);
  }
  return { history, saved, stuck, log };
}

/** One day's minute bars from Dukascopy, unpacked; null on a 404. Throws after three failed tries. */
async function dukascopyCandles(day) {
  let err;
  for (let i = 1; i <= 3; i++) {
    try {
      // Dukascopy answers Node's own user agent with 429 Too Many Requests
      const res = await fetch(candleUrl(day), { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gold-today-close/1.0)' }, signal: AbortSignal.timeout(30000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const packed = Buffer.from(await res.arrayBuffer());
      if (!packed.length) return Buffer.alloc(0);
      const xz = spawnSync('xz', ['--format=lzma', '--decompress', '--stdout'], { input: packed, maxBuffer: 1 << 24 });
      if (xz.status !== 0) throw new Error(`xz could not unpack it: ${xz.stderr}`);
      return xz.stdout;
    } catch (e) {
      err = e;
      if (i < 3) await sleep(5000 * i);
    }
  }
  throw err;
}

/** The live price, only when the feed's own time is on `day` (a holiday's feed still shows the day before). */
async function feedUsd(day) {
  const res = await fetch(FEED_URL, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`the live feed answered HTTP ${res.status}`);
  const price = parseFeed(await res.json());
  if (!price) throw new Error('the live feed gave no usable price');
  if (new Date(price.updatedAt).toISOString().slice(0, 10) !== day) throw new Error(`the live price is from ${new Date(price.updatedAt).toISOString()}`);
  return price.usd;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const file = new URL('../app/data/history.json', import.meta.url);
  const now = new Date();
  const r = await run({ history: JSON.parse(readFileSync(file, 'utf8')), now, fetchCandles: dukascopyCandles, liveUsd: feedUsd });
  for (const line of r.log) console.log(line);
  if (!r.log.length) console.log(`${now.toISOString()}: every close of the past week is saved`);
  if (r.saved.length) writeFileSync(file, JSON.stringify(r.history));
  if (r.stuck.length) {
    console.error(`no close could be read for ${r.stuck.join(', ')}`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `stuck=${r.stuck.join(' ')}\n`);
  }
}
