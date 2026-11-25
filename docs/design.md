# Gold Today (ذهب اليوم): design

Date: 2026-11-25. Status: draft for approval (revision 2, adds the chosen features N1 to N5 and N10 to N13, and the research results).

## 1. Intent

A phone web app for the owner, their mother and their aunt in Muscat. The two older women are not technical, read Arabic first, and own gold jewellery (mostly 21 and 22 karat). They want to know, at a glance and in plain words:

1. What gold is worth right now, per gram in Omani rials for each karat, and worldwide.
2. What their own gold would fetch if they sold it today, and what it has gained since they bought it.
3. Whether now is a cheap or expensive moment compared with this year (when to buy, when to sell), and why gold moved today.
4. Whether a shop's price or offer is fair, and where in Muscat to buy or sell.
5. What trusted forecasters expect in 1, 5 and 10 years, and how good forecasters have been.

It must look exceptionally good, feel alive (live prices, motion), and stay simple. The owner judged three rounds of mockups and chose the **Maison** direction, with clearer numerals than the first Bodoni version.

Reference mockup (working, live prices): `.superpowers/brainstorm/484-1795610974/content/directions-v2.html`, direction 1 "Maison". The build should match it, with the changes in this document.

## 2. Goals, non-goals, anti-goals

Goals
- One big live number first. Prices refresh every 10 seconds and visibly roll when they change.
- Arabic by default (right to left), English toggle, choice remembered.
- Works as an app on the phone: opens from a link, installs to the home screen, loads instantly on repeat visits, shows the last known price offline.
- Honest: every forecast names its source and date, estimates say they are estimates, reported figures say "as reported by".
- No accounts, no sign-up, no ads, nothing sent about the user anywhere.

Non-goals (owner did not pick these)
- Price alerts and push notifications (N6), read aloud (N7), text-size button (N8; default sizes are already large), zakat (N9), silver (N14), Dubai comparison (N15).
- Desktop layout (phone only; on a desktop it shows the phone layout centred).
- Charts with axes, indicators, candles or statistics.

Anti-goals (would be a failure even if it works)
- Looks like a trading app or a gold-rate table site.
- Any number the women cannot understand without explanation.
- A screen that needs scrolling to find the price.
- Inventing data: a forecast, shop or rule that cannot be traced to a source.

## 3. Constraints

- Phone only. Design for 390 x 844, must work from 360 x 740 up to 430 x 932.
- Free to run apart from the owner's Claude usage for the scheduled jobs (N11, N13). No paid APIs, no server to maintain.
- Live price source must allow browser calls without a key: `https://api.gold-api.com/price/XAU` (checked 2026-11-25: CORS `*`, no key, cached about 13 s, matched TradingView OANDA:XAUUSD within $4).
- The rial is pegged: 1 OMR = 2.6008 USD, so 1 USD = 0.3845 OMR (Central Bank of Oman fixed-peg page). Stored as one constant.
- Older users: body text 16 px or larger, key numbers very large, contrast 4.5:1 or better (7:1 for body text), tap targets 48 px or larger, every animation has a reduced-motion alternative.

## 4. Approaches considered

How it is hosted and how data stays fresh:

