import { formatNum } from '../price.js';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t) => 1 - Math.pow(1 - t, 4);

/** Count an element's number from its last value to `to` over 0.9 s. */
export function countUp(el, to, decimals) {
  const from = el._v ?? to;
  el._v = to;
  const paint = (v) => { el.textContent = formatNum(v, decimals); };
  if (reduce() || Math.abs(from - to) < 1e-9) return paint(to);
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.max(0, Math.min(1, (now - t0) / 900));
    paint(from + (to - from) * ease(k));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
