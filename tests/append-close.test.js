import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendClose, closeDay, missingCloseDays, closeFromCandles, candleUrl, run } from '../scripts/append-close.mjs';

// The live feed shows the close only in the hour after 21:00 UTC (design D7). GitHub sometimes starts a
// scheduled run hours late: on 2026-11-26 it ran at 03:20 UTC and saved that morning's price as a close.
test('a run in the hour after the 21:00 UTC close records that day', () => {
  assert.equal(closeDay(new Date('2026-11-25T21:07:00Z')), '2026-11-25');
  assert.equal(closeDay(new Date('2026-11-25T21:59:59Z')), '2026-11-25');
  assert.equal(closeDay(new Date('2026-11-27T21:37:00Z')), '2026-11-27'); // Friday
});

test('a late, early or weekend run records nothing', () => {
  assert.equal(closeDay(new Date('2026-11-26T03:20:45Z')), null); // the run GitHub started six hours late
  assert.equal(closeDay(new Date('2026-11-25T22:00:00Z')), null);
  assert.equal(closeDay(new Date('2026-11-25T20:59:00Z')), null);
  assert.equal(closeDay(new Date('2026-11-28T21:10:00Z')), null); // Saturday
});

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

// GitHub has started every scheduled run about six hours late since 2026-11-26 (03:15-03:45 UTC), so no close was
// saved after 25 Nov. Late runs now read the 21:00 UTC price from Dukascopy's minute bars for each missing day.
const WEEKDAYS = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24', '2026-11-25'];
const hist = (days = WEEKDAYS) => ({ source: 's', daily: days.map((d) => ({ d, c: 3600 })), monthly: [{ d: '2026-11', c: 3600 }] });
const without = (...days) => hist(WEEKDAYS.filter((d) => !days.includes(d)));

test('a late run lists every missing weekday of the past week whose 21:00 UTC has passed', () => {
  assert.deepEqual(missingCloseDays(hist(), new Date('2026-11-28T03:15:23Z')), ['2026-11-26', '2026-11-27']);
  assert.deepEqual(missingCloseDays(hist(), new Date('2026-11-30T03:20:00Z')), ['2026-11-26', '2026-11-27']); // the weekend adds none
  assert.deepEqual(missingCloseDays(hist(), new Date('2026-11-26T20:59:00Z')), []); // 26 Nov has not closed yet
  assert.deepEqual(missingCloseDays(hist(), new Date('2026-11-26T21:00:00Z')), ['2026-11-26']);
});

test('a gap before the last saved close is listed again, so one failed day is retried', () => {
  assert.deepEqual(missingCloseDays(without('2026-11-24'), new Date('2026-11-26T21:07:00Z')), ['2026-11-24', '2026-11-26']);
});

