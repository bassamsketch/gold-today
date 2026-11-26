# Release 1: Outlook, price check and My gold history Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship revision 3 of the design without the currency switch: the Outlook tab (two questions), Buy & sell's price check, offer check and jewellery-or-bar, and My gold's past values.

**Architecture:** Pure functions in `app/js/insights.js` (history facts) and `app/js/calc.js` (price check, jewellery-or-bar) carry all numbers and are unit-tested. Views (`future.js`, `buysell.js`, `mygold.js`) only read those results and the strings in `i18n.js`. Markup lives in `index.html`; styles in `app.css`, inside the existing Maison tokens.

**Tech Stack:** Static HTML, CSS and ES modules, node:test, GitHub Pages, a service worker.

**Spec:** `docs/superpowers/specs/2026-11-26-decisions-and-currency-design.md` (revision 3.1 plus the VAT law). Mockups: session scratchpad `mock/build.mjs`, `mock/extra.css`.

## Global Constraints

- Arabic first, right-to-left; every string in `ar` and `en` with the same keys (test `Arabic and English have the same keys`). Neutral Arabic forms (no gendered "you" verbs). Arabic counted nouns follow the existing rule: the last two digits decide (3 to 10 plural, 11 to 99 accusative singular, else plain).
- Body text 16px or more, tap targets 48px or more, contrast 4.5:1 or more, reduced-motion paths for any animation.
- Rials keep three decimals where the app shows prices today; sentences round to whole rials.
- VAT: jewellery 5% on the full price (gold and making). Bars: with and without 5% VAT shown (design 6.4).
- Facts only. No buy, sell or wait wording.
- Existing tests stay green. New files go in the `sw.js` precache, and `VERSION` becomes `gold-today-v6`.
- Commits as bassamsketch, no co-author line.

## Review Focus

- A price below the gold value in the price check: no band, no target, the "worth checking" sentence.
- Karat 24 in the price check: the piece or bar switch appears and changes the band and deduction.
- No live price: the price check and Outlook use the last known price and do not show NaN or blank numbers.
- A record outside the 5-year chart window, or today at the record: no marker, and "At its highest ever".
- Arabic number agreement in every new sentence that carries a number, including durations (أشهر, شهراً, سنوات, سنة).

---

### Task 1: History facts (`insights.js`)

**Files:**
- Create: `app/js/insights.js`
- Test: `tests/insights.test.js`

**Interfaces:**
- Produces:
  - `recordHigh(history, liveUsd)` → `{ usd, d, day, live }`. `d` is `YYYY-MM-DD` for a daily record, `YYYY-MM` for a monthly one, `null` when the live price is the record. Returns `null` without data.
  - `pastFalls(monthly, threshold = 0.2)` → `[{ year, depth, months }]` (depth 0..1), completed episodes since 1971-01.
  - `higherOdds(monthly, years)` → `{ share, tens, typical, worst, worstFrom }` (typical and worst as signed fractions), or `null`.
  - `moveSince(daily, priceUsd, now, days)` → signed fraction against the last close on or before the Muscat date `days` before `now`, or `null`.
  - `yearRange(daily, now)` → `{ lo: { d, c }, hi: { d, c } }` over the last 365 days, or `null`.
  - `closeYearsAgo(monthly, years)` → `{ d, c }` for the same month `years` before the latest month, or `null`.

- [ ] **Step 1: Write the failing tests** in `tests/insights.test.js`, using small synthetic series and the real `app/data/history.json`:
  - `recordHigh` picks the daily maximum over a lower monthly maximum, returns `day: true` and the date; a live price above both returns `live: true, d: null`.
  - `pastFalls` on a synthetic series with one 25% fall that recovers after 7 months and one 15% dip returns exactly one episode `{ depth ≈ 0.25, months: 7 }`; an unrecovered fall at the end is not listed.
  - On the real data, `pastFalls` gives years `['1973','1974','1980','2008','2011']` and months `[6,43,316,18,106]`.
  - `higherOdds(real, 10)` gives `tens: 8`, `worstFrom: '1980'`, `Math.round(worst*100) === -44`; `higherOdds(real, 1).tens === 6`.
  - `moveSince` with closes `[{d:'2026-11-18',c:3725.18},{d:'2026-11-25',c:3574}]`, price 3574, now `2026-11-25T12:00Z`, days 7 → about -0.0406.
  - `yearRange(real, 2026-11-25)` → lo `2026-11-20` 3538.19, hi `2026-01-28` 5418.55.
  - `closeYearsAgo(real, 5)` → `{ d: '2021-11' }`.

