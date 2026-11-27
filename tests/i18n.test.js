import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, agoText, monthYear, lastPriceText, durationText, isolatePct, newsText, closeDay } from '../app/js/i18n.js';

test('durations use months under two years and agree in Arabic', () => {
  assert.equal(durationText('ar', 6), '6 أشهر');
  assert.equal(durationText('ar', 18), '18 شهراً');
  assert.equal(durationText('ar', 43), '4 سنوات');
  assert.equal(durationText('ar', 106), '9 سنوات');
  assert.equal(durationText('ar', 316), '26 سنة');
  assert.equal(durationText('en', 106), '9 years');
  assert.equal(durationText('en', 6), '6 months');
});

test('short durations use the Arabic dual and singular forms', () => {
  assert.equal(durationText('ar', 1), 'شهر');
  assert.equal(durationText('ar', 2), 'شهرين');
  assert.equal(durationText('ar', 26), 'سنتين');
  assert.equal(durationText('en', 26), '2 years');
});

test('the worst 10 years name the month they began', () => {
  const iso = (s) => `${String.fromCharCode(0x2066)}${s}${String.fromCharCode(0x2069)}`; // see the percentages test
  assert.equal(t('ar', 'worstText', 'يوليو 1980', -0.44 * 100), `من اشترى في يوليو 1980 وجد السعر أقل بـ ${iso('44%')} بعد 10 سنوات.`);
  assert.equal(t('en', 'worstText', 'July 1980', -44), 'buying in July 1980 meant a price 44% lower 10 years later.');
});

test('the Android steps fit the renamed Chrome menu and a bar at the top or the bottom', () => {
  for (const lang of ['ar', 'en']) assert.ok(t(lang, 'installAndroid').includes('⋮'));
  assert.ok(t('ar', 'installAndroid').includes('«تثبيت»'));
  assert.ok(!t('ar', 'installAndroid').includes('أعلى الشاشة'));
  assert.ok(t('en', 'installAndroid').includes('"Install"'));
  assert.ok(!t('en', 'installAndroid').includes('at the top'));
});

test('the install button says what it does, and the next line names the second tap', () => {
  assert.equal(t('ar', 'installNow'), 'تثبيت التطبيق');
  assert.equal(t('en', 'installNow'), 'Install the app');
  assert.ok(t('ar', 'installNext').includes('«تثبيت»'));
  assert.ok(t('en', 'installNext').includes('"Install"'));
  assert.ok(t('ar', 'installNext').includes('الزر أدناه')); // the line sits above the button
  assert.ok(t('en', 'installNext').includes('button below'));
  assert.ok(!t('ar', 'installNext').includes('مرة أخرى')); // "again" could attach to the window
  assert.ok(t('ar', 'installedText').includes('«ذهب اليوم»'));
  assert.ok(t('en', 'installedText').includes('ذهب اليوم'));
});

test('"not a forecast" sits with the history, not with the banks', () => {
  assert.ok(t('ar', 'oddsSince').includes('ليس توقعاً'));
  assert.ok(t('en', 'oddsSince').includes('Not a forecast'));
});

test('the outlook reads "in 6 cases out of 10", never "6 times higher"', () => {
  assert.ok(t('ar', 'higherCases', 6).includes('6 حالات من كل 10'));
  assert.ok(t('ar', 'higherCases', 8).includes('8 حالات من كل 10'));
  assert.ok(!t('ar', 'higherCases', 6).includes('مرات'));
  assert.equal(t('en', 'higherCases', 6), 'higher in 6 cases out of 10');
});

test('the Future tab is now called Outlook', () => {
  assert.equal(t('ar', 'tabFuture'), 'التوقعات');
  assert.equal(t('en', 'tabFuture'), 'Outlook');
});

