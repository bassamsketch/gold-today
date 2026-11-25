import { gramPrice } from './price.js';
import { DEDUCTION, KARATS } from './config.js';

const newId = () => Math.random().toString(36).slice(2, 10);

/** Normalise a stored or typed piece; null when grams are outside 0.1-5000 or the karat is unknown (design D8). */
export function validatePiece(p) {
  if (!p || typeof p !== 'object') return null;
  const grams = Number(p.grams), karat = Number(p.karat);
  if (!Number.isFinite(grams) || grams < 0.1 || grams > 5000 || !KARATS.includes(karat)) return null;
  const bp = p.boughtPrice == null || p.boughtPrice === '' ? NaN : Number(p.boughtPrice);
  return {
    id: typeof p.id === 'string' && p.id ? p.id : newId(),
    name: typeof p.name === 'string' ? p.name.slice(0, 40) : '',
    grams,
    karat,
    boughtPrice: Number.isFinite(bp) && bp > 0 ? bp : null,
    // 'YYYY-MM', or the year alone when the month is not remembered
    boughtYm: typeof p.boughtYm === 'string' && /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(p.boughtYm) ? p.boughtYm : null,
  };
}

export const pieceValue = (piece, usdPerOz) => piece.grams * gramPrice(usdPerOz, piece.karat);

const priced = (usd) => Number.isFinite(usd) && usd > 0;

/** What shops would likely pay: gold value less a 2-6% deduction, summed over pieces; null without a price (QA10). */
export function sellEstimate(pieces, usdPerOz) {
  if (!priced(usdPerOz)) return null;
  let low = 0, high = 0;
  for (const p of pieces) {
    const v = pieceValue(p, usdPerOz);
    low += v * (1 - DEDUCTION.high);
    high += v * (1 - DEDUCTION.low);
  }
  return { low, mid: (low + high) / 2, high };
}

/** Gain since purchase, using the middle sell estimate; null without a bought price or a live price. */
export function pieceGain(piece, usdPerOz) {
  if (piece.boughtPrice == null || !priced(usdPerOz)) return null;
  const amount = sellEstimate([piece], usdPerOz).mid - piece.boughtPrice;
  return { amount, pct: amount / piece.boughtPrice };
}

/** Gain over the pieces that have a bought price; says how many of all pieces it covers. */
export function totalGain(pieces, usdPerOz) {
  const withPrice = pieces.filter((p) => p.boughtPrice != null);
  if (!withPrice.length || !priced(usdPerOz)) return null;
  const paid = withPrice.reduce((s, p) => s + p.boughtPrice, 0);
  const amount = sellEstimate(withPrice, usdPerOz).mid - paid;
  return { amount, pct: amount / paid, counted: withPrice.length, of: pieces.length };
}
