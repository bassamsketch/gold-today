import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, save } from '../app/js/store.js';

const memory = (init) => {
  const mem = new Map(init);
  return { mem, getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
};

test('load survives corrupted storage', () => {
  assert.deepEqual(load(memory([['goldToday', '{not json']])), { v: 1, lang: 'ar', karat: 22, pieces: [], last: null, tips: {} });
});

test('load keeps good fields and drops bad pieces', () => {
  const s = load(memory([['goldToday', JSON.stringify({ v: 1, lang: 'en', karat: 99, pieces: [{ id: 'a', name: 'x', grams: 10, karat: 21, boughtPrice: null, boughtYm: null }, { grams: -1 }] })]]));
  assert.equal(s.lang, 'en');
  assert.equal(s.karat, 22);
  assert.equal(s.pieces.length, 1);
  assert.equal(s.pieces[0].id, 'a');
});

test('load works without any storage', () => {
  assert.equal(load(undefined).lang, 'ar');
  assert.equal(load({ getItem: () => { throw new Error('blocked'); } }).karat, 22);
});

test('save then load round-trips the state', () => {
  const st = memory([]);
  const state = { v: 1, lang: 'en', karat: 21, pieces: [], last: { usd: 3470, updatedAt: 1795608000000 }, tips: { install: true } };
  save(state, st);
  assert.deepEqual(load(st), state);
});