test('the falls line lists every recovery and says when a fall is under way', () => {
  const ar = t('ar', 'fallsLine', [6, 43, 316, 18, 106], true, 1980);
  assert.ok(ar.startsWith('قبل الهبوط الحالي'), ar);
  assert.ok(ar.includes('5 مرات'), ar);
  assert.ok(ar.includes('6 أشهر و18 شهراً و4 سنوات و9 سنوات و26 سنة'), ar);
  assert.ok(ar.includes('1980'), ar);
  const en = t('en', 'fallsLine', [6, 43, 316, 18, 106], false, null);
  assert.ok(en.startsWith('Gold has fallen 20% or more 5 times since 1971.'), en); // (OL13)
  assert.ok(en.includes('6 months, 18 months, 4 years, 9 years and 26 years'), en);
});

test('price check amounts agree with their numbers in Arabic', () => {
  assert.equal(t('ar', 'rialWord', 810), 'ريالات');
  assert.equal(t('ar', 'rialWord', 140), 'ريالاً');
  assert.equal(t('ar', 'rialWord', 100), 'ريال');
});

test('the new sections state facts, not advice', () => {
  for (const lang of ['ar', 'en']) {
    for (const [key, v] of Object.entries(STRINGS[lang])) {
      if (typeof v !== 'string') continue;
      assert.ok(!/مناسب|ننصح|good time|we recommend|you should/i.test(v), `${lang}.${key}`);
    }
  }
});

test('Arabic and English have the same keys', () => {
  assert.deepEqual(Object.keys(STRINGS.ar).sort(), Object.keys(STRINGS.en).sort());
});

test('agoText plural forms', () => {
  assert.equal(agoText('ar', 3), 'تم التحديث الآن');
  assert.equal(agoText('ar', 7), 'آخر تحديث قبل 7 ثوانٍ');
  assert.equal(agoText('ar', 30), 'آخر تحديث قبل 30 ثانية');
  assert.equal(agoText('en', 30), 'updated 30 seconds ago');
});

test('t fills templates and falls back to the key', () => {
  assert.equal(t('en', 'karatN', 22), '22 karat');
  assert.equal(t('ar', 'karatN', 22), 'عيار 22');
  assert.equal(t('en', 'no-such-key'), 'no-such-key');
});

test('monthYear names months in each language', () => {
  assert.equal(monthYear('ar', '2019-03'), 'مارس 2019');
  assert.equal(monthYear('en', '2019-03'), 'March 2019');
  assert.equal(monthYear('en', null), '');
});

test('agoText switches to minutes after a minute', () => {
  assert.equal(agoText('en', 847), 'updated 14 minutes ago');
  assert.equal(agoText('en', 75), 'updated 1 minute ago');
  assert.equal(agoText('ar', 75), 'آخر تحديث قبل دقيقة');
  assert.equal(agoText('ar', 150), 'آخر تحديث قبل دقيقتين');
  assert.equal(agoText('ar', 400), 'آخر تحديث قبل 6 دقائق');
  assert.equal(agoText('ar', 847), 'آخر تحديث قبل 14 دقيقة');
});

test('lastPriceText names the Muscat day and time of an old price', () => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  const en = lastPriceText('en', Date.parse('2026-11-24T11:10:00Z'), now);
  assert.ok(en.includes('Tuesday') && en.includes('3:10'), en);
  const ar = lastPriceText('ar', Date.parse('2026-11-24T11:10:00Z'), now);
  assert.ok(ar.includes('الثلاثاء') && ar.includes('3:10'), ar);
  assert.ok(lastPriceText('en', Date.parse('2026-11-10T11:10:00Z'), now).includes('10'), 'older than a week shows the date');
});

test('the delayed message no longer says "slightly"', () => {
  assert.ok(!t('ar', 'delayed').includes('قليلاً'));
});

test('bank counts agree in Arabic', () => {
  const banks = (n) => t('ar', 'banksShort', n, '52.7', '59.5', '2027-12', '40.5');
  assert.ok(banks(1).startsWith('يتوقع بنك واحد'), banks(1));
  assert.ok(banks(2).startsWith('يتوقع بنكان'), banks(2));
  assert.ok(banks(4).startsWith('تتوقع 4 بنوك'), banks(4));
  assert.ok(banks(11).startsWith('تتوقع 11 بنكاً'), banks(11));
  assert.ok(banks(4).includes('بنهاية 2027'), banks(4));
});

