# Gold Today: decision helpers and display currency (design, revision 3, 2026-11-26)

## 1. Intent

The owner called the Future tab their least favourite page. They want the app to help the family decide when buying or selling gold, including as an investment. They also want to view prices in five currencies, while shopping stays in Oman.

On revision 2 the owner said the buying calculator and the new Future sections were confusing. It was not clear when to use them, how to use them, or how they help, and the owner's mother and aunt would not use them as they were. Revision 3 rebuilds them around the family's own questions and the moments when they ask them.

The family are older, non-technical, read Arabic first, use phones, and act on what the app says. Everything states facts in plain words and never reads as advice (`gold-today-quality-bar`, PRODUCT.md).

## 2. Each tab answers one question

| Tab | The family's question | When they ask it |
|---|---|---|
| Today | What is gold worth now? | At home, any time |
| My gold | What is my gold worth, and what was it worth before? | At home |
| Outlook (renamed from Future: التوقعات) | Is the price high or low now, and will it go up? | Before deciding to buy or sell |
| Buy & sell | Is this shop's price or offer fair? Jewellery or a bar? | At the shop, or planning a purchase |

## 3. Self-critique of revision 2 (why it confused)

- P1. The buying calculator asked for the making charge (per gram or percent) and the shop's rate per gram. At the counter the family is usually told one price. Its title, "What should this piece cost?", asked them to work out a price instead of checking the one they were given.
- P2. Its results were four lines of rials to three decimals. The two answers that matter (how much of the price is not gold, and what a shop would pay back) came last or not at all.
- P3. "How much must gold rise to get the money back?" is an analyst's question. The family's question is "If I buy this, what do I lose?", and the answer is money: of every 100 rials, about 85 come back.
- P4. Too many numbers at once: three break-even blocks with bars and labels, four history rows with two percentages each, a five-row table. The Future page ran to about three and a half phone screens.
- P5. Buying facts sat on the Future tab, where nobody standing in a shop would look.
- P6. Nothing said when to use each part, and there was no way to try it before being in a shop.
- P7. Percentages everywhere. Money amounts and "out of 10" are easier.
- P8. "Gold must rise 17%" does not connect to the number the family watches on Today. A gram price does: "gold must reach 49.5 rials a gram (today 40.5)".

## 4. Principles

- The heading of each section is the family's question, in their words.
- One answer sentence first, with one number. Tables and fine print fold under "Show details".
- Money and "out of 10" before percentages.
- Each tool says in one line when to use it and what it gives, numbers its fields in the order they are asked, and can fill an example.
- Information sits where the decision happens: buying facts in Buy & sell, the price outlook in Future.
- Facts only. No buy, sell or wait advice.

## 5. Goals

Buy & sell:
- B1. "Before you buy: check the price" replaces "What should this piece cost?".
- B2. "Before you sell: check the offer" keeps its logic and gains a when line, numbered fields and an example.
- B3. "Jewellery or a bar?" shows, for every 100 rials paid, what a shop pays back the same day.

Future:
- F1. "Is the price high or low now?"
- F2. "Will it go up?"

My gold:
- D2. "What my gold was worth before."

Currency:
- C1. A currency button in the top bar, a list of five currencies, and a "Back to rials" link on Today.
- C2. Rates: OMR and AED pegged, EUR and LBP from a daily rates file.

Dropped from earlier revisions: the separate break-even section on Future (now B3 and B1), the four-row history block (now two rows plus details), "my gold at the bank targets" (reads as a promise), the separate calculator break-even line (now inside B1), and price alerts (D3, declined).

## 6. Buy & sell

Order: B1, B2, B3, then the places, the karat guide and the tips as now. B1 and B2 start with a line saying when to use them, in a muted caption above the title ("At the shop, before paying" / "When a shop offers to buy").

### 6.1 B1: check the price