- [ ] **Step 2: Run it to see it fail.** Run: `node --test tests/insights.test.js`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `app/js/insights.js`.** Use `muscatDate` from `history.js` for dates. `pastFalls` walks the monthly closes keeping the running peak, the trough and whether the trough reached `1 - threshold` of the peak; an episode completes when a close regains the peak.

- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: all pass.

- [ ] **Step 5: Commit** `feat: history facts for the outlook (record, falls, odds, moves, past values)`.

### Task 2: Price check and jewellery-or-bar (`calc.js`, `config.js`)

**Files:**
- Modify: `app/js/config.js`, `app/js/calc.js`
- Test: `tests/calc.test.js`

**Interfaces:**
- Produces:
  - `config.js`: `MAKING_TYPICAL = { low: 3, high: 6 }`, `BAR = { premiumLow: 0.02, premiumHigh: 0.09, premium: 0.05, deduction: 0.01 }`, `JEWEL_DEDUCTION = 0.04`, `MAX_PRICE = 1000000`.
  - `priceCheck({ grams, karat, price, bar }, usdPerOz)` → `null` for bad input, else `{ rate, gold, extra, extraPct, band: [lo, hi], position, back, per100, target, bar }`. `position` is `'under'` (price below gold value; then `band`, `target` are `null`), `'below'`, `'within'` or `'above'`. `bar` is true only when karat is 24 and the switch says bar.
  - `jewelleryVsBar(usdPerOz)` → `{ bar: [withVat, noVat], plain, detailed }` as whole numbers per 100 paid, at 22 karat.

- [ ] **Step 1: Write the failing tests:**
  - `priceCheck({ grams: 20, karat: 22, price: 950 }, 3574)`: gold ≈ 810.0, extra ≈ 140.0, `Math.round(extraPct*100) === 17`, band rounds to `[13, 21]`, position `'within'`, back ≈ 777.6, per100 82, target ≈ 49.48.
  - Price 800 for the same piece → position `'under'`, `band === null`, `target === null`.
  - Price 1100 → `'above'`; price 880 → `'below'` (8.6% is under 12.8%).
  - Karat 24 with `bar: true`: band rounds to `[2, 14]`, back uses 1%. Karat 24 with `bar: false` uses the jewellery band.
  - Bad input (`grams: 0`, `price: 0`, `price: 2e6`, NaN) → `null`.
  - `jewelleryVsBar(3574)` → `{ bar: [90, 94], plain: 85, detailed: 80 }`.

- [ ] **Step 2: Run to see it fail.** Run: `node --test tests/calc.test.js`. Expected: FAIL, `priceCheck is not a function`.

- [ ] **Step 3: Implement** in `calc.js` with the formulas in design 6.1 and 6.4 (jewellery band `((rate + low) * 1.05) / rate - 1` to the same with `high`; bar band `premiumLow` to `(1 + premiumHigh) * 1.05 - 1`; `back = gold * (1 - deduction)`; `target = price / (grams * (1 - deduction))`).

- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: all pass.

- [ ] **Step 5: Commit** `feat: price check and jewellery-or-bar figures`.

### Task 3: Strings (`i18n.js`)