test('year wording says the past 12 months, not this year', () => {
  for (const k of ['mood0', 'mood1', 'mood2', 'mood3', 'mood4', 'cheapest', 'dearest']) assert.ok(t('ar', k).includes('12 شهراً'), k);
});

test('targets due in December read as the end of the year', () => {
  assert.equal(t('ar', 'targetBy', '2027-12'), 'نهاية 2027');
  assert.equal(t('en', 'targetBy', '2027-12'), 'end of 2027');
  assert.equal(t('ar', 'targetBy', '2027-06'), 'بحلول يونيو 2027');
});

test('the year hints state facts, not advice', () => {
  for (const k of ['hint0', 'hint1', 'hint2']) {
    assert.ok(!t('ar', k).includes('مناسب'), k);
    assert.ok(!/good moment/i.test(t('en', k)), k);
  }
});

test('the weekend status does not call the souq closed', () => {
  assert.ok(!t('ar', 'closed').includes('السوق'));
  assert.ok(t('ar', 'closed').includes('الاثنين'));
});

test('rials and pieces agree with their numbers in Arabic', () => {
  assert.ok(t('ar', 'range', 2183, 2276).includes('و2,276 ريالاً'), t('ar', 'range', 2183, 2276));
  assert.ok(t('ar', 'range', 300, 1000).endsWith('1,000 ريال حسب المحل'), t('ar', 'range', 300, 1000));
  assert.ok(t('ar', 'covers', 1, 2).includes('قطعة واحدة من قطعتين'), t('ar', 'covers', 1, 2));
  assert.ok(t('ar', 'covers', 2, 3).includes('قطعتان من 3 قطع'), t('ar', 'covers', 2, 3));
  assert.ok(t('ar', 'covers', 3, 12).includes('3 قطع من 12 قطعة'), t('ar', 'covers', 3, 12));
});

test('monthYear shows a year alone when the month is unknown', () => {
  assert.equal(monthYear('ar', '2019'), '2019');
});

test('amounts agree with their numbers in every display currency', () => {
  assert.ok(t('ar', 'range', 2183, 2276, 'AED').endsWith('و2,276 درهماً حسب المحل'), t('ar', 'range', 2183, 2276, 'AED'));
  assert.equal(t('ar', 'worthToday', 449, 'USD'), 'تُباع اليوم بنحو 449 دولاراً');
  assert.equal(t('ar', 'worthToday', 405, 'EUR'), 'تُباع اليوم بنحو 405 يورو');
  assert.equal(t('ar', 'worthToday', 7, 'AED'), 'تُباع اليوم بنحو 7 دراهم');
  assert.equal(t('ar', 'worthToday', 1130.34, 'LBP'), 'تُباع اليوم بنحو 1,130.3 مليون ليرة');
  assert.equal(t('en', 'worthToday', 1130.34, 'LBP'), 'Would sell for about 1,130.3 million pounds today');
  // rials read exactly as before
  assert.equal(t('ar', 'worthToday', 449), 'تُباع اليوم بنحو 449 ريالاً');
  assert.ok(t('ar', 'range', 2183, 2276).endsWith('و2,276 ريالاً حسب المحل'));
});

test('each currency has its name, short label, per-gram unit and board caption', () => {
  assert.equal(t('ar', 'curName', 'LBP'), 'ليرة لبنانية');
  assert.equal(t('ar', 'curShort', 'OMR'), 'ريال');
  assert.equal(t('en', 'curShort', 'AED'), 'AED');
  assert.equal(t('ar', 'curPerGram', 'LBP'), 'مليون ليرة للجرام');
  assert.equal(t('en', 'curPerGram', 'EUR'), 'euros per gram');
  assert.equal(t('ar', 'boardIn', 'LBP'), 'بملايين الليرات اللبنانية');
  assert.equal(t('ar', 'boardIn', 'OMR'), 'بالريال العماني');
  assert.equal(t('ar', 'curUnit', 'AED'), 'درهم');
});