test('missing days reach back one week at most', () => {
  assert.deepEqual(missingCloseDays(hist(['2026-11-02']), new Date('2026-11-28T03:00:00Z')), ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27']);
});

test('the Dukascopy file for a day counts months from 0', () => {
  assert.equal(candleUrl('2026-11-27'), 'https://datafeed.dukascopy.com/datafeed/XAUUSD/2026/10/27/BID_candles_min_1.bi5');
  assert.equal(candleUrl('2027-01-04'), 'https://datafeed.dukascopy.com/datafeed/XAUUSD/2027/00/04/BID_candles_min_1.bi5');
});

// One day of minute bars as Dukascopy stores them once unpacked: 24 bytes each, big-endian, seconds from midnight,
// open, close, low and high in thousandths of a dollar, then the volume. Each price field gets its own value, so
// reading the wrong one fails the test. Bars after the last traded one are flat with no volume, as after an early close.
function bars(lastTraded, closeAt, count = 1440) {
  const buf = Buffer.alloc(count * 24);
  for (let i = 0; i < count; i++) {
    const traded = i <= lastTraded;
    const c = traded ? closeAt(i) : closeAt(Math.max(lastTraded, 0));
    const o = i * 24;
    buf.writeInt32BE(i * 60, o);
    buf.writeInt32BE(Math.round((traded ? c - 1 : c) * 1000), o + 4); // open
    buf.writeInt32BE(Math.round(c * 1000), o + 8); // close
    buf.writeInt32BE(Math.round((traded ? c - 2 : c) * 1000), o + 12); // low
    buf.writeInt32BE(Math.round((traded ? c + 2 : c) * 1000), o + 16); // high
    buf.writeFloatBE(traded ? 0.1 : 0, o + 20);
  }
  return buf;
}
const holiday = () => bars(-1, () => 3600);

test('the close is the last traded minute before 21:00 UTC', () => {
  assert.equal(closeFromCandles(bars(1439, (i) => 3500 + i / 100)), 3512.59); // the 20:59 bar
  assert.equal(closeFromCandles(bars(1184, (i) => (i === 1184 ? 3653.935 : 3600))), 3653.935); // the early close at 19:44 on 27 Nov
});

test('a day without trading, or an empty file, gives no close', () => {
  assert.equal(closeFromCandles(holiday()), null);
  assert.equal(closeFromCandles(Buffer.alloc(0)), null);
});

test('a file that is not a whole day is refused, never read', () => {
  assert.throws(() => closeFromCandles(bars(899, () => 3600, 900)), /not a whole day/); // bars up to 14:59 only
  assert.throws(() => closeFromCandles(bars(1439, () => 3600).subarray(0, 1440 * 24 - 5)), /not a whole day/);
});

test('a backfilled older day leaves the month on its latest close', () => {
  let h = appendClose(base(), { usd: 3650, at: new Date('2026-11-27T21:00:00Z') });
  h = appendClose(h, { usd: 3590, at: new Date('2026-11-26T21:00:00Z') });
  assert.deepEqual(h.daily.slice(-2), [{ d: '2026-11-26', c: 3590 }, { d: '2026-11-27', c: 3650 }]);
  assert.deepEqual(h.monthly.at(-1), { d: '2026-11', c: 3650 });
});

// run() with stand-ins for Dukascopy and the live feed: no network and no xz needed.
function stub(files) {
  const asked = [];
  const fetchCandles = async (day) => {
    asked.push(day);
    const f = files[day];
    if (f instanceof Error) throw f;
    return f ?? null; // null: Dukascopy answered 404
  };
  return { asked, fetchCandles };
}
const noLive = async () => { throw new Error('the live feed must not be read'); };

test('a late run saves each missing day from Dukascopy', async () => {
  const s = stub({ '2026-11-26': bars(1100, () => 3566.13), '2026-11-27': bars(1184, () => 3653.935) });
  const r = await run({ history: hist(), now: new Date('2026-11-28T03:15:23Z'), fetchCandles: s.fetchCandles, liveUsd: noLive });
  assert.deepEqual(r.saved, ['2026-11-26', '2026-11-27']);
  assert.deepEqual(r.history.daily.slice(-2), [{ d: '2026-11-26', c: 3566.13 }, { d: '2026-11-27', c: 3653.94 }]);
  assert.deepEqual(r.stuck, []);
});

test('an on-time run reads today from the live feed and an earlier gap from Dukascopy', async () => {
  const s = stub({ '2026-11-24': bars(1439, () => 3552.73) });
  const liveDays = [];
  const liveUsd = async (day) => { liveDays.push(day); return 3574; };
  const r = await run({ history: without('2026-11-24', '2026-11-25'), now: new Date('2026-11-25T21:07:00Z'), fetchCandles: s.fetchCandles, liveUsd });
  assert.deepEqual(s.asked, ['2026-11-24']);
  assert.deepEqual(liveDays, ['2026-11-25']);
  assert.deepEqual(r.saved, ['2026-11-24', '2026-11-25']);
});

test('a late run before midnight UTC waits, because that day\'s file is not finished', async () => {
  const s = stub({});
  const r = await run({ history: hist(), now: new Date('2026-11-26T22:30:00Z'), fetchCandles: s.fetchCandles, liveUsd: noLive });
  assert.deepEqual(s.asked, []);
  assert.deepEqual(r.saved, []);
  assert.deepEqual(r.stuck, []);
});

test('a day with no trading is skipped without an alarm', async () => {
  const s = stub({ '2026-11-26': holiday(), '2026-11-27': bars(1184, () => 3653.935) });
  const r = await run({ history: hist(), now: new Date('2026-11-30T03:15:00Z'), fetchCandles: s.fetchCandles, liveUsd: noLive });
  assert.deepEqual(r.saved, ['2026-11-27']);
  assert.deepEqual(r.stuck, []);
});

test('a missing, failed or partial file raises the alarm once the close is two days overdue, and other days still save', async () => {
  const files = { '2026-11-24': null, '2026-11-25': new Error('HTTP 500'), '2026-11-26': bars(899, () => 3600, 900), '2026-11-27': bars(1184, () => 3653.935) };
  const r = await run({ history: without('2026-11-24', '2026-11-25'), now: new Date('2026-11-28T03:15:00Z'), fetchCandles: stub(files).fetchCandles, liveUsd: noLive });
  assert.deepEqual(r.saved, ['2026-11-27']);
  assert.deepEqual(r.stuck, ['2026-11-24', '2026-11-25']); // 26 Nov is only 30 hours overdue
});
