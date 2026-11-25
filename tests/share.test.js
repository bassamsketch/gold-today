import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareText } from '../app/js/ui/share.js';

test('shared text says it is the raw gold price and lists the four karats', () => {
  const when = new Date('2026-11-25T15:45:00Z');
  const ar = shareText('ar', 3470, when, 'https://x.test/');
  assert.ok(ar.includes('سعر الذهب الخام'), ar);
  assert.equal(ar.split(/\r?\n/).filter((l) => l.startsWith('عيار')).length, 4);
  assert.ok(shareText('en', 3470, when, 'https://x.test/').includes('Raw gold price'));
});
