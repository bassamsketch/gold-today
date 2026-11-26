# Release 2: display currency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner view every displayed price in OMR, AED, USD, EUR or LBP, while buying, selling and every typed amount stay in Omani rials.

**Architecture:** `app/js/money.js` converts rial amounts to the chosen currency and formats them by kind (gram, short, total), with LBP in millions. Rates: pegs in `config.js`, EUR and LBP in `app/data/rates.json`, refreshed by `scripts/update-rates.mjs` in the existing daily job. `main.js` loads the rates and exposes `app.money`; a `currency` event re-renders every view. A header button opens a sheet with the five currencies.

**Tech Stack:** Static ES modules, node:test, GitHub Actions, the service worker.

**Spec:** `docs/superpowers/specs/2026-11-26-decisions-and-currency-design.md`, section 9.

## Global Constraints

- Rials look exactly as today when the currency is OMR (same decimals, same words).
- Typed amounts and the shop tools stay in rials (price paid, price check inputs and results, offer check); one converted line under the price check's results when the currency is not OMR.
- Units with Arabic agreement: ريال (ريالات, ريالاً, ريال), درهم (دراهم, درهماً, درهم), دولار (دولارات, دولاراً, دولار), يورو (invariable), مليون ليرة (ملايين ليرة, مليون ليرة, مليون ليرة).
- Decimals by kind: gram OMR 3, AED/USD/EUR 2, LBP 3 (millions); short OMR 1, AED 0, USD/EUR 1, LBP 2; total OMR/AED/USD/EUR 0, LBP 1.
- Missing or invalid rates: EUR and LBP unavailable, a saved EUR or LBP choice shows rials.
- Commits as bassamsketch, no co-author line. Cache `gold-today-v7`.

## Review Focus

- A saved currency of EUR with `rates.json` missing: rials shown, no NaN.
- LBP at Today's big price and the board at 360 px: fits, unit "million Lebanese pounds".
- Switching currency with a sheet or a price check open: everything re-renders, typed values untouched.
- `update-rates.mjs` with a failed or out-of-range response: file unchanged, exit 0.
- The world price per ounce stays in dollars in every currency.

---

### Task 1: money.js
- Create `app/js/money.js`, `tests/money.test.js`. Produces `perUsd(code, rates)`, `fromRials(rials, code, rates)` (LBP returns millions), `fmt(value, code, kind)`, `available(code, rates)`, `validRates(json)`. Tests: pegs exact (40.466 OMR → 386.50 AED), LBP in millions, decimals per kind, unknown code falls back to OMR, invalid rates make EUR and LBP unavailable.

### Task 2: rates file and job
- Create `app/data/rates.json` (asOf, source, url, perUsd EUR and LBP), `scripts/update-rates.mjs` (export `parseRates(json)` returning `{ asOf, perUsd }` or null; main writes only on a valid parse), `tests/update-rates.test.js`; modify `.github/workflows/daily-close.yml` to run it and commit either file. Tests: a good response, a failed `result`, EUR 2.0, LBP 5.

### Task 3: state and app wiring
- Modify `store.js` (`currency`, default `OMR`), `main.js` (load `rates.json`, `app.money` built from the state and rates, `setCurrency(code)`, `currency` event), tests in `tests/store.test.js`.

### Task 4: strings
- Modify `i18n.js`: currency names, unit words with agreement, per-gram units, board captions, the sheet title and lines, the back-to-rials line, the converted-price line. Tests for each unit's agreement.

### Task 5: header button, sheet and Today
- Modify `index.html`, `app.css`; create `app/js/ui/currency.js` (button label, sheet list with today's gram price per currency for the chosen karat, footer with the rate date and source link). Today: big price, unit, change line and board in the currency; price font shrinks past 7 characters; the back-to-rials line.

### Task 6: other views
- My gold totals, ranges, gains, piece values and past values; Outlook per-gram figures; the price check's converted line; the share image in the currency.

### Task 7: release plumbing
- `sw.js` precache (`js/money.js`, `js/ui/currency.js`, `data/rates.json`), VERSION `gold-today-v7`, build report.

### Task 8: verify, review, ship
- Browser at 360, 390, 430 px in both languages, in OMR, AED and LBP on all tabs and the share image; independent review; merge and push; check live.
