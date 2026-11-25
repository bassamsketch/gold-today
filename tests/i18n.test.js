import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, t, agoText, monthYear } from '../app/js/i18n.js';

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
