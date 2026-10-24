import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AA_TEXT,
  bestOnColor,
  contrastRatio,
  ensureContrast,
  formatOklch,
  parseColor,
  relativeLuminance,
} from './color';

test('contrastRatio matches the WCAG reference values', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(Math.round(contrastRatio('#ffffff', '#ffffff')), 1);
  assert.ok(contrastRatio('#777777', '#ffffff') > 4);
});

test('parseColor reads oklch, hex and rejects nonsense', () => {
  const oklch = parseColor('oklch(0.62 0.15 250)');
  assert.ok(oklch);
  assert.equal(oklch!.l, 0.62);
  assert.equal(oklch!.c, 0.15);
  assert.equal(oklch!.h, 250);

  const withAlpha = parseColor('oklch(0.17 0.012 60 / 0.8)');
  assert.equal(withAlpha!.a, 0.8);

  const white = parseColor('#ffffff');
  assert.ok(white!.l > 0.99);

  assert.equal(parseColor('rebeccapurple'), null);
});

test('relativeLuminance is 0 for black and 1 for white', () => {
  assert.ok(Math.abs(relativeLuminance('#000000')) < 0.001);
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 0.001);
});

test('formatOklch round-trips through parseColor', () => {
  const formatted = formatOklch({ l: 0.42, c: 0.11, h: 28 });
  const parsed = parseColor(formatted);
  assert.equal(parsed!.l, 0.42);
  assert.equal(parsed!.c, 0.11);
});

test('ensureContrast lifts a too-light text colour until it passes AA', () => {
  const tooLight = formatOklch({ l: 0.78, c: 0.02, h: 60 });
  const background = formatOklch({ l: 0.97, c: 0.01, h: 60 });
  assert.ok(contrastRatio(tooLight, background) < AA_TEXT);

  const fixed = ensureContrast(tooLight, background, AA_TEXT);
  assert.ok(
    contrastRatio(fixed, background) >= AA_TEXT,
    `expected ≥ ${AA_TEXT}, got ${contrastRatio(fixed, background)}`
  );
});

test('ensureContrast leaves readable colours untouched', () => {
  const readable = formatOklch({ l: 0.2, c: 0.01, h: 60 });
  const background = formatOklch({ l: 0.97, c: 0.01, h: 60 });
  assert.equal(ensureContrast(readable, background), readable);
});

test('bestOnColor keeps a readable preference and swaps otherwise', () => {
  const lightAccent = formatOklch({ l: 0.86, c: 0.17, h: 95 });
  // White would be unreadable on a light yellow accent → near-black wins.
  assert.notEqual(bestOnColor(lightAccent, '#ffffff'), '#ffffff');
  // The readable preference is kept as-is.
  assert.equal(bestOnColor(lightAccent, '#141414'), '#141414');

  const darkAccent = formatOklch({ l: 0.3, c: 0.1, h: 250 });
  assert.equal(bestOnColor(darkAccent, '#ffffff'), '#ffffff');
});
