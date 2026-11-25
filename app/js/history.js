import { sessionDate } from './time.js';

const DAY = 864e5;
const dayNum = (ymd) => Date.parse(`${ymd}T00:00:00Z`) / DAY;

/** Latest close before the current session; null when it is more than 3 days old. */
export function lastClose(daily, now) {
  const sd = sessionDate(now);
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].d < sd) return dayNum(sd) - dayNum(daily[i].d) > 3 ? null : daily[i];
  }
  return null;
}

/** Share (0..1) of the closes in the last 365 days that are strictly below price; null without data. */
export function yearShareBelow(daily, price, now) {
  const cutoff = dayNum(sessionDate(now)) - 365;
  let n = 0, below = 0;
  for (const { d, c } of daily) {
    if (dayNum(d) < cutoff) continue;
    n++;
    if (c < price) below++;
  }
  return n ? below / n : null;
}

/** 0 cheapest ... 4 most expensive, cut at 10%, 35%, 65% and 90% (design 7.4). */
export function tierOf(share) {
  return share < 0.1 ? 0 : share < 0.35 ? 1 : share < 0.65 ? 2 : share < 0.9 ? 3 : 4;
}

/** 0: buying favourable, 1: ordinary moment, 2: selling favourable. */
export function hintOf(tier) {
  return tier < 2 ? 0 : tier === 2 ? 1 : 2;
}

const HOUR = 3600e3;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const ymdOf = (t) => new Date(t).toISOString().slice(0, 10);
/** The calendar date in Muscat (UTC+4) at instant t. */
export const muscatDate = (t) => ymdOf(+t + 4 * HOUR);

function prevTradingDay(ymd) {
  let n = dayNum(ymd) - 1;
  while ([0, 6].includes(new Date(n * DAY).getUTCDay())) n--;
  return ymdOf(n * DAY);
}

/** A news line dated `ymd` stays up until the trading day after it has passed (QA22). */
export function newsVisible(ymd, now) {
  return typeof ymd === 'string' && YMD.test(ymd) && ymd >= prevTradingDay(muscatDate(now));
}

/**
 * The close a price is compared with: the last close before the price's own session, so the weekend
 * shows Friday's move. `yesterday` says whether that close was the day before today in Muscat.
 */
export function compareClose(daily, priceAt, now) {
  const lc = lastClose(daily, new Date(priceAt));
  if (!lc) return null;
  return { d: lc.d, c: lc.c, yesterday: lc.d === muscatDate(+now - DAY) };
}
