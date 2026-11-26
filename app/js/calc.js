import { gramPrice } from './price.js';
import { VAT, KARATS, DEDUCTION, MAKING_TYPICAL, JEWEL_DEDUCTION, BAR, MAX_PRICE } from './config.js';

/** Reads numbers typed with Arabic-Indic or Persian digits, ٫/٬ separators, or a comma decimal. */
export function parseNumber(input) {
  if (input == null) return null;
  let s = String(input)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/٬/g, '') // the Arabic thousands separator
    .replace(/،/g, ',') // the Arabic comma, as typed on an Arabic keyboard
    .replace(/\s+/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/^-?\d{1,3}(,\d{3}){2,}$/.test(s)) s = s.replace(/,/g, ''); // 1,200,000
  else if (/^-?\d{1,3},\d{3}$/.test(s)) return null; // 950,500: thousands or baisa? never guessed (BS5)
  else s = s.replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const okGrams = (g) => Number.isFinite(g) && g >= 0.1 && g <= 5000; // as the weight message says (BS7)

/** Fair price of a new piece: gold at the shop's rate (or today's), making charge, then 5% VAT on both. */
export function pieceCost({ grams, karat, rate, making, mode, vat: vatRate = VAT }, usdPerOz) {
  if (!okGrams(grams) || !KARATS.includes(karat)) return null;
  const r = rate == null ? gramPrice(usdPerOz, karat) : rate;
  const m = making == null ? 0 : making;
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(m) || m < 0) return null;
  const gold = grams * r;
  const makingTotal = mode === 'percent' ? gold * (m / 100) : grams * m;
  const vat = vatRate * (gold + makingTotal);
  return { gold, making: makingTotal, vat, total: gold + makingTotal + vat };
}

/**
 * A shop's full price (with VAT) split into today's gold value and the extra on top, placed against the usual band,
 * with what a shop would pay back today and the gram price gold must reach for a sale to return the price (design 6.1).
 * Karat 24 counts as a bar or coin only when `bar` is true. Null for impossible input or without a price.
 */
export function priceCheck({ grams, karat, price, bar = false }, usdPerOz) {
  if (!okGrams(grams) || !KARATS.includes(karat) || !Number.isFinite(price) || price <= 0 || price > MAX_PRICE) return null;
  if (!Number.isFinite(usdPerOz) || usdPerOz <= 0) return null;
  const rate = gramPrice(usdPerOz, karat), gold = grams * rate, extra = price - gold;
  const isBar = karat === 24 && bar === true;
  const deduction = isBar ? BAR.deduction : JEWEL_DEDUCTION;
  const back = gold * (1 - deduction);
  const base = { rate, gold, extra, extraPct: extra / gold, back, per100: Math.round((back / price) * 100), bar: isBar };
  if (price < gold) return { ...base, band: null, position: 'under', target: null, per100: null };
  const withMaking = (mk) => ((rate + mk) * (1 + VAT)) / rate - 1;
  const band = isBar ? [BAR.premiumLow, (1 + BAR.premiumHigh) * (1 + VAT) - 1] : [withMaking(MAKING_TYPICAL.low), withMaking(MAKING_TYPICAL.high)];
  // judged on the whole percentages the page prints, so the verdict never contradicts the range beside it
  const pc = (x) => Math.round(x * 100), p = pc(base.extraPct);
  const position = p < pc(band[0]) ? 'below' : p > pc(band[1]) ? 'above' : 'within';
  return { ...base, band, position, target: price / (grams * (1 - deduction)) };
}

/** For every 100 paid today, what a shop would pay back the same day: a small bar (with and without VAT) and plain and detailed 22 karat pieces. */
export function jewelleryVsBar(usdPerOz) {
  if (!Number.isFinite(usdPerOz) || usdPerOz <= 0) return null;
  const rate = gramPrice(usdPerOz, 22), keep = 1 - JEWEL_DEDUCTION;
  const piece = (mk) => Math.round(((keep * rate) / ((rate + mk) * (1 + VAT))) * 100);
  const barBack = (vat) => Math.round(((1 - BAR.deduction) / ((1 + BAR.premium) * (1 + vat))) * 100);
  return { bar: [barBack(VAT), barBack(0)], plain: piece(MAKING_TYPICAL.low), detailed: piece(MAKING_TYPICAL.high) };
}

/** How a shop's offer compares with today's gold value. Bands match the 2-6% deduction My gold uses (QA20). */
export function offerCheck({ grams, karat, offer }, usdPerOz) {
  if (!okGrams(grams) || !KARATS.includes(karat) || !Number.isFinite(offer) || offer <= 0 || offer > MAX_PRICE) return null;
  const value = grams * gramPrice(usdPerOz, karat);
  // judged on the gap as the page prints it, one decimal, so the verdict never contradicts its own figure (BS3)
  const gapPct = Math.round(((value - offer) / value) * 1000) / 10 + 0; // + 0 turns -0 into 0
  const verdict = gapPct < 0 ? 'above' : gapPct <= DEDUCTION.low * 100 ? 'close' : gapPct <= DEDUCTION.high * 100 ? 'usual' : 'low';
  return { value, gapPct, verdict };
}
