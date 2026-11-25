import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, agoText, monthYear, lastPriceText } from '../app/js/i18n.js';

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
