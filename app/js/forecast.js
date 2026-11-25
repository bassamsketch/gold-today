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

/** USD/oz views. y1: median, min and max of named targets. y5 and y10: historical percentile returns applied to today's price (spec 7.5, D5). */
export function buildForecast(fc, monthly, todayUsd) {
  const t = (fc.targets || []).map((x) => x.usd).filter(Number.isFinite);
  return {
    y1: t.length ? { mid: median(t), lo: Math.min(...t), hi: Math.max(...t), n: t.length } : null,
    y5: band(monthly, 5, todayUsd, 5),
    y10: band(monthly, 10, todayUsd, 10),
  };
}

const YMD = /^\d{4}-\d{2}-\d{2}$/, YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const https = (u) => typeof u === 'string' && u.startsWith('https://');

/** Problems that would stop forecasts.json from being shown; [] when it is usable. Any number of targets from 1 up is fine (D2). */
export function validateForecastFile(fc) {
  const p = [];
  if (!fc || typeof fc !== 'object') return ['not an object'];
  if (!YMD.test(fc.asOf || '')) p.push('asOf must be YYYY-MM-DD');
  if (!Array.isArray(fc.targets) || fc.targets.length < 1) p.push('at least one target is needed');
  (fc.targets || []).forEach((x, i) => {
    if (typeof x?.institution !== 'string' || !x.institution) p.push(`target ${i}: institution`);
    if (typeof x?.institutionAr !== 'string' || !x.institutionAr) p.push(`target ${i}: institutionAr`);
    if (!Number.isFinite(x?.usd) || x.usd <= 0) p.push(`target ${i}: usd`);
    if (!YM.test(x?.horizon || '')) p.push(`target ${i}: horizon must be YYYY-MM`);
    if (!YMD.test(x?.published || '')) p.push(`target ${i}: published must be YYYY-MM-DD`);
    if (!https(x?.url)) p.push(`target ${i}: url must be https`);
  });
  const lb = fc.lbma;
  if (lb != null) {
    if (lb.winners != null && !Array.isArray(lb.winners)) p.push('lbma.winners must be a list');
    (lb.winners || []).forEach((w, i) => {
      if (!Number.isInteger(w?.year) || !w?.name || !Number.isFinite(w?.forecast) || !Number.isFinite(w?.actual)) p.push(`lbma winner ${i}`);
    });
    if (lb.survey != null && (!Number.isInteger(lb.survey.year) || !Number.isFinite(lb.survey.avg))) p.push('lbma.survey needs a whole-number year and an avg');
  }
  return p;
}

/** The analysts' average forecast for the survey year against that year's actual average so far; null without data. */
export function surveyComparison(lbma, daily) {
  const s = lbma?.survey;
  if (!s || !Number.isInteger(s.year) || !Number.isFinite(s.avg)) return null;
  const y = String(s.year);
  const closes = daily.filter((x) => x.d.startsWith(y)).map((x) => x.c);
  if (!closes.length) return null;
  return { year: s.year, avg: s.avg, actual: closes.reduce((a, b) => a + b, 0) / closes.length };
}
