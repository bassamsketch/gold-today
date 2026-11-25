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

/** 'none' without a price, 'closed' at the weekend, 'delayed' after 15 minutes without an update, else 'live'. */
export function liveStatus({ price, updatedAt, now }) {
  if (price == null || !Number.isFinite(price)) return 'none';
  if (isMarketClosed(new Date(now))) return 'closed';
  if (updatedAt == null || now - updatedAt > 15 * 60e3) return 'delayed';
  return 'live';
}
