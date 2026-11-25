const HOUR = 3600e3;

/** Spot gold closes Friday 21:00 UTC and reopens Sunday 22:00 UTC (design D7). */
export function isMarketClosed(now) {
  const day = now.getUTCDay();
  const h = now.getUTCHours() + now.getUTCMinutes() / 60;
  if (day === 6) return true;
  if (day === 5 && h >= 21) return true;
  if (day === 0 && h < 22) return true;
  return false;
}

/** The trading session a moment belongs to: the UTC date of now + 3 h, as YYYY-MM-DD. */
export function sessionDate(now) {
  return new Date(now.getTime() + 3 * HOUR).toISOString().slice(0, 10);
}

/**
 * What the status line may claim (QA24). 'loading' in the first 8 s before any fetch has answered,
 * 'none' without a price, 'closed' at the weekend, 'delayed' when the price itself is over 15 minutes
 * old, 'live' only while the last successful fetch is at most 30 s old, else 'recent'.
 */
export function liveStatus({ price, updatedAt, fetchedAt = null, now, startedAt = null }) {
  const starting = fetchedAt == null && startedAt != null && now - startedAt < 8e3;
  if (price == null || !Number.isFinite(price)) return starting ? 'loading' : 'none';
  if (isMarketClosed(new Date(now))) return 'closed';
  if (starting) return 'loading';
  if (updatedAt == null || now - updatedAt > 15 * 60e3) return 'delayed';
  if (fetchedAt != null && now - fetchedAt <= 30e3) return 'live';
  return 'recent';
}