test('whole dirham figures agree with their unit on the Outlook', () => {
  assert.ok(t('ar', 'banksShort', 4, '503', '568', '2027-12', '387', 'AED').includes('بين 503 و568 درهماً'), t('ar', 'banksShort', 4, '503', '568', '2027-12', '387', 'AED'));
  assert.equal(t('ar', 'curPerGram', 'AED', 387), 'درهماً للجرام');
  assert.equal(t('ar', 'curPerGram', 'USD', 105.4), 'دولار للجرام');
  assert.ok(t('ar', 'srcGram', 22, 'AED', '503').startsWith('دراهم لجرام'), t('ar', 'srcGram', 22, 'AED', '503'));
  // rials keep their plain per-gram unit after one decimal
  assert.equal(t('ar', 'curPerGram', 'OMR', 40.5), 'ريال للجرام');
});

test('the currency button names its visible code, and shared pound prices say Lebanese', () => {
  assert.ok(t('en', 'curAria', 'Omani rial', 'OMR').includes('OMR'));
  assert.equal(t('ar', 'curPerGramFull', 'LBP'), 'مليون ليرة لبنانية للجرام');
  assert.equal(t('en', 'curPerGramFull', 'LBP'), 'million Lebanese pounds per gram');
  assert.equal(t('en', 'curPerGramFull', 'AED'), 'dirhams per gram');
  assert.ok(t('ar', 'pcConverted', '9,074 درهماً').startsWith('السعر المطلوب'));
});

test('Arabic percentages keep the sign to the right of the number, everywhere', () => {
  const LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069); // left-to-right isolate
  assert.ok(t('ar', 'belowRecord', 34).includes(`${LRI}34%${PDI}`), JSON.stringify(t('ar', 'belowRecord', 34)));
  assert.ok(t('ar', 'moveBy', -12).includes(`${LRI}12%${PDI}`));
  assert.ok(t('ar', 'boardNote').includes(`${LRI}5%${PDI}`));
  assert.ok(t('ar', 'pcWhy', 17).includes(`${LRI}17%${PDI}`));
  assert.ok(t('ar', 'g22').includes(`${LRI}91.6%${PDI}`));
  assert.ok(t('ar', 'totalUp', 41, '14').includes(`(${LRI}14%${PDI})`));
  // every Arabic string: no bare percentage left, and English is untouched
  const wrapped = new RegExp(`${LRI}[+−-]?[0-9][0-9.,]*%${PDI}`, 'g');
  for (const key of Object.keys(STRINGS.ar)) {
    const v = typeof STRINGS.ar[key] === 'string' ? t('ar', key) : '';
    assert.ok(!/[0-9]%/.test(v.replace(wrapped, '')), `${key}: ${v}`);
  }
  assert.ok(!t('en', 'belowRecord', 34).includes(LRI));
  // the daily news line comes from data, not from these strings, and gets the same treatment
  assert.equal(isolatePct('ارتفع الذهب 1.2% ثم −0.4%'), `ارتفع الذهب ${LRI}1.2%${PDI} ثم ${LRI}−0.4%${PDI}`);
});

test('the change line names a weekday only within the week, else the date (TD5)', () => {
  const now = Date.parse('2026-11-26T10:00:00Z'); // Thursday
  assert.equal(closeDay('en', '2026-11-25', true, now), 'yesterday');
  assert.equal(closeDay('en', '2026-11-23', false, now), 'on Monday');
  assert.equal(closeDay('en', '2026-11-19', false, now), 'on 19 November');
  assert.equal(closeDay('ar', '2026-11-19', false, now), 'يوم 19 نوفمبر');
});

test('the news line shows only when the file holds text, so a bad file cannot stop the app (TD4)', () => {
  const LRI = String.fromCharCode(0x2066), PDI = String.fromCharCode(0x2069);
  assert.equal(newsText({ ar: ['ارتفع'], en: 'Up' }, 'ar'), null);
  assert.equal(newsText({ ar: '   ', en: 'Up' }, 'ar'), null);
  assert.equal(newsText(null, 'en'), null);
  assert.equal(newsText({ ar: 'ارتفع 1.2%', en: 'Up 1.2%' }, 'en'), 'Up 1.2%');
  assert.equal(newsText({ ar: 'ارتفع 1.2%', en: 'Up 1.2%' }, 'ar'), `ارتفع ${LRI}1.2%${PDI}`);
});

