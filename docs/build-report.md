# Gold Today build report

Date: 2026-11-25. Branch: main. Tests: 68 passing (npm test). Code 41 KB compressed (limit 150 KB), fonts 225 KB (limit 350 KB).

## The bangles crop, the daily close and the news job (2026-11-28)
Tests: 151 passing. Offline cache v18.
- **Photo crop:** the Buy & sell band is 3:1 and shows half of the 3:2 photo's height. The centred crop cut off the tops of the bangles (the owner's screenshot, 2026-11-28). The band now frames the photo from 35% down (`object-position: 50% 35%`), so the bangles sit inside it with dark space above and the start of their reflection below. Measured on screenshots at 360, 390 and 430 px in Arabic and English: on the live site before the fix, gold touched the band's top row in all six. After it, the gold starts 14.5 to 17.5 px below the top.
- **Daily close:** GitHub has started every scheduled run of daily-close.yml about six hours late since 2026-11-26 (03:15 to 03:45 UTC). The script saved a close only in the hour after 21:00 UTC, so nothing was saved after 25 Nov. Now each run saves every weekday of the past week that has no close, gaps included, so a day that failed once is tried again. An on-time run still reads the live feed, and only when the feed's own time is on that day. A late run reads the 21:00 UTC price from Dukascopy's free minute bars for spot gold (bid side, the last traded minute before 21:00), and only after that UTC day has ended. After an early close, as on 27 Nov at 19:44 UTC, that last minute still holds the price. A day without trading saves nothing. A file that is not a whole day (1440 bars) is refused. Dukascopy refuses Node's default user agent (HTTP 429), so the script sends its own. The closes that could be read are always committed. If another close is more than two days overdue, a last step then fails the job, so GitHub e-mails the owner. Two runs can no longer overlap. A change to the script runs the job at once. Cross-check: Dukascopy gives 3574.64 for 25 Nov, against the 3574 set by hand from OANDA. The two feeds can differ by about $4 (0.1%). A local run saved 26 Nov = 3566.13 and 27 Nov = 3653.94. Dukascopy sometimes times out from here, and the next run then tries again.
- **Independent review of the close job:** no critical findings. Fixed, each with a test that failed first: a failing run no longer throws away the closes it read or skips the rates update; a day that failed is retried and a lasting 404 raises the alarm; a partial file can no longer give a close; the tests now give open, close, low and high different values, and cover the whole run with stand-ins (live feed or Dukascopy, 404, error, partial file, holiday, overdue). Also done from the minor findings: the runs cannot overlap, and the live feed has a timeout and a date check.
- **News job:** the routine works. On 26 Nov it rightly changed nothing (US Thanksgiving, no confirmed close). On 27 Nov it wrote a correct line from Kitco, but GitHub refused the push (HTTP 403): Claude's GitHub app has no write access to bassamsketch/gold-today. Only the owner can grant that, by installing the Claude GitHub app for the repository. The routine's prompt now says the close is usually missing at 22:05 UTC. It also forbids trailer lines in its commits, warns that WebSearch refuses some news domains, and stops on a 403 instead of retrying.
- **Weekend change line:** with Friday's close saved, the Today tab on Saturday read "↓ 0.045 rials less than yesterday". It was comparing Friday's frozen price with Friday's own close from the other feed. The price feed keeps moving its time on through the weekend, so the app took Saturday for a new trading day. A weekend price time now stands for Friday's last trading minute, so the line shows Friday's move against Thursday ("↑ 0.907 rials more than on Thursday" for 21 karat). Sunday after the 23:00 UTC reopening compares with Friday as before.
- **GitHub's own run:** the push started the close job on GitHub. It read 26 Nov from Dukascopy (3566.13) and committed it, which proves the source works from GitHub's machines. The 27 Nov file timed out there, so the same script was run here and its close (3653.94) committed.
- **Not verified:** a news push, until the owner grants access.