**Files:**
- Modify: `app/js/i18n.js`
- Test: `tests/i18n.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: keys used by Tasks 5 to 7, among them `tabFuture` (now التوقعات / Outlook), `outlook` (توقعات سعر الذهب / Gold price outlook), `q1`, `belowRecord(pct)`, `atRecord`, `pastWeek(pct)`, `pastMonth(pct)`, `todayRow`, `recordRow`, `fallsLine(list, current, longestYear)`, `fallsCap`, `fallRow(depthPct, months)`, `showDetails`, `q2`, `noOneKnows`, `q2Sub`, `after1`, `after10`, `higherCases(k)`, `oddsSince`, `worst10(year, pct)`, `banksShort(lo, hi, horizonYm, today)`, `missLine(...)`, `periodRow(typical, worst)`, `overlapNote`, `inflationNote`, the price-check keys (`pcWhen`, `pcTitle`, `pcIntro`, `showExample`, `pcPrice`, `pcAlt`, `pcGold`, `pcExtra`, `pcWhy(pct)`, `noExtra`, `pcWithin`, `pcBelow`, `pcAbove`, `pcRange(lo, hi)`, `pcBasis`, `pcBarWithin`, `pcBarRange(lo, hi)`, `pcBarBasis`, `pcUnder`, `pcBack`, `pcPer100(n)`, `pcTarget(price, target, karat, today)`, `pieceOrBar`, `pieceOpt`, `barOpt`), the offer keys (`ocWhen`, `ocTitle`, `ocIntro`), the jewellery-or-bar keys (`jbWhen`, `jbTitle`, `jbIntro`, `jbBar`, `jbPlain`, `jbDetailed`, `jbTo`, `jbDiff`, `jbOnlyMoney`, `jbFine`), and My gold's `beforeTitle`, `yearHigh`, `yearLow`, `yearsAgo(n)`, `beforeNote`. A helper `durationText(lang, months)` (under 24 months in months, else whole years; Arabic agreement).

- [ ] **Step 1: Write failing tests:** `durationText('ar', 6) === '6 أشهر'`, `('ar', 18) === '18 شهراً'`, `('ar', 43) === '4 سنوات'`, `('ar', 316) === '26 سنة'`, `('en', 106) === '9 years'`; `t('ar','higherCases',6)` contains `6 حالات من كل 10`; `t('ar','tabFuture') === 'التوقعات'`; no Arabic string contains `مناسب` and no English one contains `good time` (facts, not advice).

- [ ] **Step 2: Run to see it fail.** Run: `node --test tests/i18n.test.js`. Expected: FAIL.

- [ ] **Step 3: Add the strings** with the wording in the mockups and design 6 and 7 (the copy in `mock/build.mjs` `future3`, `buySell3`, `myGold3` is the reference, as amended by the VAT law: band 13% to 21%, B3 85 and 80, bars 90 to 94). Remove keys that no view uses after Task 5 (`histTitle`, `in5`, `in10`, `histRange`, `histNote`, `ago5`, `bankRow`, `bankFor`, `y1Note`, `reportTitle`, `winnerLine`, `surveyLine`, `reportClose`, `costTitle` and the old cost labels replaced in Task 6).

- [ ] **Step 4: Run the tests.** Run: `npm test`. Expected: all pass.

- [ ] **Step 5: Commit** `feat: strings for the outlook, price check and past values`.

### Task 4: History chart (`ui/chart.js`)

**Files:**
- Modify: `app/js/ui/chart.js`

**Interfaces:**
- Produces: `drawHistory(svg, { past, today, record, words, values }, animate)`. `past` is the per-gram closes of the last 60 months, `today` the per-gram price now, `record` `{ x, value }` with `x` in months from the first point (fractional for a daily record) or `null`. Linear scale. Draws `.f-past`, `.f-rec` (open circle) with `.f-rec-w` and `.f-rec-v` labels to its left, `.f-now` with labels below-left, and the start label. Keeps the existing clip-path reveal and its reduced-motion path. `drawFuture` is removed.

- [ ] **Step 1: Implement** following `mock/build.mjs` `chart()` (W 340, H 214, X0 8, XT 326, y padding 0.94 and 1.05).
- [ ] **Step 2: Verify in the browser in Task 5** (no unit test: the drawing is checked by eye at 360, 390 and 430 px).
- [ ] **Step 3: Commit with Task 5.**

### Task 5: Outlook tab (`views/future.js`, `index.html`, `app.css`)

**Files:**
- Modify: `app/index.html` (the `data-view="future"` section), `app/js/views/future.js`, `app/css/app.css`, `app/js/forecast.js`, `tests/forecast.test.js`

**Interfaces:**
- Consumes: Task 1 functions, `buildForecast` (y1 only), `surveyComparison`, `drawHistory`, Task 3 strings, `yearShareBelow` and `tierOf` from `history.js`.

- [ ] **Step 1: Update `forecast.js` tests first:** `buildForecast` returns `{ y1 }` only, so the y5 and y10 assertions and the `rollingCagr` tests are removed; a test asserts `buildForecast(fc).y1.n === 5`. Run `node --test tests/forecast.test.js`: FAIL until Step 2.
- [ ] **Step 2: Simplify `forecast.js`:** drop `rollingCagr`, `band`, y5 and y10. Run the tests: PASS.
- [ ] **Step 3: Replace the Future section markup** with design 7: title, subtitle, karat selector, Q1 (answer, moves, mood, chart, today and record rows, falls line, `<details>` with the falls table), Q2 (answer, sub, two dot rows, worst line, banks line, `<details>` with all periods, overlap note, misses, bank list, Sources button), note, footer. Keep `id`s the view needs; keep the sources sheet.
- [ ] **Step 4: Rewrite `future.js`** to render from Task 1 and Task 3, re-rendering on `price`, `karat`, `lang`, `data` and `view` as today. The falls line starts "Before this fall" only when today is 20% or more under the record, and names the longest wait's year only when that fall is also the deepest. Edge cases in the Review Focus.
- [ ] **Step 5: Port the CSS** for `.q`, `.answer`, `.moves`, `.caution`, `details/summary`, `.o2`, `.orow`, `.falls`, `.srow` from `mock/extra.css`, with class names that do not collide with `.band` or `.big`.
- [ ] **Step 6: Run `npm test`, then check the tab in the browser** at 390 px in Arabic and English (open and closed details). Expected: matches the mockup; no console errors.
- [ ] **Step 7: Commit** `feat: Outlook tab answers two questions, with the history chart and folded details`.

### Task 6: Buy & sell (`views/buysell.js`, `index.html`, `app.css`)

**Files:**
- Modify: `app/index.html` (the `data-view="buysell"` section), `app/js/views/buysell.js`, `app/css/app.css`

**Interfaces:**
- Consumes: `priceCheck`, `jewelleryVsBar`, `pieceCost` (the alternative route computes the price as `pieceCost(...).total`), `offerCheck`, `parseNumber`, Task 3 strings.

- [ ] **Step 1: Markup** per design 6: slim band image; B1 (when caption, title, intro, "Show an example", numbered fields 1 weight, 2 karat with the piece or bar switch shown only for 24, 3 full price; the alternative link revealing the rate and making fields; the results panel with the rows, track, verdict, range, basis, back, per-100 and target lines); B2 (when caption, new title, intro, example, numbered fields, existing results); B3 (when caption, title, intro, three rows, the difference line, the money-only line, fine print); then places, guide, tips unchanged.
- [ ] **Step 2: Logic** in `buysell.js`: B1 renders from `priceCheck` on every input; the example fills 20, 22, 950.000; the alternative route fills the price from the rate and making fields and marks the price as computed; errors use the existing `.err` pattern (weight 0.1 to 5,000, price above 0 and up to 1,000,000). B2's example fills 20, 22, 780.000. B3 renders from `jewelleryVsBar` on `price`. Results never change by themselves except B3 and the B1 gold value when the live price moves (QA19 keeps the typed values).
- [ ] **Step 3: CSS** for `.step`, `.try`, `.pc` and its rows, the track with `.usual`, `.b3-*`, `.band.slim`, the piece or bar switch (reuse `.seg`).
- [ ] **Step 4: Run `npm test`, then check in the browser** at 360 and 390 px in both languages: empty state, the example, a price under the gold value, karat 24 with both switch states, the alternative route. Expected: matches the mockup; no NaN.
- [ ] **Step 5: Commit** `feat: price check answers in money, offer check and jewellery-or-bar in Buy & sell`.

### Task 7: My gold's past values (`views/mygold.js`, `index.html`, `app.css`)

**Files:**
- Modify: `app/index.html` (inside `#gold-total`), `app/js/views/mygold.js`, `app/css/app.css`

