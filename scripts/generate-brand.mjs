/**
 * Generates the Klusbaas brand files from one geometry definition:
 *
 *   public/brand/klusbaas-mark.svg        beeldmerk (light backgrounds)
 *   public/brand/klusbaas-logo.svg        beeldmerk + woordmerk, horizontal
 *   public/brand/klusbaas-logo-light.svg  same, for dark backgrounds
 *   public/favicon.svg                    beeldmerk on a stone-900 tile
 *   src/data/brandMark.ts                 path data for <Logo> and the PDF
 *
 * The beeldmerk is a K: a stone stem plus an amber carpenter's square
 * (winkelhaak) turned 45°, its blade marked with graduation notches.
 * The woordmerk is "Klusbaas" in Archivo 900, converted to outlines so the
 * SVG files render the same everywhere without a web font.
 *
 * Needs two tools that are not app dependencies; install them in a scratch
 * folder and point BRAND_TOOLS at its node_modules:
 *   npm install opentype.js@1.3.4 @fontsource/archivo@5.1.0
 *   BRAND_TOOLS=/path/to/node_modules node scripts/generate-brand.mjs
 * PNG icons and og-image.png are rendered from these SVGs with headless
 * Chrome (see README, section Huisstijl).
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tools = process.env.BRAND_TOOLS;
if (!tools) throw new Error('Set BRAND_TOOLS to a node_modules folder with opentype.js and @fontsource/archivo');
const require = createRequire(join(tools, 'noop.js'));
const opentype = require('opentype.js');

export const COLORS = {
  ink: '#1c1917', // stone-900
  inkLight: '#fafaf9', // stone-50
  amber: '#d97706', // amber-600: 3:1 on stone-100 for the graphic
  amberLight: '#fbbf24', // amber-400 on stone-900
};

const r = (n) => Math.round(n * 100) / 100;
const pt = ([x, y]) => `${r(x)} ${r(y)}`;
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const poly = (points) => `M${points.map(pt).join('L')}Z`;

// ---- Beeldmerk geometry, 64×64 box -------------------------------------
const stem = poly([[8, 8], [20, 8], [20, 56], [8, 56]]);
const s2 = Math.SQRT1_2;
const up = [s2, -s2]; // along the short arm (stock)
const down = [s2, s2]; // along the long arm (blade)
const V = [23.5, 32]; // outer corner of the square, next to the stem
const t = 11; // arm thickness
const stockLength = 30;
const bladeLength = 34;
const inner = add(add(V, up, t), down, t);
const square = [V, add(V, up, stockLength), add(add(V, up, stockLength), down, t), inner];
// Graduation notches cut into the blade's inner edge.
const notches = [
  { at: 5, depth: 3.8 },
  { at: 10, depth: 2.4 },
  { at: 15, depth: 3.8 },
  { at: 20, depth: 2.4 },
];
const notchWidth = 1.6;
const innerEdge = (s) => add(add(V, up, t), down, s);
for (const notch of notches) {
  const s = t + notch.at;
  const a = innerEdge(s - notchWidth / 2);
  const b = innerEdge(s + notchWidth / 2);
  square.push(a, add(a, up, -notch.depth), add(b, up, -notch.depth), b);
}
square.push(innerEdge(bladeLength), add(V, down, bladeLength));
const squarePath = poly(square);

// ---- Woordmerk ----------------------------------------------------------
const font = opentype.parse(
  require('node:fs').readFileSync(join(tools, '@fontsource/archivo/files/archivo-latin-900-normal.woff')).buffer
);
const capHeight = font.tables.os2.sCapHeight || 0.7 * font.unitsPerEm;
const fontSize = (48 / capHeight) * font.unitsPerEm; // cap height = stem height
const tracking = -0.015 * fontSize;
const baseline = 56;
const wordX = 66;
let x = wordX;
const word = 'Klusbaas';
const glyphs = font.stringToGlyphs(word);
let wordPath = '';
glyphs.forEach((glyph, index) => {
  wordPath += glyph.getPath(x, baseline, fontSize).toPathData(2);
  const next = glyphs[index + 1];
  const kern = next ? font.getKerningValue(glyph, next) : 0;
  x += ((glyph.advanceWidth + kern) / font.unitsPerEm) * fontSize + tracking;
});
const logoWidth = Math.ceil(x - tracking + 2);

// ---- Files --------------------------------------------------------------
const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const markBody = (ink, amber) => `<path fill="${ink}" d="${stem}"/><path fill="${amber}" d="${squarePath}"/>`;

const write = (file, content) => {
  const full = join(root, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  console.log(`  ${file}`);
};

write('public/brand/klusbaas-mark.svg', svg(64, 64, markBody(COLORS.ink, COLORS.amber), 'Klusbaas'));
write(
  'public/brand/klusbaas-mark-light.svg',
  svg(64, 64, markBody(COLORS.inkLight, COLORS.amberLight), 'Klusbaas')
);
write(
  'public/brand/klusbaas-logo.svg',
  svg(logoWidth, 64, `${markBody(COLORS.ink, COLORS.amber)}<path fill="${COLORS.ink}" d="${wordPath}"/>`, 'Klusbaas')
);
write(
  'public/brand/klusbaas-logo-light.svg',
  svg(
    logoWidth,
    64,
    `${markBody(COLORS.inkLight, COLORS.amberLight)}<path fill="${COLORS.inkLight}" d="${wordPath}"/>`,
    'Klusbaas'
  )
);
// Favicon / app icon: the mark on a stone tile, nudged to its optical centre.
const tile = (rx) =>
  `<rect width="64" height="64" rx="${rx}" fill="${COLORS.ink}"/><g transform="translate(6.7 6.4) scale(0.8)">${markBody('#f5f5f4', COLORS.amberLight)}</g>`;
write('public/favicon.svg', svg(64, 64, tile(14), 'Klusbaas'));
write('public/brand/klusbaas-icon-square.svg', svg(64, 64, tile(0), 'Klusbaas'));

write(
  'src/data/brandMark.ts',
  `// Generated by scripts/generate-brand.mjs — do not edit by hand.
/** Klusbaas beeldmerk in a 64×64 box: the stem and the winkelhaak. */
export const BRAND_MARK = {
  viewBox: '0 0 64 64',
  stem: '${stem}',
  square: '${squarePath}',
} as const;

/** "Klusbaas" in Archivo 900 as outlines; full logo box is ${logoWidth}×64. */
export const BRAND_WORDMARK = {
  width: ${logoWidth},
  path: '${wordPath}',
} as const;

export const BRAND_COLORS = ${JSON.stringify(COLORS, null, 2).replace(/"/g, "'")} as const;
`
);