## A one-tap Install button (2026-11-27)
Tests: 138 passing. Offline cache v16. The owner could not find Chrome's install option. Chrome 150 for Android (rolled out from July 2026) renamed "Add to Home screen" to "Install and create shortcut" and moved it lower in the menu. The app's tip still said "Install app" and "three dots at the top". The install tip now carries a button, "تثبيت التطبيق", that opens the browser's own install box (Chrome, Samsung Internet and Edge). One line above it names the second tap: "بعد الضغط على الزر أدناه تظهر نافذة صغيرة، والضغط فيها على «تثبيت» يُكمل الإضافة."
- **When it opens:** on Android, only once the browser makes its offer. Chrome waits for a first tap and about 30 seconds on a first visit, so the first thing shown is the button, never the menu hunt. iPhones keep the Safari steps after 3 seconds. Computers show the tip only from My gold's "How?". People who closed the old menu-steps tip see the button once (a new flag, tips.installApp).
- **The offer:** main.js catches the browser's offer, because in testing it came 0.3 s after load, before the tip's code had loaded. It holds the offer back, so the browser's own banner does not appear beside the tip.
- **After the tap:** if accepted, the tip closes for good. If cancelled, the menu steps take the button's place. Once the app is installed, a note says "أيقونة «ذهب اليوم» الآن على الشاشة الرئيسية أو بين التطبيقات."
- **Wording:** the menu steps now read "في كروم: النقاط الثلاث ⋮ بجانب شريط العنوان، ثم الخيار الذي فيه كلمة «تثبيت» أو «الشاشة الرئيسية»." The dismiss button is an outlined "إغلاق" everywhere, so it cannot be read as "OK, install". The filled burgundy button is the only action.
- **Independent review:** no critical findings. Fixed: if the browser reports "installed" before "accepted", the installed note now stays on screen. A redrawn tip no longer pulls focus. The tip waits while a box is being typed in or a sheet is open. The Arabic second-tap line no longer ends with an ambiguous "مرة أخرى". Kept as they are: the title and the button wording (both accurate), and the outlined Close (the same pattern as the app's other quiet buttons).
- **Checks:** 39 scripted checks in headless Edge at 360, 390 and 430 px in Arabic and English, including the browser's real offer. Not checked: the real install box on an Android phone.

## A classier Buy & sell photo (2026-11-27)
Offline cache v15. The owner found the crowded souq window "not classy". They compared five, then seven, candidates previewed in the band at phone size, then two full phone screens. They chose ornate 22 karat gold bangles on a dark, reflective surface, by Zayed Ahmed Zadu (@zayed_ahmed_zadu, Unsplash licence, photo wreS7kv_tLE). New file names (img/bangles-600.webp 600x400 at 52 KB, img/bangles-1200.webp 1200x800 at 159 KB, under the 160 KB budget) mean no cache can serve the old photo. The old shop-600/1200 files are removed. The band still shows the centre 3:1 strip, as previewed.

## The price check's verdict box (2026-11-26)
Tests: 131 passing. Offline cache v14. The owner asked for the price check to match the offer check. Its result now opens with the same burgundy box. The box names the price with an icon (سعر جيد ✓, سعر عادي =, سعر مرتفع !, سعر غير معتاد !) and gives the money ("ثمن الذهب في القطعة نحو 808 ريالات، والمحل يطلب فوقه 140 ريالاً."). It shows the usual extra for that piece in rials ("نحو 103 إلى 166 ريالاً", or the bar range for a 24 karat bar), and a tip in gold. Under it, a light card holds what a shop pays back and the reasons, folded. The verdict follows the whole rials shown, as in the offer check. Checked at 360 and 390 px in Arabic and English for all four verdicts and a bar. No overflow, no console errors.

## The offer verdict box, and the saving section removed (2026-11-26)
Tests: 129 passing. Offline cache v13.
- **Offer check:** the result is a burgundy box like the Outlook's answer. It shows the deal named with an icon (عرض ممتاز ✓, عرض جيد ✓, عرض عادي =, عرض منخفض !), the money ("قيمة الذهب اليوم نحو 808 ريالات، والعرض أقل منها بـ 120 ريالاً."), what shops usually take off this piece in rials ("بنحو 16 إلى 48 ريالاً"), and a tip in gold ("يُستحسن سؤال محل آخر قبل البيع."). The owner asked for suggestions, so the tips bring back the "ask another shop" line that the QA had removed as advice. The verdict now follows the whole rials shown (2-6% of the gold value, rounded), so it can never contradict them.
- **For saving: removed.** The owner asked what it was for and how it helps. Its one useful idea, how much of the price comes back on selling, is already in the price check's "لو بيعت اليوم، يدفع المحل نحو" row, for the piece in front of them. It did not reach the owner's 9/10 bar.
- **Checks:** browser at 360 and 390 px in Arabic and English for all four verdicts (gold value 808: 25 over is excellent, 8 under is good, 30 under is fair, 120 under is low). No overflow, no console errors.

## The price check has one path (2026-11-26)
Tests: 127 passing. Offline cache v12. The owner found the "rate per gram and making charge" route confusing ("I put numbers and nothing happens"). It only worked after a weight was typed in box 1, and it was a second, hidden way to give the price. It is removed: the check is weight, karat and the full price the shop asks. One line under box 3 reads: "إذا ذكر المحل سعر الجرام والمصنعية فقط، يمكن طلب السعر الكامل مع الضريبة." Checked at 360 and 390 px in Arabic and English: typing gives the answer, Clear and the example work, and the 24 karat bar or piece switch still works. No errors.

## Owner's review of the new screens (2026-11-26)
Tests: 126 passing. Offline cache v11.
- **Clear:** a separate "✕ مسح" button now stands beside "عرض مثال" whenever any box holds a number (the example's or typed), in both checks. The example button no longer changes its label. Clear empties the boxes, returns to the family's karat and leaves focus on the example button.
- **Outlook:** the answer ("أقل بـ 34% من أعلى سعر وصل إليه") and the past week and month sit together in an oxblood box like Today's news card. The week and month are two columns, each a gold label over a value ("آخر أسبوع" / "أقل بـ 4%").
- **For saving:** rebuilt as two plain amounts in rials: "If the gold price stays the same, selling gives back about this much of every 1,000 rials paid today: a small 24 karat bar 900 to 940 rials, 22 karat jewellery 800 to 850 rials", then one reason line. The assumptions and the note on wearing fold under "Show details". The bars, the per-100 framing and the always-open fine print are gone.
- **Checks:** browser at 360 and 390 px in Arabic and English: the box, Clear in both checks (it appears, empties the boxes and hides), and the saving card. No sideways overflow and no console errors.

## Buy & sell: the answer first (U1-U4, 2026-11-26)
The owner chose four of the eight recommendations in docs/qa-2026-11-26.md. Tests: 125 passing. Offline cache v10.
- **U1:** the price check's card opens with its answer in bold ("ضمن المعتاد للقطع البسيطة في مسقط."), then three amounts: the gold in the piece, the shop's extra, and what a shop pays back. The percentage, the usual range, the basis and "82 of every 100" fold under "Show details", which reads "Hide details" when open. The bar with the dot is gone.
- **U2:** the titles name the moment: "قبل الشراء: هل السعر معتاد؟", "قبل البيع: هل العرض معتاد؟" and, for uniformity, "للادخار: مشغولات أم سبيكة؟". The red lines above them are gone.
- **U3:** the offer check says its result in rials: "قيمة الذهب اليوم نحو 809 ريالات، والعرض أقل منها بـ 29 ريالاً."
- **U4:** the break-even line ("ليعود مبلغ 950 ريالاً كاملاً...") is gone.
- **Checks:** browser at 360 and 390 px in Arabic and English: the example, the fold open and closed, Clear closing it, a price under the gold value, a 24 karat bar, offers below, above and about equal to the gold value, no sideways overflow and no console errors. The Arabic review is regenerated (244 strings).

## Full QA and fixes (2026-11-26)
Tests: 123 passing. Offline cache v9. Report with every finding, the Buy & sell rating and recommendations U1-U8: docs/qa-2026-11-26.md.
- **Same price everywhere:** Today, My gold and the shared image now use the newer of the saved live price and the last close, as Outlook, Buy & sell and the currency sheet already did (`app.best()`).
- **New York hours:** the market day ends at 17:00 New York time (22:00 UTC in winter), so the weekend status and change line are right all year. A weekend price is called Friday's only if it is from Friday's close. Closes are still recorded at 21:07 UTC.
- **Figures:** the past week and month compare with the close made on or before that moment, a current fall stays counted until the record is regained, a 24 karat piece counts as a bar (about 1% under its gold value) in My gold as in the price check, the 12-month range includes today, and the offer verdict follows its printed figure.
- **Buy & sell:** the rate route no longer replaces a typed price, the example empties as soon as a box is tapped, "950,500" is refused rather than guessed, and the messages say what is accepted. The low-offer advice is now a fact.
- **Robustness:** a malformed news file hides the card instead of stopping the app (a regression from the percentage fix), one tab's error no longer stops the others, and the Outlook shows one message when the history file is missing.
- **Checks:** a scripted browser run covering normal use, a broken news file, a Saturday with an old price, a missing history file, the add sheet at 360 x 740 and a language switch, with no console errors. Screens were checked by eye at 360 and 390 px, the header at 360, 375 and 390 in both languages, and no tab scrolls sideways.

## Fix: Arabic percentages and a Clear button (2026-11-26)
Tests: 112 passing. Offline cache v8.
- **Percentages:** in Arabic, "34%" showed as "%34". After Arabic letters, the Unicode bidi rules treat the digits as Arabic numbers, so the percent sign no longer joins them and drifts to their left. Every Arabic string passes through t(), which now wraps each percentage in a left-to-right isolate (U+2066 to U+2069). The daily news line gets the same treatment. A test fails if any Arabic string leaves a percentage bare. Checked in the browser on all four tabs (33 percentages, none bare), in the shared image, and in English (unchanged).
- **Clear:** in "Is this a normal price?" and "Is this a normal offer?", "Show an example" becomes "Clear" (مسح) as soon as any box holds a number. Clear empties the boxes and returns to the family's own karat and today's rate. The rate-and-making route stays open if it was open. Checked: the example, typed numbers, numbers deleted by hand, the rate route, Arabic and English.
- Found and fixed during the check: the first version recomputed the example's price from the rate (849.996 instead of 950.000).
- docs/arabic-review.md is regenerated (238 strings). The generator now has a sample for the shared image's per-gram unit.

## Release 2: display currency (2026-11-26)
Plan: docs/superpowers/plans/2026-11-26-release-2-currency.md. Tests: 107 passing. Offline cache v7.
- **Currency button** beside the language link (ريال / OMR and so on) opens a sheet of five currencies with today's gram price in each. Choosing one changes every displayed price: Today's price, change line and board, My gold, the Outlook's figures and the shared image. Typed amounts and the shop tools stay in rials; the price check adds one line in the chosen currency. Today shows "Prices in UAE dirhams. Back to rials" while another currency is on.
- **Rates:** the rial and dirham are pegged to the dollar. The euro and pound come from app/data/rates.json, refreshed each weekday night by scripts/update-rates.mjs in the daily job (ExchangeRate-API, credited in the sheet). A bad response leaves the file as it was. Without a usable rate the euro and pound show as unavailable and rials are shown.
- **Pounds in millions:** a gram of 22 karat is about 9.4 million pounds, so pounds show in millions ("9.427 مليون ليرة"), with the full figure explained once in the sheet.
- **Arabic:** each currency's unit agrees with its number (درهماً, دراهم, دولاراً, يورو, مليون ليرة). docs/arabic-review.md is regenerated (236 strings).
- **Checks:** browser at 360 px in Arabic: the sheet, LBP on Today (price, board, change line), back to rials; AED on My gold with two pieces (totals, range, gain, past values), Outlook and the price check; the share text in LBP.

## Release 1 of the decision helpers (2026-11-26)
Design: docs/superpowers/specs/2026-11-26-decisions-and-currency-design.md (revision 3.1 and the VAT law). Plan: docs/superpowers/plans/2026-11-26-release-1-outlook-buysell.md. Tests: 88 passing. Offline cache v6.
- **Outlook tab** (was Future, renamed after the QA review): "Is the price high or low today?" answers with the distance from the record, the past week and month, Today's 12-month sentence, a five-year chart with the record marked, and every fall of 20% or more since 1971 with its recovery time. "Will it go up?" answers "No one knows", then two rows of dots (higher in 6 and 8 cases out of 10 after 1 and 10 years), the worst 10 years since 1971, and the banks' range in one line. Tables, all periods, forecast misses and the bank list fold under "Show details". The 5 and 10-year rial ranges and the bank figure on the chart are gone.
- **Buy & sell:** "Is this a normal price?" takes the weight, the karat and the full price the shop asks, and answers in money: the gold in the piece, the extra on top on a usual band (making 3 to 6 rials a gram with VAT on the whole price, 13% to 21% for 22 karat today), what a shop pays back today and per 100 paid, and the gram price gold must reach to return the price. Karat 24 offers a piece or bar switch. The old rate-and-making route stays behind a link. "Is this a normal offer?" gains a when line, numbered fields and an example. "Jewellery or a bar?" shows what a shop pays back per 100 paid: a small bar 90 to 94 (with or without VAT), plain 85, detailed 80.
- **My gold:** the same pieces' highest and lowest value in the last 12 months, and their value 5 and 10 years ago.
- **VAT (owner asked to apply the law):** jewellery carries 5% on the full price: the VAT Law (Royal Decree 121/2020) and its regulations (Decision 53/2021) have no jewellery rule, and the Tax Authority's own example taxes the total. Investment gold of 99% purity or more is zero-rated by Article 51(3), but Regulation Article 88 limits the zero rate to the first supply after extraction, so bars are shown with and without VAT.
- **Checks:** browser at 390 px in Arabic and English and 360 px in English, all states of the price check (example, price under the gold value, karat 24 as bar and as piece, the rate route, a zero price, Arabic digits), the offer example and the My gold block with two pieces.

## Design and data pass (2026-11-26)
The owner asked for more contrast and hierarchy in the news box and the price board, and a more premium icon. Tests: 72 passing.
- **News card:** oxblood velvet (`--deep`, lit from the reading corner), a gold hairline, a champagne title and source link, 17 px text. Contrast: champagne 9.5:1, text 13.8:1.
- **Price board:** the chosen karat's row is an oxblood band with round ends, a champagne karat and white figures. The hairlines beside it are hidden, and the headers line up with the figures. Checked at 360, 390 and 430 px in both languages with no overflow.
- **Icon:** scripts/make-icons.py now draws a polished gold solitaire on oxblood velvet inside a fine gold frame. The band and claws are shaded as reflective metal, and the stone is a faceted round brilliant. New file names (icons/gold-180, gold-192, gold-512, gold-maskable-512) so no cache can serve the old icon. The Android round crop drops the frame and keeps the ring inside the safe zone. A black colourway is one flag away (`--colour black`). The top-bar mark is the same ring, drawn small. Offline cache bumped to v5.
- **Home screens:** iPhones keep the icon that was saved when the app was added. To show the new one, remove the app and add it again from Safari. A home-screen app keeps its own storage apart from Safari, so pieces saved in My gold may not carry over; note them first. Android (Chrome) checks the app's details within a day or two of the app being opened. Because the icon files have new names, it offers the new icon, and recent Chrome versions ask the user to accept it ([web.dev](https://web.dev/articles/manifest-updates), [Chrome blog](https://developer.chrome.com/blog/improvements-to-web-app-updates)). The page design reaches everyone the next time they open the app online.
- **Daily close (fixes deferred minor M1):** on 26 Nov GitHub started the 21:00 UTC job at 03:20 UTC. It saved that morning's price ($3,576.90) as a 26 Nov close, and Wednesday was missing. As a result, Thursday's change line compared with Tuesday. The data now holds 25 Nov at $3,574.00, the OANDA XAU/USD price at 21:00 UTC (TradingView 1 h bar). The script records only in the hour after 21:00 UTC on weekdays and skips a day already recorded. The job runs at 21:07 and 21:37 UTC.
- **News routine, first scheduled run (25 Nov 22:00 UTC):** it changed nothing. Its cloud network cannot reach www.cnbc.com or www.kitco.com (the hosts do not resolve). Its checkout is a detached HEAD, so `git pull` failed. The close was also still missing, because of the late job above. The routine prompt now switches to `main` first, pushes with `git push origin HEAD:main`, and falls back to extended web search with a date check. Allowing the two news sites in the routine environment's network settings would let it read them directly.

## QA pass after the independent critique (2026-11-25)
An independent QA agent reviewed the live app and reported 1 blocker, 11 major and 38 minor or polish findings (QA1 to QA50). Each logic change was written as a failing test first (17 new tests). Checked afterwards in the browser at 360x740, 390x844 and 430x932 in Arabic and English: no sideways overflow, no text under 14 px, no tap target under 44 px, no console errors, price and change line above the tab bar at 360x740.

### What changed, by finding
- QA1 Future: the 5 and 10-year rows now show only a whole-rial range under "لو تكرّر ما حدث منذ 1971", with "هذا ليس توقعاً"; no middle figure, no dotted middle line, no 5/10-year dots. The banks keep one figure (1 decimal, "توقع البنوك لنهاية 2027"). Ranges start from the last daily close, so they change once a day. Chart points carry their values ("اليوم 39.7", "البنوك 56.7"), plus a "Today" row.
- QA2 the year hints state facts ("الشراء أرخص من المعتاد، والبيع يعطي مبلغاً أقل.") instead of advice.
- QA3 weekend: "تداول الذهب العالمي متوقف حتى فجر الاثنين. هذا آخر سعر من مساء الجمعة.", on two lines; the caption becomes "آخر سعر لجرام الذهب عيار 22" when the price is not live.
- QA4 the caption names the karat; the chosen karat is carnelian, weight 600, with a 3 px underline.
- QA5 karat guide: stamps isolated in `<bdi>` with side padding; 24 karat shows "999 / 999.9".
- QA6 report card written in Arabic without names; Latin credits and sources isolated.
- QA7 a tap on a sheet's own padding no longer closes it (tap position checked against the sheet's box).
- QA8 removing a piece needs a second tap ("حذف هذه القطعة؟ لا يمكن التراجع.") and sits on its own row.
- QA9 note under the list ("القطع محفوظة على هذا الهاتف فقط…") with "كيف؟" reopening the install steps, `navigator.storage.persist()` on save, and "مشاركة قائمتي" to send the list as text.
- QA10 no value or gain without a live price; "السعر غير متاح الآن، تظهر القيمة عند عودة الاتصال." on My gold and Buy & sell.
- QA11 field borders 1.5 px at 3.7:1; the year track uses the same colour.
- QA12 sentences 16 px, labels 15 px, chart labels 13 px, the tag 14 px.
- QA13 every control at least 48 px tall; the news source is a 48 px row "المصدر: CNBC".
- QA14 decorative photos keep empty alt text (the missing keys are gone).
- QA15 labels for every field and dialog, radio states on all selectors, Today has a heading, status parts separated for screen readers, Latin names marked as English, lists updated in place.
- QA16 errors sit under their field in carnelian with aria-invalid; an unreadable price is flagged.
- QA17 weight first with focus, karat defaults to the last piece's (else Today's, 22 instead of 24), optional fields grouped, name chips, month and year pickers named in Arabic (the year alone is accepted).
- QA18 the add button dims at 20 pieces with "الحد الأقصى 20 قطعة".
- QA19 calculators: a prompt per case, inline errors ("1e9" is an error), "ريال" on every line, the making charge clears on a mode switch, results and the prefilled rate no longer change by themselves.
- QA20 "تُباع اليوم بنحو 449 ريالاً"; offer bands match My gold's 2-6% (close up to 2%, usual 2-6%, low above 6%).
- QA21 "آخر 12 شهراً" everywhere.
- QA22 "آخر أخبار الذهب (25 نوفمبر)", shown until the next trading day has passed.
- QA23 shared text and card say "هذا سعر الذهب الخام…", carry the price's own time, and the share buttons hide without a price.
- QA24 "مباشر" only while the last successful fetch is at most 30 s old; a grey dot and the age otherwise; a placeholder for the first 8 s; 8 s fetch timeout.
- QA25 chart labels 13 px with values; each source converted to rials per gram for the chosen karat plus "للأونصة".
- QA26 Malabar is one entry with three map links; Kalyan "داخل لولو سوق على شارع روي العام" (Oman Observer, 2021); practical lines.
- QA27 J.P. Morgan dropped (the only source was a crypto exchange's news feed); the median stays 5,000 dollars; "نهاية 2027".
- QA28 24 karat shows "السبائك والعملات الخالصة معفاة عادة من الضريبة."
- QA29 sticky sheet headers, overscroll contained.
- QA30 tap feedback on every control.
- QA31 back returns to Today before leaving the app, and closes an open sheet first.
- QA32 hex fallbacks for every colour and a fallback for phones without `<dialog>`.
- QA33 docs/arabic-review.md is now generated from the code (`node scripts/review-strings.mjs`).
- QA34 the page, code and data come from the network first (4 s limit, then the cache); fonts and photos from the cache first.
- QA35 only the 1200 px photos are precached, each font file is stored once, modules and data load in parallel, the hero animation pauses off screen.
- QA36 Arabic number agreement for rials, dollars, pieces and banks ("4 ريالات", "449 ريالاً", "قطعتين", "11 بنكاً"); "و2,276" without a space.
- QA37 and QA38 the listed Arabic and English rewordings; one time format for app and card.
- QA39 hero: bright bangles on white (@sfhashemi); My gold: rings in a jewellery box (@jesus_eca, Unsplash licence); shop band cropped to the left.
- QA40 gold ring mark beside the wordmark; the year sentence in Noto Naskh 600.
- QA41 buttons with 12 px corners; the making-charge toggle is an underline selector.
- QA42 carnelian focus ring with a white gap.
- QA43 install tip in the light surface style with a carnelian button.
- QA44 the board uses one numeral face, "1 جرام", 3 decimals in every column, "بالريال العماني".
- QA45 status updates every 10 s with a "·" separator.
- QA46 the change line is ink, with the arrow and the words.
- QA47 the estimate tag sits on the range line; the calculators carry "عند الشراء" and "عند البيع".
- QA48 `color-scheme: only light`.
- QA49 empty state with the ring mark; name chips in the add sheet.
- QA50 hourglass for Future, bangle for My gold.

### Rulings in this pass (with the cost if wrong)
- R1 (QA1) history ranges shown as ranges only, from the last close — cost if wrong: the owner may want a middle figure back.
- R2 (QA40) kept Noto Naskh Arabic, which replaced Amiri after the owner flagged the Future heading, instead of trying Amiri again — cost if wrong: the owner may prefer Amiri's look.
- R3 (QA39) the rings in the My gold band are rose-gold fashion pieces, not 21/22 karat — cost if wrong: one image swap.
- R4 (QA27) four banks instead of five — cost if wrong: none, the median is unchanged.
- R5 (QA26) branch details come from reports dated 2016 to 2024 and were not phoned — cost if wrong: a moved branch until the next check.
- R6 the change line compares with the close before the price's own session and names that day ("أقل من سعر يوم الخميس") — my own correction, not in the QA report: Mondays and weekends no longer say "yesterday" — cost if wrong: none.
- R7 (QA17) a purchase year without a month is accepted and shown as "2019" — cost if wrong: none.
- R8 (QA9) the list backup is text only, with no import — cost if wrong: re-typing after a lost phone.
- R9 (QA8) a confirm step instead of an undo bar — cost if wrong: one extra tap.
- R10 (QA28) the 24 karat note informs; VAT is still added in the cost calculator — cost if wrong: bar buyers subtract 5% themselves.
- R11 (QA24) returning to the app shows "جارٍ جلب السعر" until the first answer instead of a stale status — cost if wrong: none.

### Still open
- Real-phone checks the QA agent and I could not run: the iOS share sheet, install, the keyboard over sheets, Safari's 7-day storage deletion, Samsung forced dark, Android back.
- QA32 needs the mother's and aunt's phone models to confirm the oldest phone in use.
- Task 16: the two cloud routines now exist: "Gold Today: daily news line" (weekdays 21:30 UTC, app/data/why.json) and "Gold Today: monthly bank forecasts" (1st of each month 06:00 UTC, app/data/forecasts.json), managed at https://claude.ai/code/routines. Their first runs show whether they can push to the repository; if not, the Claude GitHub App needs write access to bassamsketch/gold-today.
- The fan between today and the 5-year range is drawn straight on the log scale, so its width at 1 year is not computed (minor).

## Built and verified
- Today, My gold, Future and Buy & sell tabs in Arabic (default) and English, live price every 10 seconds, WhatsApp share card, install to home screen, offline cache.
- Checked in the browser at 360x740, 390x844 and 430x932 in both languages: no sideways overflow, price visible without scrolling.
- Budgets: app code 30 KB compressed (limit 150 KB), fonts 317 KB (limit 350 KB).
- Independent final review: no critical issues; the important ones were fixed with tests first.

## Waiting on the owner
- Decision: 5 and 10-year figures from today's price (approved design, now live: 22K about 52.9 and 61.5 rials) or from the banks' 1-year figure (about 72.2 and 85.2).
- GitHub repository gold-today, Pages, first deploy, daily close run, and the two scheduled Claude jobs (daily why line, monthly forecasts).
- Arabic wording review: docs/arabic-review.md.

## Fixed after the final review
- I1 service worker cloned responses after the page read them, so data and page never refreshed — sw.test.js "network-first data responses are stored in the cache" RED→GREEN (cache open made asynchronous to reproduce), browser check: cached why.json and ./ dated at the last reload; VERSION bumped to v2.
- M13 with I1 (only the app page is cached as the offline page; re-graded from minor because the I1 fix would otherwise enable it) — sw.test.js "only the app page is kept as the offline page" RED→GREEN.
- I2 restored spec 7.5/D5 (5 and 10-year bands from today's price), reversing the Task 6 chaining ruling, which needed the owner — forecast.test.js "buildForecast shapes y1, y5 and y10" RED→GREEN; the chained option goes to the owner as a question (22K now 52.94 / 61.53 vs chained 72.22 / 85.24).
- I3 survey year no longer hardcoded (lbma.survey {year, avg, url}; surveyComparison bounds closes to that year) — forecast.test.js "surveyComparison averages only the survey year" RED→GREEN.
- I4 data test asserted exactly 5 targets; now validateForecastFile accepts 1+ complete targets — forecast.test.js "validateForecastFile accepts any number of complete targets" and data.test.js RED→GREEN.
- I5 delayed price now says when it is from ("آخر سعر: الثلاثاء 3:10 م"), "قليلاً" dropped — i18n.test.js "lastPriceText names the Muscat day and time of an old price" and "the delayed message no longer says slightly" RED→GREEN.
- M2 (re-graded to Important: it is the status line the family reads every time) minutes after 60 s with Arabic number forms — i18n.test.js "agoText switches to minutes after a minute" RED→GREEN.

## Rulings I made (in order, with the cost if wrong)
- **Setup:** work on `main` of a brand-new local repository (no prior history, plan states it, owner approved the plan and chose Native) — a worktree adds nothing for a repo with no commits — cost if wrong: none, history can be branched later.
- - T5 store consumes T4 validatePiece: T5 tests pass full pieces and a {grams:-1} piece; validatePiece must normalise missing id/name/bought fields. Ruling: validatePiece fills id (random), name '', boughtPrice null, boughtYm null when absent — spec D8 makes these optional — cost if wrong: none.
- **Task 1:** npm test script uses the glob "tests/**/*.test.js" — the plan's `node --test tests/` makes Node 24 load the directory as a module — cost if wrong: none.
- **Task 2:** yearShareBelow returns null when no close falls in the last 365 days — the UI then hides the comparison instead of showing a made-up position — cost if wrong: none.
- **Task 3:** buildForecast returns y1 = null when no targets exist (the Future tab then shows only the history bands) — design D2 allows thin data — cost if wrong: none.
- **Task 4:** offerCheck.gapPct is a percent number (3.36), not a fraction, to match its name — cost if wrong: none (only the UI reads it).
- **Task 5:** i18n stores the five moods and three hints as keys mood0..mood4 and hint0..hint2 (not arrays), and adds dayMonthYear() — keeps the same-keys test meaningful and dates readable — cost if wrong: none.
- **Task 6:** monthly series uses World Bank monthly averages 1971-01..2021-11 (freegoldapi.com) and OANDA month-end closes from 2021-12 — the only free long-run USD series found — cost if wrong: slight smoothing of long-run returns, negligible for 5/10-year bands.
- **Task 6:** forecasts.json adds institutionAr for Arabic names; World Bank 2027 average left out (search summary only, research R1) — cost if wrong: none.
- **Task 6:** 5 and 10-year bands start from the banks' 1-year median (5000 USD) instead of today's price (spec D5) — with real data the spec's path read 56.7 -> 53.4 -> 62.1 rials/g (up, down, up), which looks like an error to a reader — cost if wrong: long-range values inherit any bank optimism; the Future tab labels say "after the first year, based on gold's history".
- **Task 7:** fonts trimmed to Source Serif 4 500/600 (opsz 24, no italic), Amiri 700, Almarai 400/700 (317 KB) — the full set was 564 KB against the 350 KB budget (D6); the English wordmark is upright and the Arabic year sentence uses Amiri 700 — cost if wrong: slightly heavier Arabic sentence. (Later replaced: Noto Naskh Arabic after the owner flagged the Future heading, now 600-700, see R2.)
- **Task 7:** shop-1200.webp is 1000x564 at q52 (159 KB) to stay under 160 KB; srcset lists it as 1000w — cost if wrong: none on phones.
- **Task 8:** all four views' static markup lives in index.html now (views add behaviour later), and main.js loads view modules with dynamic import so each later task plugs in without editing main.js — cost if wrong: none; Task 14 checks there are no 404s once every module exists.
- **Task 9:** preview server switched from python http.server to scripts/serve.mjs (Node, Cache-Control no-store) — the browser kept serving stale modules, which hid code changes during verification — cost if wrong: none (development only).
- **Task 9:** the status line hides in the 'none' state because the price area already says "not available yet"; the why-source name is wrapped in <bdi> so "CNBC، 25 نوفمبر" keeps its order in Arabic — cost if wrong: none.
- **Task 11:** the expected line is straight between knots on the log scale (polyline), the past line is smoothed — matches D5 "straight on the log scale" — cost if wrong: none.
- **Task 12:** cost results show 3 decimals (baisa), as Omani prices are quoted — cost if wrong: none.
- **Task 14:** data/*.json are also precached (network-first at runtime) so a first visit already works offline afterwards; scripts/precache.mjs regenerates the list — cost if wrong: none.
- **Task 14:** main.js now logs every failed view import (the earlier tolerance for missing modules is gone because all modules exist) — cost if wrong: none.
- **Task 15:** daily-close.yml starts pages.yml with `gh workflow run` after pushing — commits pushed with the workflow token do not trigger other workflows, so the site would otherwise keep yesterday's history — cost if wrong: one extra deploy per day.
- **Task 15:** steps 4-5 (create the public repository, push, enable Pages, run the Action, check the phone) need the owner's GitHub sign-in; they move to the hand-off after Task 17's local verification, and Task 16 (scheduled routines) follows them because it needs the repository — cost if wrong: none, order only.
- **Task 17:** reduced motion checked by code, not emulated — the browser tool cannot emulate prefers-reduced-motion; tokens.css sets every animation and transition to 0.01ms under the media query and countUp/drawFuture skip animation when it matches — cost if wrong: motion would still play for users who asked for less.
- **Final:** D-1 market hours fixed at 21:00/22:00 UTC all year — spec D7; in winter the closed line starts an hour early at 1-2 am Muscat time — cost if wrong: negligible.
- **Final:** D-2 Monday compares with Friday and weekends show "same as yesterday" — matches how the market works (D7) — cost if wrong: none.
- **Final:** D-3 buy/sell hint wording beside the disclaimer — approved spec 7.4 — cost if wrong: owner may soften wording.
- **Final:** D-4 Android back exits from any tab and the tab is not remembered — small effect, spec silent — cost if wrong: one extra tap.
- **Final:** D-5 data accuracy (targets, places, links) — research is labelled and the spec requires a pre-launch recheck — cost if wrong: a stale entry until the monthly refresh.
- **Final:** D-6 Arabic wording — owner review via docs/arabic-review.md (D9) — cost if wrong: awkward phrasing until reviewed.
- **Final:** D-7 visual fidelity/contrast/first paint — checked by screenshots at three sizes and token choice — cost if wrong: minor visual polish.
- **Final:** D-8 iOS share sheet behaviour — needs a real phone, part of the launch check — cost if wrong: share falls back to WhatsApp text.
- **Final:** D-9 absurd typed values (billions, 300-digit rates) — not reachable in real use — cost if wrong: an odd percentage.
- **Final:** D-10 GitHub steps and scheduled routines — waiting on the owner's account — cost if wrong: none.

## Deferred minors (not fixed, for the owner to decide)
Fixed in the QA pass: M6 (QA8), M7 (QA16), M8 (QA24), M9 (QA35), M10 (QA23), M11 (QA10), M14 (QA15, QA31). D-2 and D-4 below are superseded by R6 and QA31.
- M1 a daily-close run delayed past 00:00 UTC files the close under the next day. Fixed 2026-11-26 (late runs now record nothing).
- M3 forecast targets are not filtered by age or past horizon if the monthly refresh stops (the date is shown).
- M4 "3,125" typed as a weight reads as 3,125 g; the Arabic comma returns nothing.
- M5 weights show one decimal (12.35 g as 12.4).
- M6 removing a piece has no confirmation or undo.
- M7 an unreadable bought price is dropped silently.
- M8 the price fetch has no timeout.
- M9 the two Source Serif files are identical (52 KB duplicate).
- M10 the share card shows the current time even for a cached or weekend price; share does nothing silently without a price.
- M11 without a price, My gold and Buy & sell give no explanation.
- M12 the Future tab can throw on missing bands or a malformed source link.
- M14 English-only tab bar label, aria-selected on table rows, no arrow keys on karat radios, install tip ignores a language switch.
- M15 daily-close push has no retry; actions pinned by tag.
