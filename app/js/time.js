const HOUR = 3600e3;
const utcYmd = (t) => new Date(t).toISOString().slice(0, 10);

// the n-th Sunday of a month (1-12), as a day of the month
function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}

/**
 * The UTC hour of the 17:00 New York close on the UTC date `ymd`: 21 while New York keeps summer time
 * (second Sunday of March to first Sunday of November), else 22 (TD2).
 */
export function closeHourUtc(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const summer = (m > 3 && m < 11) || (m === 3 && d >= nthSunday(y, 3, 2)) || (m === 11 && d < nthSunday(y, 11, 1));
  return summer ? 21 : 22;
}

/** Spot gold stops at 17:00 New York time on Friday and reopens at 18:00 on Sunday (design D7). */
export function isMarketClosed(now) {
  const day = now.getUTCDay();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  const close = closeHourUtc(utcYmd(now));
  if (day === 6) return true;
  if (day === 5 && h >= close) return true;
  if (day === 0 && h < close + 1) return true;
  return false;
}

/** The trading session a moment belongs to, as YYYY-MM-DD: after the New York close it is the next day's. */
export function sessionDate(now) {
  return utcYmd(now.getTime() + (24 - closeHourUtc(utcYmd(now))) * HOUR);
}

// when the latest Friday's daily close up to `now` was recorded: 21:00 UTC (design D7, scripts/append-close.mjs)
function fridayCloseAt(now) {
  const d = new Date(now);
  const back = (d.getUTCDay() + 2) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back, 21);
}

/**
 * What the status line may claim (QA24). 'loading' in the first 8 s before any fetch has answered,
 * 'none' without a price, 'closed' at the weekend for a price from Friday's last trading, 'delayed' when the
 * price itself is over 15 minutes old (or, at the weekend, older than Friday's close), 'live' only while the
 * last successful fetch is at most 30 s old, else 'recent'.
 */
export function liveStatus({ price, updatedAt, fetchedAt = null, now, startedAt = null }) {
  const starting = fetchedAt == null && startedAt != null && now - startedAt < 8e3;
  if (price == null || !Number.isFinite(price)) return starting ? 'loading' : 'none';
  if (isMarketClosed(new Date(now))) {
    // "Friday evening's last price" is true only of a price from then; an older one names its own time (TD1)
    return updatedAt != null && updatedAt >= fridayCloseAt(now) - 15 * 60e3 ? 'closed' : 'delayed';
  }
  if (starting) return 'loading';
  if (updatedAt == null || now - updatedAt > 15 * 60e3) return 'delayed';
  if (fetchedAt != null && now - fetchedAt <= 30e3) return 'live';
  return 'recent';
}
