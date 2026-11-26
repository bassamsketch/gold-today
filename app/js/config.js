// Constants from docs/design.md (sections 3, 7 and Global Constraints).
export const OZ_G = 31.1034768;        // grams in one troy ounce
export const OMR_PER_USD = 0.3845;     // fixed peg: 1 OMR = 2.6008 USD
export const TOLA_G = 11.6638;         // grams in one tola
export const KARATS = [24, 22, 21, 18];
export const DEFAULT_KARAT = 22;
export const DEDUCTION = { low: 0.02, high: 0.06 }; // shop buy-back deduction range (estimate)
export const VAT = 0.05;               // VAT on jewellery in Oman, on the full price (VAT Law 121/2020)
export const MAKING_TYPICAL = { low: 3, high: 6 }; // rials a gram for plain 22 karat pieces in Muscat (design 6.4)
export const JEWEL_DEDUCTION = 0.04;   // the middle of DEDUCTION, what shops take when buying jewellery back
export const BAR = { premiumLow: 0.02, premiumHigh: 0.09, premium: 0.05, deduction: 0.01 }; // small bars (design 6.4)
export const MAX_PRICE = 1000000;      // the price check refuses larger prices, in rials
export const FEED_URL = 'https://api.gold-api.com/price/XAU';
export const POLL_MS = 10000;
export const BACKOFF_MS = 60000;
export const MAX_FAILS = 3;
export const STAMPS = { 24: '999.9', 22: '916', 21: '875', 18: '750' };