test('period rows describe what happened, not a rule (OL8)', () => {
  assert.equal(t('en', 'periodRow', 6, -36), 'Half the time it ended 6% higher or more. At worst 36% lower.');
  assert.equal(t('en', 'periodRow', -3, -40), 'Half the time it ended 3% lower or more. At worst 40% lower.');
  assert.ok(t('ar', 'periodRow', 6, -36).startsWith('في نصف المرات انتهى أعلى بـ'));
});

test('each check names its moment in the title, and the offer result is said in rials (U2, U3, U4)', () => {
  assert.equal(t('ar', 'pcTitle'), 'قبل الشراء: هل السعر معتاد؟');
  assert.equal(t('ar', 'offerTitle'), 'قبل البيع: هل العرض معتاد؟');
  assert.equal(t('en', 'pcTitle'), 'Before buying: is this a normal price?');
  assert.equal(t('ar', 'offerMoney', 809.136, 29.3, 'below'), 'قيمة الذهب اليوم نحو 809 ريالات، والعرض أقل منها بـ 29 ريالاً.');
  assert.equal(t('ar', 'offerMoney', 809.136, 4, 'above'), 'قيمة الذهب اليوم نحو 809 ريالات، والعرض أعلى منها بـ 4 ريالات.');
  assert.equal(t('ar', 'offerMoney', 809.136, 0.2, 'same'), 'قيمة الذهب اليوم نحو 809 ريالات، والعرض يساويها تقريباً.');
  assert.equal(t('en', 'offerMoney', 809.136, 29.3, 'below'), "Today's gold value is about 809 rials, and the offer is 29 rials below it.");
  assert.equal(t('en', 'offerMoney', 809.136, 0.2, 'same'), "Today's gold value is about 809 rials, and the offer is about the same.");
  // the percent line, the bar's label, the break-even line and the red lines above the titles are gone
  for (const gone of ['gapBelow', 'gapAbove', 'offerValue', 'noExtra', 'pcTarget', 'pcWhen', 'ocWhen', 'jbWhen']) {
    assert.equal(STRINGS.ar[gone], undefined, gone);
    assert.equal(STRINGS.en[gone], undefined, gone);
  }
});

test('the outlook moves sit in their own box as label and value, and saving reads in rials (owner, 2026-11-26)', () => {
  const iso = new RegExp(`[${String.fromCharCode(0x2066, 0x2069)}]`, 'g'), plain = (s) => s.replace(iso, '');
  assert.equal(t('ar', 'weekLabel'), 'آخر أسبوع');
  assert.equal(t('ar', 'monthLabel'), 'آخر شهر');
  assert.equal(plain(t('ar', 'moveBy', -4.2)), 'أقل بـ 4%');
  assert.equal(plain(t('ar', 'moveBy', 0.3)), 'دون تغيير');
  assert.equal(t('en', 'moveBy', 11.4), 'up 11%');
  for (const gone of ['pastWeek', 'pastMonth', 'jbBar', 'jbPiece', 'jbTo']) assert.equal(STRINGS.ar[gone], undefined, gone);
});

test('the price check has one way to give the price: the rate-and-making route is gone (owner, 2026-11-26)', () => {
  for (const gone of ['pcAlt', 'pcAltNote', 'making', 'perGramMode', 'percentMode', 'shopRate', 'shopRateHint', 'badMaking', 'badRate', 'vat24']) {
    assert.equal(STRINGS.ar[gone], undefined, gone);
    assert.equal(STRINGS.en[gone], undefined, gone);
  }
  assert.equal(t('ar', 'pcFullHint'), 'إذا ذكر المحل سعر الجرام والمصنعية فقط، يمكن طلب السعر الكامل مع الضريبة.');
  assert.equal(t('en', 'pcFullHint'), 'If the shop gives only a rate per gram and a making charge, ask for the full price with VAT.');
});

