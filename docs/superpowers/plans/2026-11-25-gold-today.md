# Gold Today (ذهب اليوم) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Maison-style bilingual gold price phone app (PWA) described in the design, host it on GitHub Pages, and keep its data fresh with a daily Action and scheduled Claude routines.

**Architecture:** Plain HTML, CSS and ES modules, no framework and no build step. Pure logic lives in small modules under `app/js/` with Node built-in tests; views render into one `index.html` shell. Data files in `app/data/` are refreshed by a GitHub Action (daily close) and by scheduled Claude routines (`why.json` daily, `forecasts.json` monthly).

**Tech Stack:** HTML, CSS (OKLCH tokens), JavaScript ES modules, Node 24 `node --test` for unit tests, Python `http.server` for local preview, GitHub Pages and Actions.

**Spec:** `docs/design.md` (revision 2). Reference mockup: `.superpowers/brainstorm/484-1795610974/content/directions-v2.html`, direction "Maison" (styles prefixed `.m-`, shared odometer and chart code).

## Global Constraints

- Phone only: designed for 390 x 844, works from 360 x 740 to 430 x 932.
- Arabic default (`dir="rtl"`), English toggle, choice remembered. Western digits in both languages. Neutral Arabic forms (no gendered "you" verbs).
- Live feed `https://api.gold-api.com/price/XAU`, poll every 10 s while visible, back off to 60 s after 3 failures.
- Constants: 1 troy oz = 31.1034768 g; 1 USD = 0.3845 OMR; 1 tola = 11.6638 g; karats 24, 22, 21, 18 with purity karat/24; default karat 22; VAT 5% on jewellery; sell deduction 2% to 6%.
- Colours: `--bg` oklch(1 0 0), `--ink` oklch(0.2 0.02 30), `--muted` oklch(0.45 0.02 30), `--car` oklch(0.47 0.15 30), `--car-d` oklch(0.4 0.13 29), `--hair` oklch(0.9 0.012 30), `--surface` oklch(0.975 0.006 30).
- Fonts (self-hosted WOFF2): Source Serif 4 (numbers, English headings), Amiri (Arabic headings), Almarai (all other text).
- Body text 16 px or larger, contrast 4.5:1 or better, tap targets 48 px or larger, every animation has a `prefers-reduced-motion` fallback.
- Budgets: app code under 150 KB, fonts under 350 KB compressed.
- Nothing about the user leaves the phone; storage is localStorage only.
- Every forecast shows source and date; reported figures say "as reported"; estimates say "estimate".
- Commit messages carry no co-author line (owner's rule). Work happens on `main` of a new local repository; nothing is pushed until Task 15.

## Review Focus

- The feed is unreachable on the very first visit (no cached price): show "Price not available yet, trying again" with no zeros, NaN or empty odometer. Test in Task 9.
- Weekend or holiday: the feed returns a fixed price with an old `updatedAt`: show the market-closed line, never "updated 172800 seconds ago". Tests in Tasks 2 and 9.
- A user types Arabic-Indic digits or a comma decimal ("٣٫٥", "3,5", "1,200"): inputs parse correctly. Test in Task 4.
- localStorage holds corrupted JSON or an older shape: the app starts with defaults for the broken part and keeps the rest. Test in Task 5.
- Extreme inputs (0 g, 5,000 g, offer of 0, making charge 100%): no Infinity, NaN or negative totals; the calculators show a short prompt instead. Test in Task 4.

---

### Task 1: Project scaffold and price maths

**Files:**
- Create: `package.json`, `.gitignore`, `app/js/config.js`, `app/js/price.js`, `tests/price.test.js`, `.claude/launch.json`

**Interfaces:**
- Produces (`config.js`): `OZ_G = 31.1034768`, `OMR_PER_USD = 0.3845`, `TOLA_G = 11.6638`, `KARATS = [24, 22, 21, 18]`, `DEFAULT_KARAT = 22`, `DEDUCTION = { low: 0.02, high: 0.06 }`, `VAT = 0.05`, `FEED_URL`, `POLL_MS = 10000`, `BACKOFF_MS = 60000`, `MAX_FAILS = 3`, `STAMPS = { 24: '999.9', 22: '916', 21: '875', 18: '750' }`.
- Produces (`price.js`): `gramPrice(usdPerOz: number, karat: number): number` (OMR per gram), `formatNum(value: number, decimals: number): string` (en-US grouping, fixed decimals).

- [ ] **Step 1:** `git init`, create `package.json` with `"type": "module"` and `"scripts": { "test": "node --test tests/" }`, `.gitignore` with `.superpowers/`, `node_modules/` and `scripts/seed/`, and `.claude/launch.json` with one configuration `{ "name": "app", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "5173", "--directory", "app"], "port": 5173 }`.
- [ ] **Step 2: Write the failing test** `tests/price.test.js`:

```js
test('gramPrice converts $/oz to OMR per gram by karat', () => {
  assert.ok(Math.abs(gramPrice(3470, 24) - 42.896) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 22) - 39.321) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 21) - 37.534) < 0.001);
  assert.ok(Math.abs(gramPrice(3470, 18) - 32.172) < 0.001);
});
test('formatNum groups thousands and fixes decimals', () => {
  assert.equal(formatNum(4403.2, 0), '4,403');
  assert.equal(formatNum(39.3214, 3), '39.321');
});
```

- [ ] **Step 3:** Run `npm test`. Expected: FAIL, module not found.
- [ ] **Step 4:** Implement `config.js` and `price.js` with the signatures above.
- [ ] **Step 5:** Run `npm test`. Expected: 2 passing.
- [ ] **Step 6:** Commit `feat: scaffold project and price maths`.

### Task 2: Time and history logic

**Files:**
- Create: `app/js/time.js`, `app/js/history.js`, `tests/time.test.js`, `tests/history.test.js`

**Interfaces:**
- Produces (`time.js`): `isMarketClosed(now: Date): boolean` (Friday 21:00 UTC to Sunday 22:00 UTC); `sessionDate(now: Date): string` (UTC date of `now + 3 h`, `YYYY-MM-DD`); `liveStatus({ price: number|null, updatedAt: number|null, now: number }): 'none'|'closed'|'delayed'|'live'` (`none` without a price, `closed` when the market is closed, `delayed` when `now - updatedAt` exceeds 15 minutes, else `live`).
- Produces (`history.js`): `lastClose(daily: {d: string, c: number}[], now: Date): {d, c}|null` (latest close with `d < sessionDate(now)`, null if it is more than 3 days old); `yearShareBelow(daily, price: number, now: Date): number` (0 to 1, closes within the last 365 days strictly below `price`); `tierOf(share: number): 0|1|2|3|4` (cuts at .10, .35, .65, .90); `hintOf(tier): 0|1|2`.

- [ ] **Step 1: Write the failing tests:**

```js
test('market closed window', () => {
  assert.equal(isMarketClosed(new Date('2026-11-25T12:00:00Z')), false); // Wednesday
  assert.equal(isMarketClosed(new Date('2026-11-27T21:30:00Z')), true);  // Friday after close
  assert.equal(isMarketClosed(new Date('2026-11-29T21:59:00Z')), true);  // Sunday before open
  assert.equal(isMarketClosed(new Date('2026-11-29T22:01:00Z')), false);
});
test('liveStatus states', () => {
  const wed = Date.parse('2026-11-25T12:00:00Z');
  assert.equal(liveStatus({ price: null, updatedAt: null, now: wed }), 'none');
  assert.equal(liveStatus({ price: 3470, updatedAt: wed - 30e3, now: wed }), 'live');
  assert.equal(liveStatus({ price: 3470, updatedAt: wed - 20 * 60e3, now: wed }), 'delayed');
  const sat = Date.parse('2026-11-28T12:00:00Z');
  assert.equal(liveStatus({ price: 3470, updatedAt: sat - 54e6, now: sat }), 'closed');
});
test('lastClose uses the session date and hides stale data', () => {
  const daily = [{ d: '2026-11-23', c: 3600 }, { d: '2026-11-24', c: 3556.37 }, { d: '2026-11-25', c: 3520 }];
  assert.equal(lastClose(daily, new Date('2026-11-25T10:00:00Z')).d, '2026-11-24');
  assert.equal(lastClose(daily, new Date('2026-11-25T22:00:00Z')).d, '2026-11-25');
  assert.equal(lastClose([{ d: '2026-11-19', c: 3700 }], new Date('2026-11-25T10:00:00Z')), null);
});
test('year share, tiers and hints', () => {
  const now = new Date('2026-11-25T10:00:00Z');
  const daily = Array.from({ length: 100 }, (_, i) => ({ d: new Date(Date.UTC(2026, 7, 1) + i * 864e5).toISOString().slice(0, 10), c: 4000 + i }));
  assert.equal(yearShareBelow(daily, 3500, now), 0);
  assert.equal(yearShareBelow(daily, 4050, now), 0.5);
  assert.deepEqual([0.05, 0.2, 0.5, 0.8, 0.95].map(tierOf), [0, 1, 2, 3, 4]);
  assert.deepEqual([0, 1, 2, 3, 4].map(hintOf), [0, 0, 1, 2, 2]);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL for the new files.
- [ ] **Step 3:** Implement both modules to the interfaces.
- [ ] **Step 4:** Run `npm test`. Expected: all passing.
- [ ] **Step 5:** Commit `feat: market hours, last close and year comparison`.

### Task 3: Forecast logic

**Files:**
- Create: `app/js/forecast.js`, `tests/forecast.test.js`

**Interfaces:**
- Consumes: none.
- Produces: `median(values: number[]): number`; `rollingCagr(monthly: {d, c}[], years: number): number[]` (annualised return of every window of `years * 12` months starting from 1971-01); `percentile(values: number[], p: number): number` (linear interpolation); `buildForecast(fc: ForecastFile, monthly, todayUsd: number): { y1: {mid, lo, hi, n}, y5: {lo, mid, hi}, y10: {lo, mid, hi} }` in USD/oz, where `y1` uses the median, min and max of `fc.targets[].usd`, and `y5`/`y10` apply the 10th, 50th and 90th percentile returns to `todayUsd`.
- `ForecastFile` shape: `{ asOf: 'YYYY-MM-DD', targets: [{ institution, usd, horizon, published, reportedBy, url, reported: boolean }], lbma: { winners: [{ year, name, org, forecast, actual }], survey2026Avg: number } }`.

- [ ] **Step 1: Write the failing tests:**

```js
test('median of the five end-2027 targets', () => {
  assert.equal(median([4650, 5250, 5000, 5000, 4500]), 5000);
});
test('rollingCagr recovers a steady growth rate', () => {
  const monthly = Array.from({ length: 12 * 20 + 1 }, (_, i) => ({ d: `${1971 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`, c: 100 * Math.pow(1.1, i / 12) }));
  const r = rollingCagr(monthly, 5);
  assert.equal(r.length, 12 * 15 + 1);
  assert.ok(r.every(x => Math.abs(x - 0.1) < 1e-9));
});
test('buildForecast shapes y1, y5 and y10', () => {
  const fc = { asOf: '2026-11-25', targets: [4650, 5250, 5000, 5000, 4500].map(usd => ({ usd })), lbma: {} };
  const monthly = Array.from({ length: 12 * 30 + 1 }, (_, i) => ({ d: `${1971 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`, c: 100 * Math.pow(1.08, i / 12) }));
  const out = buildForecast(fc, monthly, 3500);
  assert.deepEqual([out.y1.mid, out.y1.lo, out.y1.hi, out.y1.n], [5000, 4500, 5250, 5]);
  assert.ok(Math.abs(out.y5.mid - 3500 * Math.pow(1.08, 5)) < 1e-6);
  assert.ok(Math.abs(out.y10.mid - 3500 * Math.pow(1.08, 10)) < 1e-6);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `forecast.js`.
- [ ] **Step 4:** Run `npm test`. Expected: all passing.
- [ ] **Step 5:** Commit `feat: forecast median and history-based bands`.

### Task 4: My gold maths and calculators

**Files:**
- Create: `app/js/gold.js`, `app/js/calc.js`, `tests/gold.test.js`, `tests/calc.test.js`

**Interfaces:**
- Consumes: `gramPrice` (Task 1), `DEDUCTION`, `VAT` (Task 1).
- Produces (`gold.js`): `Piece = { id: string, name: string, grams: number, karat: 24|22|21|18, boughtPrice: number|null, boughtYm: 'YYYY-MM'|null }`; `validatePiece(p): Piece|null` (grams 0.1 to 5000, karat in KARATS); `sellEstimate(pieces: Piece[], usdPerOz): { low, mid, high }`; `pieceGain(piece, usdPerOz): { amount, pct }|null`; `totalGain(pieces, usdPerOz): { amount, pct, counted, of }|null`.
- Produces (`calc.js`): `parseNumber(input: string): number|null`; `pieceCost({ grams, karat, rate, making, mode: 'perGram'|'percent' }, usdPerOz): { gold, making, vat, total }|null` (rate defaults to `gramPrice` when null); `offerCheck({ grams, karat, offer }, usdPerOz): { value, gapPct, verdict: 'above'|'close'|'low'|'veryLow' }|null` (cuts at 3% and 7% below).

- [ ] **Step 1: Write the failing tests:**

```js
test('sell estimate applies the 2-6% deduction', () => {
  const e = sellEstimate([{ id: 'a', name: '', grams: 100, karat: 21, boughtPrice: null, boughtYm: null }], 3470);
  assert.ok(Math.abs(e.low - 3528.2) < 0.1 && Math.abs(e.high - 3678.3) < 0.1 && Math.abs(e.mid - 3603.2) < 0.1);
});
test('gain counts only pieces with a bought price', () => {
  const p = [{ id: 'a', name: '', grams: 100, karat: 21, boughtPrice: 3000, boughtYm: '2019-03' }, { id: 'b', name: '', grams: 10, karat: 22, boughtPrice: null, boughtYm: null }];
  const g = totalGain(p, 3470);
  assert.equal(g.counted, 1); assert.equal(g.of, 2);
  assert.ok(Math.abs(g.amount - 603.2) < 0.1);
});
test('parseNumber reads Arabic digits and both decimal styles', () => {
  assert.equal(parseNumber('٣٫٥'), 3.5);
  assert.equal(parseNumber('3,5'), 3.5);
  assert.equal(parseNumber('1,200'), 1200);
  assert.equal(parseNumber(' 12 '), 12);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
});
test('pieceCost adds making charge and 5% VAT', () => {
  const r = pieceCost({ grams: 10, karat: 21, rate: null, making: 2, mode: 'perGram' }, 3470);
  assert.ok(Math.abs(r.gold - 375.34) < 0.01 && r.making === 20 && Math.abs(r.vat - 19.767) < 0.01 && Math.abs(r.total - 415.107) < 0.01);
});
test('offerCheck verdicts', () => {
  const v = o => offerCheck({ grams: 10, karat: 22, offer: o }, 3470).verdict;
  assert.deepEqual([400, 390, 380, 360].map(v), ['above', 'close', 'low', 'veryLow']);
});
test('extreme inputs return null instead of NaN', () => {
  assert.equal(pieceCost({ grams: 0, karat: 22, rate: null, making: 0, mode: 'perGram' }, 3470), null);
  assert.equal(offerCheck({ grams: 10, karat: 22, offer: 0 }, 3470), null);
  assert.equal(validatePiece({ grams: 6000, karat: 22 }), null);
  assert.ok(pieceCost({ grams: 5000, karat: 24, rate: null, making: 100, mode: 'percent' }, 3470).total > 0);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `gold.js` and `calc.js`. `parseNumber`: map Arabic-Indic digits (U+0660 to U+0669) and Persian digits to 0-9, `٫` to `.`, `٬` to `,`; a comma followed by exactly three digits and no other separator is a thousands separator, otherwise it is a decimal point.
- [ ] **Step 4:** Run `npm test`. Expected: all passing.
- [ ] **Step 5:** Commit `feat: sell estimate, gains, piece cost and offer check`.

### Task 5: Strings and storage

**Files:**
- Create: `app/js/i18n.js`, `app/js/store.js`, `tests/i18n.test.js`, `tests/store.test.js`

**Interfaces:**
- Produces (`i18n.js`): `STRINGS = { ar: {...}, en: {...} }` (copy from the mockup's `T` object, extended with every label in design section 6); `t(lang, key, ...args): string`; `agoText(lang, seconds): string`; `monthYear(lang, ym): string` (Arabic month names in Arabic).
- Produces (`store.js`): `State = { v: 1, lang: 'ar'|'en', karat: number, pieces: Piece[], last: { usd, updatedAt }|null, tips: {} }`; `load(storage): State`; `save(state, storage): void`. Unknown or broken fields fall back to defaults one field at a time; invalid pieces are dropped through `validatePiece`.

- [ ] **Step 1: Write the failing tests:**

```js
test('Arabic and English have the same keys', () => {
  assert.deepEqual(Object.keys(STRINGS.ar).sort(), Object.keys(STRINGS.en).sort());
});
test('agoText plural forms', () => {
  assert.equal(agoText('ar', 3), 'تم التحديث الآن');
  assert.equal(agoText('ar', 7), 'آخر تحديث قبل 7 ثوانٍ');
  assert.equal(agoText('ar', 30), 'آخر تحديث قبل 30 ثانية');
  assert.equal(agoText('en', 30), 'updated 30 seconds ago');
});
test('load survives corrupted storage', () => {
  const mem = new Map([['goldToday', '{not json']]);
  const storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.deepEqual(load(storage), { v: 1, lang: 'ar', karat: 22, pieces: [], last: null, tips: {} });
});
test('load keeps good fields and drops bad pieces', () => {
  const mem = new Map([['goldToday', JSON.stringify({ v: 1, lang: 'en', karat: 99, pieces: [{ id: 'a', name: 'x', grams: 10, karat: 21, boughtPrice: null, boughtYm: null }, { grams: -1 }] })]]);
  const storage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const s = load(storage);
  assert.equal(s.lang, 'en'); assert.equal(s.karat, 22); assert.equal(s.pieces.length, 1);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement both modules. Storage key `goldToday`.
- [ ] **Step 4:** Run `npm test`. Expected: all passing.
- [ ] **Step 5:** Commit `feat: bilingual strings and safe storage`.

### Task 6: Seed data files

**Files:**
- Create: `scripts/seed-history.mjs`, `app/data/history.json`, `app/data/forecasts.json`, `app/data/why.json`, `app/data/places.json`, `tests/data.test.js`

**Interfaces:**
- Produces: `history.json` = `{ source: string, daily: [{ d, c }], monthly: [{ d: 'YYYY-MM', c }] }`, ascending; `forecasts.json` as `ForecastFile` (Task 3) filled from design section 8 R1 and R2 (five end-2027 targets; World Bank left out until verified); `why.json` = `{ date, ar, en, source, url }`; `places.json` = `[{ id, ar, en, areaAr, areaEn, lineAr, lineEn, maps }]` from design 7.12.

- [ ] **Step 1: Write the failing test** `tests/data.test.js`: history daily is sorted, has at least 250 entries and its last date is on or after `2026-11-20`; monthly starts at `1971-01` with no gap longer than one month; forecasts has 5 targets each with `institution`, `usd`, `horizon`, `published`, `url`; places has at least 3 entries each with `ar`, `en` and `maps`; why has `date`, `ar`, `en`, `source`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Write `seed-history.mjs`: monthly closes from `https://freegoldapi.com/data/latest.json` (last value of each month from 1971 to the dataset's end, USD only), then later months and the last 400 days of daily closes from a JSON file exported once from TradingView `OANDA:XAUUSD` (saved to `scripts/seed/` and gitignored). Write the four data files.
- [ ] **Step 4:** Run `node scripts/seed-history.mjs` then `npm test`. Expected: all passing.
- [ ] **Step 5:** Commit `feat: seed price history, forecasts, places and why line`.

### Task 7: Fonts, images and icons

**Files:**
- Create: `scripts/fetch-fonts.mjs`, `app/css/fonts.css`, `app/fonts/*.woff2`, `app/img/*.webp`, `scripts/make-icons.py`, `app/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`

- [ ] **Step 1:** `fetch-fonts.mjs` requests the Google Fonts CSS for Source Serif 4 (500, 600, 600 italic), Amiri (400, 700) and Almarai (400, 700, 800) with a modern user agent, keeps only the `latin` and `arabic` subsets, downloads those WOFF2 files to `app/fonts/` and writes `@font-face` rules with the same `unicode-range` and `font-display: swap` to `app/css/fonts.css`.
- [ ] **Step 2:** Download the three photos from design section 5 at widths 600 and 1200 with `fm=webp&q=72` into `app/img/` (`hero-600.webp` and so on), and record photographer names for the credits line.
- [ ] **Step 3:** `make-icons.py` (Pillow) draws a carnelian square with a gold ring mark and writes the four PNGs.
- [ ] **Step 4:** Verify: total size of `app/fonts` under 350 KB (`du -ch app/fonts/*.woff2`), every image under 160 KB, icons open correctly.
- [ ] **Step 5:** Commit `feat: self-hosted fonts, photos and icons`.

### Task 8: App shell and styles

**Files:**
- Create: `app/index.html`, `app/css/tokens.css`, `app/css/app.css`, `app/js/main.js`, `app/js/ui/odometer.js`, `app/js/ui/countup.js`

**Interfaces:**
- Consumes: `load`, `save` (Task 5), `STRINGS`, `t` (Task 5).
- Produces: `index.html` with header (wordmark, share button `#share`, language link `[data-lang-toggle]`), four `section.view[data-view=today|gold|future|buysell]`, bottom tab bar `button[data-tab]`, and two `<dialog>` sheets (`#piece-sheet`, `#sources-sheet`); `main.js` exports `app = { state, setView(name), setLang(lang), setKarat(k), on(event, fn) }` and emits `price`, `lang`, `karat` events; `odometer(el: HTMLElement, text: string): void`; `countUp(el: HTMLElement, to: number, decimals: number): void`.

- [ ] **Step 1:** Port the Maison styles from the mockup (`.m-*` rules, odometer, live dot, kline, tab bar) into `tokens.css` (tokens and base) and `app.css` (components), with the new tab "Buy & sell" and its icon.
- [ ] **Step 2:** Build `index.html` and `main.js`: language switch sets `lang`/`dir` on `<html>` and re-renders `[data-t]` texts; tab switch shows one view with the 0.4 s fade; state saved through `save`.
- [ ] **Step 3:** Verify: start the `app` server with `preview_start`, set the viewport to 390 x 844, screenshot Arabic and English. Expected: header, empty views and tab bar match the mockup, no console errors.
- [ ] **Step 4:** Commit `feat: app shell, tabs and language switch`.

### Task 9: Live price and the Today tab (N1, N11)

**Files:**
- Create: `app/js/live.js`, `app/js/views/today.js`, `tests/live.test.js`

**Interfaces:**
- Consumes: `gramPrice`, `formatNum` (Task 1); `liveStatus`, `lastClose`, `yearShareBelow`, `tierOf`, `hintOf` (Task 2); `app` (Task 8).
- Produces (`live.js`): `startLive({ fetchFn, onPrice, onStatus, now }): { stop() }` (polls `FEED_URL` every `POLL_MS`, backs off to `BACKOFF_MS` after `MAX_FAILS`, pauses on `visibilitychange`); `parseFeed(json): { usd, updatedAt }|null`.

- [ ] **Step 1: Write the failing test** `tests/live.test.js`: `parseFeed({ price: 3470.5, updatedAt: '2026-11-25T12:00:00Z' })` returns `{ usd: 3470.5, updatedAt: 1795608000000 }`; `parseFeed({ price: 'x' })` and `parseFeed(null)` return null; with a fake `fetchFn` that rejects 3 times, the next delay is `BACKOFF_MS`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `live.js`, then `views/today.js`: on open show `state.last` at once and save every new price to it; hero image with `srcset`, price odometer with an `aria-label` such as "39.397 rials per gram, 22 karat" (no live region), karat selector, live line from `liveStatus` (texts: live, delayed, closed, and "Price not available yet, trying again" for `none`), change line from `lastClose` (hidden when null), why line from `why.json` (hidden when older than 3 days), year sentence, track and hint, the price board (rows 24/22/21/18, columns 1 g, 10 g, 1 tola; tapping a row sets the karat), the VAT and making-charge note, share button hook, world price, disclaimer.
- [ ] **Step 4:** Run `npm test`. Expected: all passing. Then verify in the browser at 390 x 844: price rolls on change, board matches the hero price for the selected karat, both languages correct. Block `api.gold-api.com` (temporarily set `FEED_URL` to an invalid host) and clear storage: the "not available" line shows and no NaN appears anywhere.
- [ ] **Step 5:** Commit `feat: live price and Today tab with price board`.

### Task 10: My gold tab (N4)

**Files:**
- Create: `app/js/views/mygold.js`, `app/js/ui/sheet.js`

**Interfaces:**
- Consumes: `sellEstimate`, `pieceGain`, `totalGain`, `validatePiece` (Task 4); `parseNumber` (Task 4); `monthYear` (Task 5); `app.state.pieces`.
- Produces: `openSheet(dialog: HTMLDialogElement): Promise<FormData|null>`.

- [ ] **Step 1:** Implement the tab: photo band, total estimate with count-up and range sentence, pieces list (name, grams, karat, value, gain line), empty state, "Add a piece" and edit/remove through `#piece-sheet` (name, grams with `inputmode="decimal"`, karat chips, bought price, bought month and year).
- [ ] **Step 2:** Verify in the browser: add 120 g 21K bought for 3,000 in 2019-03 and 50.5 g 22K without a price; totals and the gain line ("covers 1 of 2 pieces") are correct against `sellEstimate`/`totalGain` in the console; reload keeps the pieces; typing "٣٫٥" saves 3.5 g.
- [ ] **Step 3:** Commit `feat: My gold with pieces and bought-price gains`.

### Task 11: Future tab (N12)

**Files:**
- Create: `app/js/ui/chart.js`, `app/js/views/future.js`

**Interfaces:**
- Consumes: `buildForecast` (Task 3); `history.json`, `forecasts.json`; `gramPrice` (Task 1).
- Produces: `drawFuture(svg: SVGSVGElement, { pastMonthly: number[], todayUsd, y1, y5, y10, labels }, animate: boolean): void` (log scale, past 5 years solid, future dotted through today and the 1, 5, 10-year mids, band lo to hi, unroll animation).

- [ ] **Step 1:** Implement the chart (port `drawFuture` from the mockup, switched to real points), the three rows in rials per gram for the selected karat, the "middle of N bank forecasts, as reported" line with the Sources sheet (institution, target, horizon, date, reported by, link), the history-band explanation with low and high, the report card (two LBMA winners with forecast, actual and miss percent; the 2026 survey average against this year's average so far from `history.json`), the "updated on" date and the data sources and photo credits line.
- [ ] **Step 2:** Verify in the browser: values match `buildForecast` output converted with `gramPrice`; the chart unrolls once per visit to the tab; Sources sheet opens and closes with the back gesture and Escape.
- [ ] **Step 3:** Commit `feat: Future tab with forecasts, sources and report card`.

### Task 12: Buy & sell tab (N2, N3, N10)

**Files:**
- Create: `app/js/views/buysell.js`

**Interfaces:**
- Consumes: `pieceCost`, `offerCheck`, `parseNumber` (Task 4); `places.json`; `STAMPS` (Task 1).

- [ ] **Step 1:** Implement: photo band; "What should this piece cost?" (weight, karat chips, making charge with a rials-per-gram or percent toggle, shop rate prefilled from the live price and editable, results with count-up); "Is this offer fair?" (weight, karat, offer; verdict sentence per 7.10); places list with Map links; karat and hallmark guide; tips.
- [ ] **Step 2:** Verify in the browser with the Task 4 test values (10 g 21K, 2 rials per gram: total 415.107 at $3,470; offers 400, 390, 380, 360 at 10 g 22K) and with empty or zero inputs (a short prompt, no NaN).
- [ ] **Step 3:** Commit `feat: Buy & sell calculators, places and karat guide`.

### Task 13: Share card (N5)

**Files:**
- Create: `app/js/ui/share.js`

**Interfaces:**
- Consumes: `gramPrice`, `formatNum` (Task 1); `t` (Task 5).
- Produces: `drawShareCard(canvas: HTMLCanvasElement, { lang, usd, when: Date, url }): void` (1080 x 1350, Maison style: wordmark, "Muscat", date and time, the four karats per gram, world price, link); `shareToday(state): Promise<'shared'|'text'|'cancelled'>` (Web Share with the PNG file and text; falls back to `https://wa.me/?text=` with the same text).

- [ ] **Step 1:** Implement after `document.fonts.ready` so the card uses the real fonts.
- [ ] **Step 2:** Verify: in the browser console, draw to a canvas, export `toDataURL`, open it in a new tab and screenshot. Expected: legible in both languages, numbers equal the board. On desktop the fallback opens WhatsApp web text.
- [ ] **Step 3:** Commit `feat: share today's prices as an image card`.

### Task 14: Install and offline

**Files:**
- Create: `app/manifest.webmanifest`, `app/sw.js`, `app/js/install.js`
- Modify: `app/index.html` (manifest link, apple-touch-icon, theme-color, SW registration)

**Interfaces:**
- Produces: service worker cache `gold-today-v1`: app shell, CSS, JS, fonts, images precached; `data/*.json` network-first with cache fallback; the live feed is never cached by the worker (the app keeps the last price in storage).

- [ ] **Step 1:** Manifest: `name` "ذهب اليوم", `short_name` "ذهب اليوم", `lang` "ar", `dir` "rtl", `start_url` "./", `scope` "./", `display` "standalone", `background_color` and `theme_color` "#ffffff", the icons from Task 7.
- [ ] **Step 2:** `install.js`: first-visit tip in the current language with iPhone steps (Share, Add to Home Screen) or Android steps (menu, Install app), dismissed once into `state.tips`.
- [ ] **Step 3:** Verify: load once, stop the preview server, reload. Expected: the app opens from cache with the last price and the delayed or closed line. Lighthouse-style check in the console: `navigator.serviceWorker.controller` is set; manifest parses.
- [ ] **Step 4:** Commit `feat: installable app with offline support`.

### Task 15: GitHub hosting and the daily close

**Files:**
- Create: `scripts/append-close.mjs`, `tests/append-close.test.js`, `.github/workflows/pages.yml`, `.github/workflows/daily-close.yml`

**Interfaces:**
- Produces: `appendClose(history, { usd, at: Date }): history` (adds `{ d: YYYY-MM-DD of at, c: usd }` when that date is missing, replaces it when present, keeps the last 400 daily entries, and updates the month's monthly close).

- [ ] **Step 1: Write the failing test:** appending to a history ending `2026-11-24` adds `2026-11-25`; appending twice on the same date keeps one entry; the daily list never exceeds 400; the monthly entry `2026-11` equals the new close.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL. Implement. Run again. Expected: all passing.
- [ ] **Step 3:** `pages.yml` deploys `app/` with `actions/upload-pages-artifact` and `actions/deploy-pages` on push to `main` and on manual dispatch. `daily-close.yml` runs `0 21 * * 1-5`, runs `node scripts/append-close.mjs`, commits `app/data/history.json` as `github-actions[bot]` only when it changed.
- [ ] **Step 4:** With the owner: create the public repository `gold-today`, add it as `origin`, push `main` (owner signs in), set Pages source to GitHub Actions, allow workflow write permission, run `daily-close` once by hand.
- [ ] **Step 5:** Verify: `https://<user>.github.io/gold-today/` loads on a phone, installs to the home screen, and the manual Action run commits a new close.

### Task 16: Scheduled Claude routines (N11, N13)

- [ ] **Step 1:** Use the `schedule` skill to create a daily routine at 21:30 UTC with access to the `gold-today` repository. Its prompt: find the main reason gold moved today in reputable news (Reuters, Bloomberg, AP, Financial Times, Kitco, Al Arabiya, Asharq Business), write one neutral sentence of at most 20 words in Arabic and in English with no advice, and commit `app/data/why.json` as `{ date, ar, en, source, url }`; change nothing else.
- [ ] **Step 2:** Create a monthly routine (1st of each month, 06:00 UTC): refresh `app/data/forecasts.json` targets published in the last 120 days with institution, target, horizon, date, reporting outlet and URL, marking `reported: true` unless taken from the bank's own note; keep the LBMA block; update `asOf`; run `npm test`; commit only if tests pass.
- [ ] **Step 3:** Verify: trigger each routine once; the commits touch only their file; the deployed app shows the new date.

### Task 17: Final verification

- [ ] **Step 1:** At 360 x 740, 390 x 844 and 430 x 932, in Arabic and English, screenshot every tab. Expected: nothing overflows, the price is visible without scrolling on Today, contrast holds.
- [ ] **Step 2:** With `prefers-reduced-motion` emulated: no zoom, sheen, roll or unroll.
- [ ] **Step 3:** Weekend check: set the clock in `liveStatus` tests to Saturday and confirm the Today line reads "market closed".
- [ ] **Step 4:** `npm test` all passing; app code and fonts within budget.
- [ ] **Step 5:** Hand the owner the Arabic wording list for review (design D9) and the link for the family.
