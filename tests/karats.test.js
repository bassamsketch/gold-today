import { test } from 'node:test';
import assert from 'node:assert/strict';
import { karatPieces } from '../app/js/ui/karats.js';

test('the karat phrase in a sentence is marked, with its digits apart', () => {
  assert.deepEqual(karatPieces('سعر جرام الذهب عيار 22 الآن', 'عيار 22'), [
    { text: 'سعر جرام الذهب ' },
    { text: 'عيار ', karat: true, digit: false },
    { text: '22', karat: true, digit: true },
    { text: ' الآن' },
  ]);
  assert.deepEqual(karatPieces('Price per gram of 22 karat gold, now', '22 karat'), [
    { text: 'Price per gram of ' },
    { text: '22', karat: true, digit: true },
    { text: ' karat', karat: true, digit: false },
    { text: ' gold, now' },
  ]);
});

test('a sentence without the karat phrase stays one plain piece', () => {
  assert.deepEqual(karatPieces('لوحة الأسعار', 'عيار 22'), [{ text: 'لوحة الأسعار' }]);
});