test('the offer verdict names the deal, gives the money, the usual range for the piece and a tip (owner, 2026-11-26)', () => {
  assert.equal(t('ar', 'offerHeadLow'), 'عرض منخفض');
  assert.equal(t('ar', 'offerHeadClose'), 'عرض جيد');
  assert.equal(t('en', 'offerHeadUsual'), 'A fair offer');
  assert.equal(t('en', 'offerHeadAbove'), 'An excellent offer');
  assert.equal(t('ar', 'offerNoteLow', 34, 101), 'المعتاد أن تدفع المحلات أقل من قيمة الذهب بنحو 34 إلى 101 ريال فقط.');
  assert.equal(t('ar', 'offerNoteUsual', 34, 101), 'المعتاد أن تدفع المحلات أقل من قيمة الذهب بنحو 34 إلى 101 ريال، وهذا العرض ضمن ذلك.');
  assert.equal(t('en', 'offerNoteClose', 34, 101), 'Shops usually pay about 34 to 101 rials under the gold value, so this offer is closer to the full value.');
  assert.equal(t('ar', 'offerNoteUsual', 1, 1), 'المعتاد أن تدفع المحلات أقل من قيمة الذهب بنحو 1 ريال، وهذا العرض ضمن ذلك.');
  assert.equal(t('ar', 'offerTipLow'), 'يُستحسن سؤال محل آخر قبل البيع.');
  assert.equal(t('en', 'offerTipUsual'), 'Another shop may offer a little more.');
  // the old one-line verdicts and the saving section are gone
  for (const gone of ['verdictAbove', 'verdictClose', 'verdictUsual', 'verdictLow', 'jbTitle', 'jbIntro', 'jbBarRow', 'jbJewelRow', 'jbRange', 'jbDiff', 'jbOnlyMoney', 'jbFine']) {
    assert.equal(STRINGS.ar[gone], undefined, gone);
  }
});

test('the price verdict names the price, gives the money, the usual extra for the piece and a tip (owner, 2026-11-26)', () => {
  assert.equal(t('ar', 'pcHeadWithin'), 'سعر عادي');
  assert.equal(t('ar', 'pcHeadAbove'), 'سعر مرتفع');
  assert.equal(t('en', 'pcHeadBelow'), 'A good price');
  assert.equal(t('en', 'pcHeadUnder'), 'An unusual price');
  assert.equal(t('ar', 'pcMoney', 810, 140), 'ثمن الذهب في القطعة نحو 810 ريالات، والمحل يطلب فوقه 140 ريالاً.');
  assert.equal(t('ar', 'pcMoney', 810, 0), 'ثمن الذهب في القطعة نحو 810 ريالات، والسعر يساويه تقريباً.');
  assert.equal(t('ar', 'pcMoney', 810, -10), 'ثمن الذهب في القطعة نحو 810 ريالات، والسعر أقل منه بـ 10 ريالات.');
  assert.equal(t('en', 'pcMoney', 810, 140), 'The gold in this piece is worth about 810 rials, and the shop asks 140 rials on top.');
  assert.equal(t('ar', 'pcNote', false, 'within', 104, 167), 'المعتاد للقطع البسيطة في مسقط أن يطلب المحل فوق ثمن الذهب نحو 104 إلى 167 ريالاً، وهذا السعر ضمن ذلك.');
  assert.equal(t('en', 'pcNote', true, 'above', 9, 64), 'Shops usually ask about 9 to 64 rials on top of the gold for a small bar or coin, and this price is higher.');
  assert.equal(t('ar', 'pcTipAbove'), 'يُستحسن سؤال محل آخر قبل الشراء، إلا إن كانت القطعة بتصميم دقيق.');
  for (const gone of ['pcWithin', 'pcBelow', 'pcAbove', 'pcBarWithin', 'pcBarBelow', 'pcBarAbove', 'pcUnder', 'pcRange', 'pcGold', 'pcExtra']) {
    assert.equal(STRINGS.ar[gone], undefined, gone);
  }
});
