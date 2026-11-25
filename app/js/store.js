import { validatePiece } from './gold.js';
import { KARATS, DEFAULT_KARAT } from './config.js';

const KEY = 'goldToday';

export const defaults = () => ({ v: 1, lang: 'ar', karat: DEFAULT_KARAT, pieces: [], last: null, tips: {} });

/** Read saved state; each broken or unknown field falls back to its default on its own. */
export function load(storage) {
  const d = defaults();
  let raw;
  try {
    raw = JSON.parse(storage.getItem(KEY));
  } catch {
    return d;
  }
  if (!raw || typeof raw !== 'object') return d;
  const last = raw.last;
  return {
    v: 1,
    lang: raw.lang === 'en' || raw.lang === 'ar' ? raw.lang : d.lang,
    karat: KARATS.includes(raw.karat) ? raw.karat : d.karat,
    pieces: Array.isArray(raw.pieces) ? raw.pieces.map(validatePiece).filter(Boolean).slice(0, 20) : [],
    last: last && Number.isFinite(last.usd) && Number.isFinite(last.updatedAt) ? { usd: last.usd, updatedAt: last.updatedAt } : null,
    tips: raw.tips && typeof raw.tips === 'object' && !Array.isArray(raw.tips) ? raw.tips : {},
  };
}

/** Save state; storage that is full or blocked is ignored (the app keeps working in memory). */
export function save(state, storage) {
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}