| | Approach | Trade-off | Verdict |
|---|---|---|---|
| A1 | Static web app (PWA) on GitHub Pages. Live price from the browser. A scheduled GitHub Action commits daily closes. Scheduled Claude routines write the daily "why gold moved" line and the monthly forecasts | Free hosting, no server, data never goes stale. Needs a free GitHub account and a one-time setup | **Chosen** (pending the owner's hosting answer) |
| A2 | Static site on Netlify or Cloudflare Pages with data baked in at build time | Simplest start, but history, "why it moved" and forecasts go stale unless someone redeploys | Rejected |
| A3 | Claude artifact link | Easiest to publish, but artifact pages cannot call outside price feeds, so no live prices for the family | Rejected |

How it looks (owner's choice after three rounds):
- Round 1: velvet green with gradient gold text, teal Omani arch, maroon story cards. All rejected (colours, design, layout).
- Round 2: Maison (white, carnelian, jewellery photography), Lumière (white with a live 3D gold bar), Gold Leaf (whole screen brushed gold). **Maison chosen**, with a clearer numeral font.

## 5. Visual design (Maison)

Mood: a fine jeweller's window at midday. Bright white, deep carnelian (the red stone long set beside gold in Omani jewellery), real gold in photographs.

Colour tokens (OKLCH):
- `--bg` oklch(1 0 0), pure white
- `--ink` oklch(0.2 0.02 30), body text
- `--muted` oklch(0.45 0.02 30), secondary text (must stay 4.5:1 on white)
- `--car` oklch(0.47 0.15 30), carnelian: selection, live dot, active tab, links, primary buttons
- `--car-d` oklch(0.4 0.13 29), carnelian text on white
- `--hair` oklch(0.9 0.012 30), hairlines
- `--surface` oklch(0.975 0.006 30), tip panels, input fields, sheets
- Gains and losses use ink with an arrow and the word ("up", "down"), never red and green alone.

Type:
- Numbers and English headings: **Source Serif 4** (semibold 600 for the hero price, opsz about 28; 500 to 600 elsewhere), lining tabular figures. Replaces Bodoni Moda, which the owner found hard to read.
- Arabic headings and the "compared with this year" sentence: **Amiri** 700/400.
- All other text, both scripts: **Almarai**.
- Digits are Western (0-9) in both languages, as on Omani shop price boards.

Imagery (Unsplash, free licence, verified to load):
- Today hero: `photo-1690175867343-2af70ea57537` (gold bangles, red cloth, carved wooden box).
- My gold band: `photo-1611107683227-e9060eccd846` (stacked bangles on white).
- Buy & sell band: `photo-1697380582263-ba9f5ef8cefa` (gold shop window).

Motion (all with reduced-motion fallbacks):
- Hero photo: very slow zoom (about 26 s, scale 1 to 1.09) and a soft light sheen passing every 9 s.
- Price: odometer roll per digit when the value changes (1.2 s, ease-out expo). A changed price never flashes.
- Karat selector: carnelian underline glides to the chosen karat. Price board rows highlight the chosen karat.
- "Compared with this year" dot slides to its position on load.
- Forecast chart unrolls from left to right when the tab opens.
- Tab change: 0.4 s fade and 10 px rise. Bottom sheets (add piece, sources) slide up 0.35 s.
- Calculator results count up to their value when inputs change.

Layout and components follow the mockup: white header with wordmark (Amiri in Arabic, Source Serif italic in English), a share icon and a text link for the other language; bottom tab bar with four line icons; hairline separators instead of cards; corner radius 12 px for the few panels; bottom sheets (native `<dialog>`) for adding a piece and for forecast sources.

## 6. Screens

Bottom tabs: Today, My gold, Future, Buy & sell (اليوم، ذهبي، المستقبل، بيع وشراء).

**Today**
- Header: wordmark, share icon (N5), language link.
- Hero photo.
- "Gold price per gram, now", the live price for the selected karat, "rials". Karat selector 24 / 22 / 21 / 18 (default 22, remembered).
- Live line: pulsing dot, "updated N seconds ago". If the feed is older than 15 minutes on a weekday: "prices are delayed". During the weekend close: "market closed for the weekend, last price from Friday".
- Change line: "0.903 rials less than yesterday".
- Why gold moved today (N11): one plain sentence with the date and source name, for example "Gold fell as traders expect US interest rates to rise (Reuters, 25 Nov)". Hidden when older than 3 days.
- Compared with this year: one sentence, a hairline track with a carnelian dot between "cheapest this year" and "highest this year", and one hint line about buying and selling.
- Price board (N1), set like a shop board: rows 24K, 22K, 21K, 18K; columns 1 gram, 10 grams, 1 tola. Tapping a row selects that karat above. Under it: "Shops sell jewellery for more than this: making charges and 5% VAT are added."
- Button: "Share today's prices" (N5).
- Small: world price in dollars per ounce. Footer: "A general guide, not financial advice".

**My gold** (with N4)
- Photo band, title.
- Total: "If sold today, it is worth about" + one big number + "between A and B rials, depending on the shop".
- Pieces list: each row shows its name (optional, for example "Wedding bangles"), grams, karat and value today. If a bought price is saved: "Bought for 3,200 rials in March 2019, now up 1,190 rials (37%)".
- "Add a piece" opens a sheet: name, grams (decimals allowed), karat, bought price (optional), bought month and year (optional). Each row can be edited or removed.
- First visit: an empty state that invites them to add their first piece, with a one-line example.
- Note: shops usually pay a little under the gold value and each sets its final price. Making charges and VAT are normally not paid back.

**Future** (with N12)
- Title "What experts expect", subtitle for the selected karat.
- Chart: past 5 years (solid ink line, log scale) joining today's dot, then the future 10 years as a carnelian dotted middle line inside a soft band (low to high). Labels only: "5 years ago", "Today", "In 10 years".
- Three rows: In 1 year, In 5 years, In 10 years, each with the expected price per gram for the selected karat.
- Under the 1-year row: "Middle of N bank forecasts, as reported" and a "Sources" button that opens a sheet listing each source, its target in $/oz, its date and who reported it.
- Under the 5 and 10-year rows: "Based on how gold has moved over past 5 and 10-year periods since 1971" with the low and high figures.
- How good are forecasts? (N12): the last two LBMA forecast-survey winners with their forecast, the actual average and the miss, and one line comparing the analysts' average forecast for 2026 with this year's average so far. Closing line: "Even the best forecasters often miss by 10 to 15%, so treat forecasts as a rough guide."
- "Forecasts updated on <date>".

**Buy & sell** (replaces Shops; with N2, N3, N10)
- Photo band, title.
- What should this piece cost? (N2): weight, karat, making charge (rials per gram or percent), and the shop's gold rate per gram (prefilled with today's market rate, editable to match the shop's board). Shows gold value, making charge, VAT 5% and the total. Note: "Making charges and VAT are normally not paid back when you sell."
- Is this offer fair? (N3): weight, karat and the shop's offer. Shows today's gold value and how far below it the offer is, with plain guidance (see 7.10).
- Places in Muscat: the verified list (7.12), each with name, area, one line, and a Map link (Google Maps search URL).
- Karat and hallmark guide (N10): 24K = 999 or 999.9 (pure), 22K = 916 (91.6%), 21K = 875 (87.5%), 18K = 750 (75%); where to find the stamp; why 22K and 21K are common for jewellery.
- Tips: bring the receipt, check the stamp, compare two shops before selling, ask for any deduction in writing.

## 7. Data and logic

7.1 Live price. Poll `api.gold-api.com/price/XAU` every 10 s while the page is visible, pause when hidden, back off to 60 s after 3 failures. Keep the last good price and its time in localStorage and show it at once on open.

7.2 Price per gram. `usd_per_oz / 31.1034768 * 0.3845 * karat / 24`, shown with 3 decimals (baisa) for the hero, 3 on the board's 1-gram column, 2 elsewhere, 0 for totals.

7.3 History. `data/history.json` holds daily closes (USD/oz) for the last 400 days and monthly closes back to 1971. Seeded once by hand at build time. A daily GitHub Action samples the live feed at 21:00 UTC and appends the close. The page appends today's live price in memory.

7.4 "Compared with this year". Share of the last 365 daily closes below today's price:
- under 10%: "cheaper than on almost any day this year"
- 10 to 35%: "cheaper than on most days this year"
- 35 to 65%: "close to its average for this year"
- 65 to 90%: "more expensive than on most days this year"
- over 90%: "more expensive than on almost any day this year"
Hint lines: cheap tiers say buying is favourable and selling paid more earlier; the middle tier says it is an ordinary moment; expensive tiers say selling is favourable and buying costs more than usual. The dot sits at the same share along the track.

7.5 Forecasts (`data/forecasts.json`).
- 1 year: the median of named targets for about 12 months ahead published in the last 120 days, each with institution, target, horizon, publish date, reporting outlet and URL, marked "as reported" when not taken from the bank's own note.
- 5 and 10 years: the 10th, 50th and 90th percentiles of annualised returns over all rolling 5 and 10-year windows since 1971, applied to today's price (low, middle, high). No named long-range forecasts (none credible were found).
- Report card data: LBMA survey winners and the 2026 survey average (from 8). This year's average so far is computed from `history.json`.
- The file stores its as-of date. Targets in $/oz are converted with the live formula.

7.6 Sell estimate. `value = grams * price_per_gram(karat)`. The estimate is `value * (1 - d)` for a deduction range `d_low..d_high`, default 2% to 6%, labelled as an estimate (no Omani source publishes buy-back deductions). "About" shows the middle.

7.7 Bought-price tracker (N4). Gain = today's estimate middle minus the bought price. Shown in rials and percent with the word "up" or "down". If only some pieces have a bought price, the total gain covers only those pieces and says so.

7.8 Price board (N1). Columns: 1 g, 10 g, 1 tola (11.6638 g). All from the live price.

7.9 Piece cost (N2). `gold = grams * rate` (rate prefilled from 7.2, editable); `making = grams * charge` or `gold * percent`; `vat = 5% * (gold + making)`; `total = gold + making + vat`.

7.10 Offer check (N3). `gap = (value - offer) / value` with value from 7.2. Up to 3% below: "close to the gold value". 3 to 7%: "a little low; another shop may offer more". More than 7%: "well below today's gold value; compare with another shop". Above the value: "above today's gold value". Labelled as guidance.

7.11 Why gold moved (N11). `data/why.json` holds `{date, ar, en, source, url}`. Written daily by a scheduled Claude routine (9) from reputable news, one neutral sentence per language, no advice.

7.12 Places (verified 2026-11-25, opening status to be rechecked before launch):
- Muttrah Gold Souq, Muttrah, by the Corniche: rows of gold shops, mostly 22K.
- Malabar Gold & Diamonds and Kalyan Jewellers, Lulu, Ruwi.
- Malabar Gold & Diamonds, Muscat City Centre (Seeb).
- Malabar Gold & Diamonds, Mall of Oman.
- Tanishq, The Oman Avenues Mall.
Seeb Souq and a "Ruwi gold market" from the mockup were not confirmed and are removed.

7.13 Share card (N5). Draw a 1080 x 1350 image on a canvas in the Maison style: title, Muscat, date and time, the four karats per gram, the world price, and the app link. Share it with the Web Share API (image plus text). If image sharing is not supported, open WhatsApp with the same text.

7.14 Storage. localStorage keys: language, selected karat, pieces, last price, dismissed tips. Nothing leaves the phone.

## 8. Research results (2026-11-25)

R1 Forecasts for about 12 months ahead, as reported by news outlets (the banks' own notes were not accessible):
| Institution | Target | Horizon | Reported |
|---|---|---|---|
| Goldman Sachs | $4,650 | end 2027 (cut from $4,800) | Investing.com via Yahoo Finance, 14 Nov 2026 |
| Morgan Stanley | $5,250 | Q4 2027 | investinglive, 17 Nov 2026 |
| UBS | $5,000 | Q4 2027 | investinglive, 24 Nov 2026 |
| Société Générale | $5,000 | end 2027 | investinglive, 24 Nov 2026 |
| J.P. Morgan | $4,500 | Q4 2027 | Phemex summary of PANews, 24 Nov 2026 |
| World Bank | $4,250 | 2027 average | search summary only, 28 Oct 2026 (verify or leave out) |
Middle of the five end-2027 targets: $5,000 (range $4,500 to $5,250). Bank of America gives no base case. Aggregator-only figures (Citi, HSBC, Standard Chartered, Commerzbank, Wells Fargo) are not used unless confirmed.

R2 LBMA forecast survey: 2024 winner Chantelle Schieven (Capitalight Research), forecast $2,170 against an actual average of $2,386.20. 2025 winner Keisuke (Bill) Okui (Sumitomo Corporation), forecast $2,925 against $3,431.54. The 2026 survey average was $4,741.97 (28 analysts, range $3,450 to $7,150).

R3 No credible named 5 or 10-year forecasts. Long-run data: freegoldapi.com (monthly from 1960, daily to 20 Feb 2026); the gap since then is filled from another free source at build time.

R4 Oman: peg 2.6008 USD per rial. VAT: jewellery 5%, investment gold zero-rated (the purity threshold is unconfirmed, so the app does not state one). No Omani source quantifies buy-back deductions; making charges are normally not recovered (Gulf News, UAE). The app says so and advises asking for any deduction in writing.

R5 Places: see 7.12.

Before launch: recheck forecasts and places, and replace "as reported" entries with primary sources where they become accessible.

## 9. Install, share, update

- PWA: manifest (name ذهب اليوم, short name, theme colour white, carnelian icon with a gold mark), service worker caching the app shell, fonts, images and the last data files.
- First-visit tip, in the right language, showing how to add it to the home screen on iPhone (Share, then Add to Home Screen) and on Android (menu, then Install app). Dismissable, shown once.
- Hosting: a public GitHub repository with Pages enabled.
- Updates: a GitHub Action (daily, 21:00 UTC) appends the daily close. A scheduled Claude routine runs daily at 21:30 UTC to write `data/why.json` (N11), and monthly on the 1st to refresh `data/forecasts.json` (N13), committing to the repository. Each run only touches its own data file. If a run fails, the app hides stale "why" lines and keeps showing the forecast date.
- Sharing: one link sent by WhatsApp.

## 10. Accessibility and quality

- Contrast checked for every text colour on white.
- Screen reader labels for the price ("39.397 rials per gram, 22 karat"), no live-region announcements every 10 s.
- `prefers-reduced-motion`: no zoom, no sheen, numbers change without rolling, chart appears without unrolling.
- Inputs use `inputmode="decimal"`, large fields, and accept both Western and Arabic-Indic digits.
- Performance budget: app code under 150 KB and fonts under 350 KB compressed; images counted separately; first paint under 2 s on 4G.
- Verified on 360 x 740, 390 x 844 and 430 x 932, in both languages, offline, and on a weekend (market closed).

## 11. Left to the builder

- File structure, build tooling (plain HTML/CSS/JS preferred, no framework needed), icon drawing, exact wording polish in both languages, the source used to fill the history gap, chart path smoothing, and the design of sheets and calculators within the Maison system.

## 12. Decisions after the builder review (designer's calls, owner can override)

- D1 History data. Only the last 365 days need daily closes. Seed them once, by hand, from a free source at build time; monthly closes since 1971 from an open long-run dataset, named in a small "Data sources" line on the Future tab. If the daily Action misses days, the change line hides when the latest close is more than 3 days old.
- D2 Thin data. Ship with what can be sourced: 3 verified places and 1 or 2 named forecasts are acceptable if labelled. Never pad with unverified items. At launch `forecasts.json` and `why.json` are written by hand.
- D3 Hosting paths. Repository name `gold-today`, served at `<user>.github.io/gold-today/`. All URLs relative so the manifest scope and service worker work at that base path and on any later custom domain. No custom domain at launch.
- D4 Images. Download the three Unsplash photos once, resize to 600 and 1200 px WebP, and serve them from the repository (works offline). Credit the photographers in the Data sources line.
- D5 Forecast maths. Bank targets in $/oz are converted with the same formula and peg as live prices. The 5 and 10-year values apply the percentile annual returns to today's price. The future line is drawn through today and the 1, 5 and 10-year points, straight on the log scale, dotted, inside the low to high band.
- D6 Fonts. Self-hosted, subset WOFF2: Source Serif 4 (600 and 500, plus 600 italic for the English wordmark; Latin and digits only), Amiri (400 and 700, Arabic), Almarai (400, 700, 800, Arabic and basic Latin).
- D7 Time. Daily close is the price at 21:00 UTC. The market-closed message shows from Friday 21:00 UTC to Sunday 22:00 UTC (Saturday 1:00 to Monday 2:00 in Muscat). "Yesterday" means the latest stored close before today's session.
- D8 My gold model. A list of up to 20 pieces, each with optional name, grams (0.1 to 5,000, decimals allowed), karat, optional bought price and optional bought month and year. The headline is the total sell estimate; the deduction range applies per piece and is summed.
- D9 Wording. The builder drafts both languages using neutral Arabic forms (no gendered "you" verbs). The owner reviews the Arabic before the link is sent to the family.