- Title: "هل هذا السعر معتاد؟ / Is this a normal price?" (not "fair" or "reasonable", which are judgements).
- Intro: "يبيّن كم من السعر ثمن الذهب نفسه، وكم يدفع المحل لو بيعت القطعة اليوم. / Shows how much of the price is the gold itself, and what a shop would pay if the piece were sold today."
- Fields, numbered: 1 weight in grams, 2 karat, 3 "the full price the shop asks, with VAT, in rials". A button "Show an example" fills 20 g, 22 karat and 950.000 rials. When karat 24 is chosen, a two-way switch appears under the karats: "قطعة / سبيكة أو عملة" (piece / bar or coin), default bar or coin.
- A link under field 3, "The shop gave a rate per gram and a making charge?", reveals the two inputs of the old calculator (rate per gram prefilled with today's market rate, making per gram or percent). Price = (rate x grams + making) x 1.05, then the same results. This keeps the old route without showing it to everyone.

Logic, `priceCheck({ grams, karat, price }, usdPerOz)` in `calc.js`:
- `rate = gramPrice(usd, karat)`, `gold = grams x rate`, `extra = price - gold`, `extraPct = extra / gold`.
- Bar or coin (karat 24 with the switch on bar): usual band 2% to 14% (small-bar premiums of 2% to 9%, plus 5% VAT if the shop charges it; 6.4), shop deduction 1%. Otherwise the usual band for plain pieces is making 3 to 6 rials a gram with VAT 5% on the whole price (the law, 6.4): `((rate + 3) x 1.05) / rate - 1` to `((rate + 6) x 1.05) / rate - 1`, 13% to 21% for 22 karat today. The deduction is 4%.
- `back = gold x (1 - deduction)`, `target = price / (grams x (1 - deduction))`, the gram price gold must reach for a sale to return the price.
- `price < gold`: no band and no target. The answer says the price is below today's gold value and that the weight and karat are worth checking.

Results, in this order, on one tinted panel:
1. "The gold in this piece today: 810 rials."
2. "The shop asks on top: 140 rials", then "That is 17% on top of the gold, for the making, the VAT and the shop's profit." (The percentage sits in the sentence, not in brackets, so its direction never flips in Arabic.) A track like Today's year line starts at "No extra" (no end label; it runs to 35%), with the usual band shaded and a dot at this price. Under it a short bold verdict, one of: "Within the usual range for plain pieces in Muscat." / "Less than usual for plain pieces." / "More than usual for plain pieces. Detailed designs and brands usually cost more." / for a bar or coin: "Within the usual range for small bars and coins." Then the range on its own line: "Usual: 13% to 21% on top of the gold." (bars: "Usual: 2% to 14%."). Then the basis in muted text: "An estimate from making charges of 3 to 6 rials a gram, plus 5% VAT on the whole price as the law sets. Shops differ." (bars: "Small-bar premiums of 2% to 9%, plus 5% VAT if the shop charges it.")
3. "If sold back today, a shop would pay about 778 rials", then "That is about 82 of every 100 rials paid." (the same measure as B3).
4. "To get the 950 rials back when selling, gold would have to reach about 49.5 rials a gram for 22 karat (today 40.5)."
5. When the display currency is not rials, one line with the price converted.

Edge cases: a price under the gold value shows only items 1 and 3 and the sentence "The price is below today's gold value. The weight and karat are worth checking." Without a live price the gold value uses the last known price and says so ("using the last price, from <time>"). Fields reject a weight outside 0.1 to 5,000 grams and a price of 0 or above 1,000,000 rials with the existing error style. Arabic-Indic digits are read as today (`parseNumber`).

### 6.2 B2: check the offer

Unchanged logic (`offerCheck`). Title "هل هذا العرض معتاد؟ / Is this a normal offer?". Adds the when caption, numbered fields, and "Show an example" (20 g, 22 karat, offer 780.000 rials).

### 6.3 B3: jewellery or a bar?

- Heading: "Jewellery or a bar?" Intro: "For every 100 rials paid, a shop would pay back about this much the same day:"
- Three rows, each with the label and the amount on one line (the number right beside the label) and a bar drawn to scale under it: a small 24 karat bar, about 90 to 94 (with or without VAT, 6.4; solid to the lower figure, lighter to the higher). A plain piece (making 3 rials a gram), about 85. A detailed piece (making 6 rials a gram), about 80. Worked out live from today's 22 karat price.
- One sentence: "The difference is the making charge and VAT, which shops do not pay back. So jewellery needs a bigger rise in the gold price before it returns what was paid."
- A tinted line: "This counts only the money that comes back, not wearing or giving the piece."
- Fine print: the jewellery and bar assumptions said separately, and that the bar figures come from dealer prices outside Oman and are not checked for Muscat.

### 6.4 Assumptions (in `config.js`, named in the page text; checked 2026-11-26)

- Making charges: Muscat sources quote 22 karat making per gram, commonly OMR 3 to 6 for standard pieces, up to about 10 for fine work, as low as 1.5 for plain chains.
- Small bars: premium about 5% over gold value for 10 grams (global dealer data shows 4 to 9%; no Muscat source found), no VAT (Oman's VAT law zero-rates investment gold), bought back about 1% under gold value.
- Shop deduction when selling jewellery: 4%, the middle of the 2 to 6% that My gold and B2 use.
- VAT, settled by the law (owner asked 2026-11-26 to apply it):
  - Gold jewellery: 5% on the full price, gold and making together. The VAT Law (Royal Decree 121/2020, in force 16 April 2021) and its Executive Regulations (Tax Authority Decision 53/2021) have no special rule for jewellery: the regulations mention gold only in Article 88, and the profit-margin scheme is for approved dealers' used goods. The Tax Authority's own example (official account, reported by Shabiba, 31 March 2021) puts 5% on the total: 1,000 rials of gold purchases become 1,050. The commercial claims of "VAT on the making charge only" have no legal basis. So B1's usual band is making 3 to 6 rials a gram with VAT on the whole price (13% to 21% for 22 karat today), and B3's jewellery figures are about 85 and 80.
  - Investment gold (bars and coins of at least 99% purity, tradable on world markets): the Law zero-rates it (Article 51, item 3, "in accordance with the limits, conditions and circumstances determined by the Regulations"), but Regulation Article 88 applies the zero rate to "the first supply after extraction". A shop's sale to a consumer is a later supply, so on the literal text it is not covered, yet bars are reported to be sold without VAT in Muscat (Connsect, April 2025). The app therefore shows bars both ways: B3 "about 90 to 94" and B1's bar band 2% to 14% (to 9% without VAT, to 14% with it), and the existing calculator hint stays "usually VAT-free".

## 7. Future

The tab is renamed "التوقعات / Outlook" (the QA review found that "Future", a page titled "Before you buy or sell" and Buy & sell's "before paying" were hard to tell apart). The icon stays. Title "توقعات سعر الذهب / Gold price outlook". Subtitle names the karat. The karat selector stays, shared with Today. Two sections, each a question.

### 7.1 F1: is the price high or low now?

- Answer line, large, in ink (not burgundy, which reads as bad news): "أقل بـ 34% من أعلى سعر وصل إليه / 34% below its highest ever".
- Recent moves, so someone who heard "gold dropped" sees it: "آخر أسبوع: أقل بـ 4% / Past week: down 4%" and "آخر شهر: أقل بـ 11% / Past month: down 11%", from the daily closes on or before 7 and 30 days ago.
- Then Today's 12-month sentence (the same `mood0` to `mood4` text as Today).
- Chart: the last 60 monthly closes plus today, linear scale, an open marker at the record with its value, a dot for today with its value, x label "5 years ago". No forecasts on the chart.
- Rows: "Today" and "Highest ever (date)" per gram.
- A tinted line, always shown, with every completed fall (not only the deep ones, which the QA review found selective and frightening). While today is 20% or more under the record it starts "Before this fall,": "قبل الهبوط الحالي، هبط الذهب منذ 1971 بـ 20% أو أكثر 5 مرات، وعاد إلى أعلى سعره بعد 6 أشهر و18 شهراً و4 سنوات و9 سنوات و26 سنة. أطول انتظار جاء بعد أعمق هبوط، في 1980. / Before this fall, gold fell 20% or more 5 times since 1971. It got back to its highest after 6 months, 18 months, 4 years, 9 years and 26 years. The longest wait followed the deepest fall, in 1980." Durations shortest first, each with its own unit. Within 1% of the record the answer reads "At its highest ever".
- "Show details": every fall of 20% or more since 1971 (year, how far, how long to recover).

### 7.2 F2: will it go up?

- Answer line, large: "لا أحد يعرف. / No one knows."
- History, two rows of ten dots: "بعد سنة: ارتفع في 6 حالات من كل 10 / After 1 year: higher in 6 cases out of 10" and "بعد 10 سنوات: ارتفع في 8 حالات من كل 10". ("أعلى 6 مرات" was dropped: it reads as "six times higher".) Under them: "Since 1971, starting from every month."
- A tinted line: "أسوأ 10 سنوات منذ 1971: من اشترى في يوليو 1980 وجد السعر أقل بـ 44% بعد 10 سنوات. / The worst 10 years since 1971: buying in July 1980 meant a price 44% lower 10 years later." The month is the worst window's own start (the January 1980 peak gave -39%, so "at the peak" would be false).
- Banks, kept short: "4 banks expect 52.7 to 59.5 rials a gram by the end of 2027 (today 40.5). Forecasts are not a promise, and they miss both ways."
- "Show details": the 1, 5, 10 and 20-year rows with the usual and worst result, then "The periods overlap, and the data starts in 1971, when gold's price stopped being fixed."; then the misses ("The best forecast for 2024 was 9% too low, and for 2025 15% too low. The forecast for 2026 is 7% above the year so far.", from the LBMA winners and survey in `forecasts.json`); the bank list with names and values; the sources link.
- Note: "In dollar prices before inflation. Not a forecast."
- Footer as now: forecasts updated date, data sources (adds ExchangeRate-API).

### 7.3 Logic (`insights.js`, pure functions)

- `recordHigh(history, liveUsd)`: highest of the daily closes, the monthly closes and the live price, with its date and whether the date is a day or a month.
- `pastFalls(monthly, threshold = 0.2)`: completed episodes since 1971-01 where the close fell at least 20% under its running peak and later regained it: peak year, depth, months to regain. Today's data: 1973 21% 6 months, 1974 40% 43 months, 1980 62% 316 months, 2008 21% 18 months, 2011 39% 106 months.
- The current fall is judged from `recordHigh` and today's price, so the page uses one record and one percentage.
- `higherOdds(monthly, years)`: share of monthly start points since 1971-01 higher `years` later, the middle change and the worst change with its start year. Today's data: 1 year 61% (+6%, worst -36% from 1980), 5 years 70% (+35%, -55%), 10 years 76% (+57%, -44%), 20 years 88% (+222%, -59%).
- Durations under 2 years in months, otherwise whole years, with Arabic agreement.

## 8. My gold: what my gold was worth before (D2)

Under the total and the gain lines, a block "What my gold was worth before":
- "Highest in the last 12 months: 7,074 rials (28 January)"
- "Lowest in the last 12 months: 4,619 rials (20 November)"
- "5 years ago: 2,378 rials", "10 years ago: 1,617 rials"
- Note: "The same pieces at those days' prices."
Each value is `sellEstimate(pieces, close).mid`, matching the headline. The 12-month values come from the daily closes of the last 365 days, the others from monthly closes. Rows without data hide. The block hides with no pieces or no price.

## 9. Display currency (C1, C2)

Prices you look at follow the chosen currency. Amounts you type, and the shop tools built on them, stay in rials.

| Place | Follows the currency |
|---|---|
| Today: big price, change line, price board | yes |
| Today: world price per ounce | no, always dollars |
| My gold: totals, ranges, gains, piece values, past values | yes |
| My gold: price paid (typed) | no, rials, and the label says so |
| Future: every per-gram figure | yes |
| Future: bank targets per ounce, forecast track record | no, dollars as published |
| Buy & sell: inputs and results | no, rials, plus one converted line under B1's results when the currency is not rials |
| B3 "for every 100" | the unit word follows the currency |
| Shared price image | yes |

- Rates: `config.js` holds `CURRENCIES = ['OMR', 'AED', 'USD', 'EUR', 'LBP']` and pegs per dollar `{ USD: 1, OMR: 0.3845, AED: 3.6725 }`. `app/data/rates.json` holds `{ asOf, source, url, perUsd: { EUR, LBP } }`, committed with today's values. `scripts/update-rates.mjs` reads `https://open.er-api.com/v6/latest/USD` (checked: CORS open, OMR 0.384497, AED 3.6725, LBP 89,500, EUR 0.91245) and writes only when `result` is `success`, EUR is 0.5 to 1.5 and LBP 10,000 to 1,000,000; otherwise it logs and exits 0. `daily-close.yml` runs it after `append-close.mjs` and commits when either file changed. Missing or invalid rates: EUR and LBP show as unavailable and a saved EUR or LBP choice displays rials. Stale rates stay in use; the sheet shows their date. The sheet and the Future data line name and link ExchangeRate-API.
- All amounts are worked out in rials and converted at today's rate, so past figures show in today's exchange rate (exact for the pegged currencies). The sheet says so in one line.
- Formatting kinds: gram (Today, board, change line, sheet, share image) OMR 3, AED 2, USD 2, EUR 2, LBP 3 in millions. Short (Future per gram) OMR 1, AED 0, USD 1, EUR 1, LBP 2. Total (sums) OMR 0, AED 0, USD 0, EUR 0, LBP 1. Rials keep today's decimals. Today's big price shrinks past 7 characters.
- Arabic units: ريال (ريالات, ريالاً, ريال), درهم (دراهم, درهماً, درهم), دولار (دولارات, دولاراً, دولار), يورو (invariable), مليون ليرة (ملايين ليرة, مليون ليرة, مليون ليرة). English: rials, dirhams, dollars, euros, million pounds.
- The control: a text button with the currency (Arabic word, English code) and a chevron, 48px, beside the language link. A bottom sheet titled "Currency" lists the five with today's gram price for the chosen karat. Choosing applies and closes. Footer: "Buying, selling and the calculators always use Omani rials", the peg and rate-date line, and "Pounds show in millions: 9.427 million means 9,427,000 pounds". On Today, when the currency is not rials, a muted line under the status names it with a "Back to rials" link. `state.currency` defaults to `OMR` and falls back to it for unknown values; a `currency` event re-renders every view and the share card.

## 10. Files

- New: `app/js/money.js`, `app/js/insights.js`, `app/data/rates.json`, `scripts/update-rates.mjs`, tests for each.
- Changed: `config.js`, `store.js`, `i18n.js`, `main.js`, `calc.js` (`priceCheck`), `index.html`, `app.css`, `views/today.js`, `views/mygold.js`, `views/future.js`, `views/buysell.js`, `ui/share.js`, `ui/chart.js`, `sw.js` (precache, VERSION `gold-today-v6`), `.github/workflows/daily-close.yml`.
- `forecast.js` keeps `median`, `percentile`, `validateForecastFile` and `surveyComparison`. The 5 and 10-year band code and its tests go.

## 11. Testing and QA

- Test first: `money.js` (pegs, conversion, LBP in millions, decimals per kind, missing rates), `insights.js` (record from daily vs monthly vs live, falls with a current episode, odds with usual and worst, years-ago lookup), `calc.js` (`priceCheck`: band for 22 and 24 karat, price below gold value, target price), store (currency), i18n (units per currency, durations), update-rates (good response, bad values keep the file).
- Browser check at 360, 390 and 430 px in Arabic and English, in OMR, AED and LBP, on all four tabs, the sheets and the share image. Open and closed "Show details".
- An independent review of the design and pictures before building, and of the built app before release.

## 12. Calls made by the designer (owner can override)

- The Future tab becomes "التوقعات / Outlook" (changed after the QA review).
- LBP shows in millions, with "million Lebanese pounds" as the unit on Today.
- Karat 24 in B1 offers a piece or bar switch, defaulting to bar.
- VAT follows the law: 5% on the full price of jewellery (B1 band 13% to 21% for 22 karat today; B3 85 and 80). Bars are shown with and without VAT because the regulation's wording and reported practice differ.
- The shared price image follows the chosen currency.
- My gold shows amounts in the chosen currency. The price paid stays typed in rials.
- Two releases: Future, Buy & sell and My gold first, then the currency switch.

## 13. Revision history

- Revision 1: F1 to F4, C1, C2, D1, D2 as first approved.
- Revision 2: facts before forecasts (R1), no personal figure at bank targets (R2), checked Muscat making charges and bar premiums (R3), usual and worst results, Back to rials, the 12-month range.
- Revision 3: rebuilt around the family's questions after the owner found revision 2 confusing (section 3). Buying facts moved to Buy & sell; the calculator now checks the price the shop asks; Future reduced to two questions with details folded.
- Revision 3.1: an independent QA review recomputed every figure (all matched) and found 3 blockers, 9 major and 9 minor issues, mostly wording and honesty. Fixed: the VAT-dependent band (now both readings, with its basis shown), the Arabic "six times higher" misreading, the selective falls line, "worst case" overclaim, one-sided forecast misses, the tab name, recent moves for "gold dropped", the one-sided jewellery-or-bar comparison, "82 of every 100" in B1, the 24 karat piece or bar switch, judgement words in titles, number units, and the B3 layout. A second QA pass confirmed the fixes (ratings B1 8, B2 8, B3 7, F1 8, F2 6, D2 8, C1 7, up from 7, 8, 6, 6, 4, 8, 6) and found four small issues, all fixed after it: B3's VAT figures now cover both readings like B1, B1's range sits on its own line, the falls line says "Before this fall" and "the longest wait followed the deepest fall", and the unexplained 35% track label is gone. The forecast misses moved into the details to shorten F2. Not taken: changing "810 ريالات" to "ريالاً" (the counted noun follows the last part of the number, 10, so the plural is right, and the app's QA36 rule already does this) and showing LBP as full numbers (they do not fit the board; the unit now names the pound).

Sources checked for 6.4: [goldrateoman.com](https://goldrateoman.com/22k-vs-24k-gold-in-oman/), [oman.arablocal.com](https://oman.arablocal.com/gold-rates), [goldrateuae.live](https://goldrateuae.live/malabar-gold-rate-oman/), [MetalsRadar](https://metalsradar.com/en/blog/gold-premium-over-spot/), [FindBullionPrices](https://findbullionprices.com/p/10-Gram-Gold-Bar-Random-Manufacturer/), [KPMG Oman VAT summary](https://assets.kpmg.com/content/dam/kpmg/om/pdf-2020/10/summary-of-the-key-provisions-of-the-oman-vat.pdf), [Aviaan](https://aviaanaccounting.com/what-is-the-vat-impact-on-precious-metals-sector-in-oman/).