**Interfaces:**
- Consumes: `yearRange`, `closeYearsAgo`, `sellEstimate`, Task 3 strings.

- [ ] **Step 1: Markup and render:** the block with four rows (12-month high with its date, low with its date, 5 years ago, 10 years ago) and the note; rows without data hide; the block hides without pieces or price.
- [ ] **Step 2: Run `npm test`, then check in the browser** with two pieces in Arabic and English. Expected: values match `sellEstimate` at those closes.
- [ ] **Step 3: Commit** `feat: My gold shows what the same gold was worth before`.

### Task 8: Release plumbing

**Files:**
- Modify: `app/sw.js`, `tests/sw.test.js` (if it lists files), `docs/build-report.md`

- [ ] **Step 1:** Add `js/insights.js` to `PRECACHE`, set `VERSION = 'gold-today-v6'`. Run `npm test`: PASS.
- [ ] **Step 2:** Add a build-report section for release 1 (what changed, checks run, open items).
- [ ] **Step 3: Commit** `chore: precache the new module, cache v6, build report`.

### Task 9: Verify, review, ship

- [ ] **Step 1:** Browser pass at 360, 390 and 430 px, Arabic and English, all four tabs and the sheets; no console errors; the service worker updates.
- [ ] **Step 2:** Independent review of the branch against the design (fresh agent), fix Critical and Important findings test-first.
- [ ] **Step 3:** Merge to `main`, push, wait for the Pages deploy, and check the live site.
