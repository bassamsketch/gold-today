// Daily GitHub Action step: refresh the euro and pound rates in app/data/rates.json (design 9).
// ExchangeRate-API's open endpoint asks for attribution, which the currency sheet and the Outlook credit line give.
// A failed or odd response leaves the file as it was and exits 0, so it never blocks the daily close.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validRates } from '../app/js/money.js';

export const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

/** The rates file to write from an open.er-api.com response, or null when the response is not usable. */
export function parseRates(json) {
  if (json?.result !== 'success' || !Number.isFinite(json.time_last_update_unix)) return null;
  const eur = Math.round(json.rates?.EUR * 1e5) / 1e5, lbp = Math.round(json.rates?.LBP);
  return validRates({
    asOf: new Date(json.time_last_update_unix * 1000).toISOString().slice(0, 10),
    source: 'ExchangeRate-API',
    url: 'https://www.exchangerate-api.com',
    perUsd: { EUR: eur, LBP: lbp },
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const file = new URL('../app/data/rates.json', import.meta.url);
  let rates = null;
  try {
    const signal = AbortSignal.timeout(15000);
    const res = await fetch(RATES_URL, { cache: 'no-store', signal });
    rates = res.ok ? parseRates(await res.json()) : null;
  } catch (err) {
    console.error(`rates not fetched: ${err.message}`);
  }
  if (!rates) {
    console.log('no usable rates; rates.json left as it was');
    process.exit(0);
  }
  let old = '';
  try {
    old = readFileSync(file, 'utf8');
  } catch { /* first run */ }
  const text = `${JSON.stringify(rates, null, 2)}\n`;
  if (text === old) console.log('rates unchanged');
  else {
    writeFileSync(file, text);
    console.log(`rates ${rates.asOf}: EUR ${rates.perUsd.EUR}, LBP ${rates.perUsd.LBP}`);
  }
}
