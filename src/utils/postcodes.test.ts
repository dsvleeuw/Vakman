import test from 'node:test';
import assert from 'node:assert/strict';
import { areaPrefixes, formatWorkArea, parseWorkArea } from './postcodes';

test('de vakman typt zijn postcodes zoals hij ze kent', () => {
  assert.deepEqual(parseWorkArea('2011 AB'), ['2011 AB']);
  assert.deepEqual(parseWorkArea('2011 AB, 2031 AA'), ['2011 AB', '2031 AA']);
  assert.deepEqual(parseWorkArea('2011ab'), ['2011 AB']);
  assert.deepEqual(parseWorkArea('2011'), ['2011'], 'alleen de cijfers mogen ook');
  assert.deepEqual(parseWorkArea('20'), []);
  assert.deepEqual(parseWorkArea(''), []);
});

test('het werkgebied komt eruit als de postcodes erin staan', () => {
  assert.deepEqual(areaPrefixes(['2011 AB', '2031 AA']), ['20']);
  assert.deepEqual(areaPrefixes(['1011 AB', '1055 AA']), ['10']);
  assert.deepEqual(areaPrefixes([]), []);
});

test('het werkgebied staat als één regel in de editor', () => {
  assert.equal(formatWorkArea(['2011 AB', '2031 AA']), '2011 AB, 2031 AA');
  assert.equal(formatWorkArea([]), '');
});
