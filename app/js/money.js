// Display currency (design 9): rial amounts converted at today's rate. The rial, dirham and dollar are pegged;
// the euro and the pound come from data/rates.json. Pounds are shown in millions.
import { OMR_PER_USD, CURRENCIES, PEGS } from './config.js';
import { formatNum } from './price.js';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const DECIMALS = {
  gram: { OMR: 3, AED: 2, USD: 2, EUR: 2, LBP: 3 }, // Today, the board, the change line, the sheet, the share image
  short: { OMR: 1, AED: 0, USD: 1, EUR: 1, LBP: 2 }, // the Outlook's per-gram figures
  total: { OMR: 0, AED: 0, USD: 0, EUR: 0, LBP: 1 }, // sums: My gold, converted totals
};

/** The rates file when it is usable (EUR 0.5 to 1.5 and LBP 10,000 to 1,000,000 per dollar), else null. */
export function validRates(json) {
  const e = json?.perUsd?.EUR, l = json?.perUsd?.LBP;
  if (!YMD.test(json?.asOf || '') || !(e >= 0.5 && e <= 1.5) || !(l >= 1e4 && l <= 1e6)) return null;
  return json;
}

/** Units of `code` per US dollar, or null when the rate is not known. */
export function perUsd(code, rates) {
  return PEGS[code] ?? (CURRENCIES.includes(code) ? validRates(rates)?.perUsd[code] ?? null : null);
}

export const available = (code, rates) => perUsd(code, rates) != null;

/** The currency to show: the chosen one when its rate is known, otherwise rials. */
export const effective = (code, rates) => (available(code, rates) ? code : 'OMR');

/** A rial amount in `code` (millions for the pound). */
export function fromRials(rials, code, rates) {
  const r = perUsd(code, rates);
  if (code === 'OMR' || r == null) return rials; // rials untouched, so half-baisa amounts round as before
  const v = (rials / OMR_PER_USD) * r;
  return code === 'LBP' ? v / 1e6 : v;
}

/** How many decimals a kind of figure shows in `code`. */
export const decimalsOf = (code, kind) => (DECIMALS[kind] || DECIMALS.gram)[code] ?? (DECIMALS[kind] || DECIMALS.gram).OMR;

/** A converted amount formatted for its kind of figure: 'gram', 'short' or 'total'. */
export function fmt(value, code, kind) {
  const d = DECIMALS[kind] || DECIMALS.gram;
  return formatNum(value, d[code] ?? d.OMR);
}
