import { gramPrice } from './price.js';
import { VAT, KARATS } from './config.js';

/** Reads numbers typed with Arabic-Indic or Persian digits, ٫/٬ separators, or a comma decimal. */
export function parseNumber(input) {
  if (input == null) return null;
  let s = String(input)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/\s+/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const okGrams = (g) => Number.isFinite(g) && g > 0 && g <= 5000;

/** Fair price of a new piece: gold at the shop's rate (or today's), making charge, then 5% VAT on both. */
export function pieceCost({ grams, karat, rate, making, mode }, usdPerOz) {
  if (!okGrams(grams) || !KARATS.includes(karat)) return null;
  const r = rate == null ? gramPrice(usdPerOz, karat) : rate;
  const m = making == null ? 0 : making;
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(m) || m < 0) return null;
  const gold = grams * r;
  const makingTotal = mode === 'percent' ? gold * (m / 100) : grams * m;
  const vat = VAT * (gold + makingTotal);
  return { gold, making: makingTotal, vat, total: gold + makingTotal + vat };
}

/** How a shop's offer compares with today's gold value (design 7.10). */
export function offerCheck({ grams, karat, offer }, usdPerOz) {
  if (!okGrams(grams) || !KARATS.includes(karat) || !Number.isFinite(offer) || offer <= 0) return null;
  const value = grams * gramPrice(usdPerOz, karat);
  const gap = (value - offer) / value;
  const verdict = gap < 0 ? 'above' : gap <= 0.03 ? 'close' : gap <= 0.07 ? 'low' : 'veryLow';
  return { value, gapPct: gap * 100, verdict };
}
