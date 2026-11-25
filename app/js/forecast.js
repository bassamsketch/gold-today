/** Middle value; the mean of the two middle values for an even count. */
export function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Linear-interpolated percentile, p in 0..1. */
export function percentile(values, p) {
  const s = [...values].sort((a, b) => a - b);
  const i = p * (s.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

/** Annualised return of every rolling window of `years` years, using monthly closes from 1971-01. */
export function rollingCagr(monthly, years) {
  const c = monthly.filter((m) => m.d >= '1971-01').map((m) => m.c);
  const span = years * 12, out = [];
  for (let i = 0; i + span < c.length; i++) out.push(Math.pow(c[i + span] / c[i], 1 / years) - 1);
  return out;
}

// Grow a starting price for `span` years at the 10th, 50th and 90th percentile of `years`-year historical returns.
function band(monthly, years, base, span) {
  const r = rollingCagr(monthly, years);
  if (!r.length) return null;
  const grow = (p) => base * Math.pow(1 + percentile(r, p), span);
  return { lo: grow(0.1), mid: grow(0.5), hi: grow(0.9) };
}

/**
 * USD/oz views. y1: median, min and max of named targets. y5 and y10: historical percentile returns,
 * starting from the 1-year median when banks exist (so the expected path never doubles back), else from today.
 */
export function buildForecast(fc, monthly, todayUsd) {
  const t = (fc.targets || []).map((x) => x.usd).filter(Number.isFinite);
  const y1 = t.length ? { mid: median(t), lo: Math.min(...t), hi: Math.max(...t), n: t.length } : null;
  const base = y1 ? y1.mid : todayUsd;
  const lead = y1 ? 1 : 0;
  return { y1, y5: band(monthly, 5, base, 5 - lead), y10: band(monthly, 10, base, 10 - lead) };
}
