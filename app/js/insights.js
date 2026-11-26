// Facts from gold's own history for the Outlook and My gold tabs (design 7.3). Pure functions, USD per ounce.
import { muscatDate } from './history.js';

const DAY = 864e5;
const since1971 = (monthly) => (monthly || []).filter((m) => m.d >= '1971-01');

/**
 * The highest price on record: the top daily close, the top monthly close, or the live price when it is higher.
 * `d` is a day (daily data) or a month (monthly data), and null when the live price is the record.
 */
export function recordHigh(history, liveUsd) {
  if (!history) return null;
  const top = (list) => (list || []).reduce((a, b) => (!a || b.c > a.c ? b : a), null);
  const day = top(history.daily), month = top(history.monthly);
  if (!day && !month) return null;
  const rec = day && (!month || day.c >= month.c) ? { usd: day.c, d: day.d, day: true, live: false } : { usd: month.c, d: month.d, day: false, live: false };
  if (Number.isFinite(liveUsd) && liveUsd > rec.usd) return { usd: liveUsd, d: null, day: false, live: true };
  return rec;
}

/**
 * Whether a fall of 20% or more from the record is still under way: the lowest price since the record reached it,
 * and the record has not been regained. Today's price alone can be back within 20% while the fall goes on (OL2).
 */
export function fallUnderway(history, liveUsd, rec, threshold = 0.2) {
  if (!history || !rec || rec.live || !Number.isFinite(liveUsd) || liveUsd >= rec.usd) return false;
  const after = ((rec.day ? history.daily : history.monthly) || []).filter((x) => x.d > rec.d).map((x) => x.c);
  return 1 - Math.min(liveUsd, ...after) / rec.usd >= threshold;
}

/** Every completed fall of `threshold` or more under the running peak since 1971: the peak's year, how deep, months to regain it. */
export function pastFalls(monthly, threshold = 0.2) {
  const m = since1971(monthly);
  if (!m.length) return [];
  const falls = [];
  let peak = m[0].c, at = 0, trough = m[0].c, falling = false;
  for (let i = 1; i < m.length; i++) {
    const c = m[i].c;
    if (c >= peak) {
      if (falling) falls.push({ year: m[at].d.slice(0, 4), depth: 1 - trough / peak, months: i - at });
      peak = c;
      at = i;
      trough = c;
      falling = false;
    } else {
      trough = Math.min(trough, c);
      if (trough <= peak * (1 - threshold)) falling = true;
    }
  }
  return falls;
}

/**
 * Over every monthly start since 1971: the share of times the close `years` later was higher, rounded to tenths,
 * the middle change (usual), and the worst change with the year it started. Null without enough data.
 */
export function higherOdds(monthly, years) {
  const m = since1971(monthly), span = years * 12;
  if (m.length <= span) return null;
  const changes = [];
  for (let i = 0; i + span < m.length; i++) changes.push({ from: m[i].d, r: m[i + span].c / m[i].c - 1 });
  const sorted = [...changes].sort((a, b) => a.r - b.r);
  const share = changes.filter((x) => x.r > 0).length / changes.length;
  return { share, tens: Math.round(share * 10), typical: sorted[Math.floor(sorted.length / 2)].r, worst: sorted[0].r, worstFrom: sorted[0].from.slice(0, 4), worstMonth: sorted[0].from };
}

const OLD_AFTER = 15 * 60e3;

/**
 * The price to show: the saved live price, unless the last daily close (21:00 UTC on its day) is newer.
 * `old` says it is more than 15 minutes old, so a tab can name its time (design 6.1). Null without either.
 */
export function bestPrice(price, daily, now = Date.now()) {
  const last = daily?.at(-1);
  const closeAt = last ? Date.parse(`${last.d}T21:00:00Z`) : -Infinity;
  const saved = Number.isFinite(price?.usd) ? { usd: price.usd, at: Number.isFinite(price.updatedAt) ? price.updatedAt : -Infinity } : null;
  const pick = saved && (saved.at >= closeAt || !last) ? saved : last ? { usd: last.c, at: closeAt } : null;
  return pick && { usd: pick.usd, at: pick.at, old: now - pick.at > OLD_AFTER };
}

/** The 60 completed months before the current Muscat month (the current one is drawn as today's price). */
export function historyWindow(monthly, now = Date.now()) {
  const month = muscatDate(now).slice(0, 7);
  const done = monthly.at(-1)?.d >= month ? monthly.slice(0, -1) : monthly;
  return done.slice(-60);
}

/**
 * Where a record sits on the chart, in points from the first month: points are month-end closes, so a daily
 * record falls inside its month, before that month's point. Null when it is older than the chart.
 */
export function recordX(firstYm, rec) {
  if (!rec || rec.live || !rec.d) return null;
  const [y0, m0] = firstYm.split('-').map(Number);
  const [y, m] = rec.d.slice(0, 7).split('-').map(Number);
  const idx = (y - y0) * 12 + (m - m0);
  const x = rec.day ? idx - 1 + Number(rec.d.slice(8, 10)) / 31 : idx;
  return x < 0 ? null : x;
}

/**
 * Change of `priceUsd` against the last close made on or before the moment `days` before `now` (spec 7.1).
 * Closes are recorded at 21:00 UTC on their date, so a close dated that day may come after the moment (OL1).
 */
export function moveSince(daily, priceUsd, now, days) {
  if (!Number.isFinite(priceUsd) || !daily?.length) return null;
  const cut = +now - days * DAY;
  for (let i = daily.length - 1; i >= 0; i--) {
    if (Date.parse(`${daily[i].d}T21:00:00Z`) <= cut) return priceUsd / daily[i].c - 1;
  }
  return null;
}

/**
 * The lowest and highest close in the 365 days up to `now` (Muscat dates); null without data. A price `usd` for
 * today counts as a day of its own, so today is never outside the range (MG2).
 */
export function yearRange(daily, now, usd) {
  const cutoff = muscatDate(+now - 365 * DAY);
  const year = (daily || []).filter((x) => x.d >= cutoff);
  if (!year.length) return null;
  const pick = (better) => year.reduce((a, b) => (better(b.c, a.c) ? b : a));
  let lo = pick((x, y) => x < y), hi = pick((x, y) => x > y);
  if (Number.isFinite(usd)) {
    const today = { d: muscatDate(+now), c: usd };
    if (usd < lo.c) lo = today;
    if (usd > hi.c) hi = today;
  }
  return { lo: { d: lo.d, c: lo.c }, hi: { d: hi.d, c: hi.c } };
}

/** The monthly close for the same month `years` before the latest month; null when the data does not reach back. */
export function closeYearsAgo(monthly, years) {
  const last = monthly?.at(-1);
  if (!last) return null;
  const [y, mo] = last.d.split('-');
  const want = `${Number(y) - years}-${mo}`;
  const hit = monthly.find((x) => x.d === want);
  return hit ? { d: hit.d, c: hit.c } : null;
}
