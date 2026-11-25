import { OZ_G, OMR_PER_USD } from './config.js';

/** Omani rials per gram of gold of the given karat, from a USD per troy ounce price. */
export function gramPrice(usdPerOz, karat) {
  return (usdPerOz / OZ_G) * OMR_PER_USD * (karat / 24);
}

const formatters = new Map();
/** en-US grouping with a fixed number of decimals, e.g. formatNum(4403.2, 0) -> "4,403". */
export function formatNum(value, decimals) {
  let f = formatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(decimals, f);
  }
  return f.format(value);
}
