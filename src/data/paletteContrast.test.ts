import test from 'node:test';
import assert from 'node:assert/strict';
import { AA_TEXT, contrastRatio } from '../utils/color';
import { ORDER, SECTORS, STYLES, buildActiveSite, computePalette } from './tradesData';

/**
 * The five styles are generated from per-trade OKLCH inputs, so contrast has
 * to be guaranteed for every combination rather than eyeballed per preset.
 * Each pair below is text that really appears on that surface in `SiteView`.
 */
const TEXT_PAIRS: Array<[keyof ReturnType<typeof computePalette>, keyof ReturnType<typeof computePalette>]> = [
  ['fg', 'bg'],
  ['fg', 'card'],
  ['muted', 'bg'],
  ['muted', 'card'],
  ['accentText', 'bg'],
  ['invFg', 'invBg'],
  ['invMuted', 'invBg'],
  ['onAccent', 'accent'],
  ['onHi', 'hi'],
];

test('every generated palette keeps text at WCAG AA contrast', () => {
  const failures: string[] = [];

  for (const sectorId of ORDER) {
    for (const style of STYLES) {
      const palette = computePalette(SECTORS[sectorId], style);
      for (const [textToken, surfaceToken] of TEXT_PAIRS) {
        const ratio = contrastRatio(palette[textToken] as string, palette[surfaceToken] as string);
        if (ratio < AA_TEXT) {
          failures.push(
            `${sectorId}/${style.name}: ${textToken} on ${surfaceToken} = ${ratio.toFixed(2)}`
          );
        }
      }
    }
  }

  assert.deepEqual(failures, [], `contrast failures:\n${failures.join('\n')}`);
});

test('palette dividers stay subtle but visible against the page', () => {
  // `line` is a decorative divider, not a control boundary, so the brand look
  // wins over 3:1 here; it only has to be perceptible (>1.2:1). Form control
  // boundaries are checked in the component styles instead.
  const failures: string[] = [];

  for (const sectorId of ORDER) {
    for (const style of STYLES) {
      const palette = computePalette(SECTORS[sectorId], style);
      const ratio = contrastRatio(palette.line, palette.bg);
      if (ratio < 1.2) {
        failures.push(`${sectorId}/${style.name}: line on bg = ${ratio.toFixed(2)}`);
      }
    }
  }

  assert.deepEqual(failures, [], `divider contrast failures:\n${failures.join('\n')}`);
});

test('form control boundaries reach 3:1 against the card they sit on', () => {
  // The generated sites render inputs with the shared `border-stone-500`
  // token; assert the chosen colour really passes non-text contrast there.
  const border = '#78716c'; // stone-500
  const card = '#ffffff';
  assert.ok(contrastRatio(border, card) >= 3, `input border = ${contrastRatio(border, card).toFixed(2)}`);
});

test('customised wizard data does not break the contrast contract', () => {
  const site = buildActiveSite('loodgieter', 2, {
    biz: 'Test Loodgieters',
    owner: 'Ali Bakker',
    phone: '06 12345678',
    city: 'Rotterdam',
  });
  assert.ok(contrastRatio(site.fg, site.bg) >= AA_TEXT);
  assert.ok(contrastRatio(site.muted, site.card) >= AA_TEXT);
  assert.ok(contrastRatio(site.onAccent, site.accent) >= AA_TEXT);
});

test('fixed WhatsApp button colours keep AA contrast on their surfaces', () => {
  // The WhatsApp green is a fixed brand colour, not a palette token, so its
  // text colours are asserted directly: stone-950 on #25D366 (white only
  // reaches 1.98:1) and #0F7F44 on the white button (#128C4B only 4.30:1).
  assert.ok(
    contrastRatio('#0c0a09', '#25D366') >= AA_TEXT,
    `stone-950 on WhatsApp green = ${contrastRatio('#0c0a09', '#25D366').toFixed(2)}`
  );
  assert.ok(
    contrastRatio('#0f7f44', '#ffffff') >= AA_TEXT,
    `#0F7F44 on white = ${contrastRatio('#0f7f44', '#ffffff').toFixed(2)}`
  );
});
