import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tipLines, opensItself } from '../app/js/install.js';

test('the tip shows one line about the browser\'s box when the button can open it', () => {
  assert.deepEqual(tipLines({ ios: false, android: true, canPrompt: true }), ['installNext']);
  assert.deepEqual(tipLines({ ios: false, android: false, canPrompt: true }), ['installNext']);
});

test('without the browser\'s box, each phone gets its own menu steps', () => {
  assert.deepEqual(tipLines({ ios: true, android: false, canPrompt: false }), ['installIos']);
  assert.deepEqual(tipLines({ ios: false, android: true, canPrompt: false }), ['installAndroid']);
  assert.deepEqual(tipLines({ ios: false, android: false, canPrompt: false }), ['installIos', 'installAndroid']);
});

test('Android opens the tip on its own only once the browser offers its install box', () => {
  const phone = { ios: false, android: true, standalone: false, tips: {} };
  assert.equal(opensItself({ ...phone, canPrompt: false }), false);
  assert.equal(opensItself({ ...phone, canPrompt: true }), true);
});

test('people who closed the old menu steps see the one-tap button once', () => {
  const phone = { ios: false, android: true, standalone: false, canPrompt: true };
  assert.equal(opensItself({ ...phone, tips: { install: true } }), true);
  assert.equal(opensItself({ ...phone, tips: { install: true, installApp: true } }), false);
});

test('iPhones keep their steps, computers wait to be asked, and an installed app shows nothing', () => {
  assert.equal(opensItself({ ios: true, android: false, standalone: false, canPrompt: false, tips: {} }), true);
  assert.equal(opensItself({ ios: true, android: false, standalone: false, canPrompt: false, tips: { install: true } }), false);
  assert.equal(opensItself({ ios: false, android: false, standalone: false, canPrompt: true, tips: {} }), false);
  assert.equal(opensItself({ ios: false, android: true, standalone: true, canPrompt: true, tips: {} }), false);
});
