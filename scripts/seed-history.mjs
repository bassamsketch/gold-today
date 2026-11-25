// One-time seed of app/data/history.json (design 7.3, D1).
// Daily closes: OANDA XAU/USD exported once from TradingView into scripts/seed/oanda-daily.json.
// Monthly: World Bank monthly averages 1971-01..2021-11 (via freegoldapi.com), then OANDA month-end closes.
import { readFileSync, writeFileSync } from 'node:fs';

const seed = (f) => JSON.parse(readFileSync(new URL(`./seed/${f}`, import.meta.url), 'utf8'));
const round2 = (x) => Math.round(x * 100) / 100;
// A daily bar opening at 22:00 UTC belongs to the next session date (design D7).
const sessionOf = (sec) => new Date(sec * 1000 + 3 * 3600e3).toISOString().slice(0, 10);
const today = new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

const d = seed('oanda-daily.json');
if (d.t.length !== d.c.length) throw new Error('daily t and c differ in length');
const byDate = new Map();
d.t.forEach((t, i) => byDate.set(sessionOf(t), round2(d.c[i])));
const daily = [...byDate]
  .filter(([day]) => day < today) // today's bar is still forming; the live price covers it
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .slice(-400)
  .map(([day, c]) => ({ d: day, c }));

const wb = await (await fetch('https://freegoldapi.com/data/latest.json')).json();
const wbByMonth = new Map(); // the dataset repeats some months; keep one value per month
for (const x of wb) if (x.source === 'worldbank' && x.date >= '1971-01-01' && x.date < '2021-12-01') wbByMonth.set(x.date.slice(0, 7), round2(x.price));
const monthly = [...wbByMonth].sort(([a], [b]) => (a < b ? -1 : 1)).map(([d, c]) => ({ d, c }));
const m = seed('oanda-monthly.json');
let [y, mo] = m.from.split('-').map(Number);
for (const c of m.c) {
  monthly.push({ d: `${y}-${String(mo).padStart(2, '0')}`, c: round2(c) });
  if (++mo > 12) { mo = 1; y++; }
}

const history = {
  source: 'Daily and monthly closes from Dec 2021: OANDA XAU/USD via TradingView. Monthly 1971-2021: World Bank averages via freegoldapi.com. Updated daily from gold-api.com.',
  daily,
  monthly,
};
writeFileSync(new URL('../app/data/history.json', import.meta.url), JSON.stringify(history));
console.log(`daily ${daily.length} (${daily[0].d}..${daily.at(-1).d}), monthly ${monthly.length} (${monthly[0].d}..${monthly.at(-1).d})`);
