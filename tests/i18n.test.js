import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, agoText, monthYear, lastPriceText, durationText } from '../app/js/i18n.js';

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
  assert.equal(t('ar', 'worstText', 'يوليو 1980', -0.44 * 100), 'من اشترى في يوليو 1980 وجد السعر أقل بـ 44% بعد 10 سنوات.');
  assert.equal(t('en', 'worstText', 'July 1980', -44), 'buying in July 1980 meant a price 44% lower 10 years later.');
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
  assert.ok(en.startsWith('Gold fell 20% or more 5 times since 1971.'), en);
  assert.ok(en.includes('6 months, 18 months, 4 years, 9 years and 26 years'), en);
});

test('price check amounts agree with their numbers in Arabic', () => {
  assert.ok(t('ar', 'pcTarget', 950, '49.5', 22, '40.5').includes('950 ريالاً'));
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
