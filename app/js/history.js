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
