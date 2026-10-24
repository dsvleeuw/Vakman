/**
 * Colour maths for the accessibility contract of the generated sites.
 *
 * The five styles derive their palette from per-trade OKLCH inputs, which is
 * great for identity and terrible for guarantees: a vivid accent can silently
 * fall below WCAG AA on a light card. These helpers convert OKLCH to sRGB,
 * compute the WCAG contrast ratio and nudge a colour until it is readable, so
 * every preset is checked once in `data/tradesData.ts` and covered by a test
 * for all 35 combinations.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
  a?: number;
}

/** WCAG AA for normal text. */
export const AA_TEXT = 4.5;
/** WCAG AA for large text and UI borders. */
export const AA_LARGE = 3;

export function parseColor(input: string): Oklch | null {
  const value = input.trim();

  const oklch = value.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+))?\s*\)$/i
  );
  if (oklch) {
    const read = (raw: string, scale: number) =>
      raw.endsWith('%') ? (Number.parseFloat(raw) / 100) * scale : Number.parseFloat(raw);
    const l = read(oklch[1], 1);
    const c = read(oklch[2], 0.4);
    const h = Number.parseFloat(oklch[3]);
    const a = oklch[4] === undefined ? undefined : Number.parseFloat(oklch[4]);
    if ([l, c, h].some((n) => !Number.isFinite(n))) return null;
    return { l: clamp(l, 0, 1), c: Math.max(0, c), h, a };
  }

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((char) => char + char)
            .join('')
        : raw;
    const r = Number.parseInt(full.slice(0, 2), 16) / 255;
    const g = Number.parseInt(full.slice(2, 4), 16) / 255;
    const b = Number.parseInt(full.slice(4, 6), 16) / 255;
    return srgbToOklch(r, g, b);
  }

  return null;
}

export function formatOklch({ l, c, h, a }: Oklch): string {
  const base = `oklch(${round(l)} ${round(c)} ${round(h, 2)})`;
  return a === undefined ? base : `oklch(${round(l)} ${round(c)} ${round(h, 2)} / ${round(a)})`;
}

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** OKLCH → linear sRGB (Björn Ottosson's matrices), clamped to the gamut. */
export function oklchToLinearRgb({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const a = c * Math.cos(radians);
  const b = c * Math.sin(radians);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lCube = lPrime ** 3;
  const mCube = mPrime ** 3;
  const sCube = sPrime ** 3;

  return [
    clamp(4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube, 0, 1),
    clamp(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube, 0, 1),
    clamp(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube, 0, 1),
  ];
}

/** sRGB (0–1) → OKLCH. Used for hex input such as `#ffffff`. */
export function srgbToOklch(r: number, g: number, b: number): Oklch {
  const toLinear = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const h = (Math.atan2(okB, okA) * 180) / Math.PI;
  return {
    l: clamp(okL, 0, 1),
    c: Math.sqrt(okA ** 2 + okB ** 2),
    h: h < 0 ? h + 360 : h,
  };
}

/** WCAG relative luminance. */
export function relativeLuminance(color: string): number {
  const parsed = parseColor(color);
  if (!parsed) return 0;
  const [r, g, b] = oklchToLinearRgb(parsed);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Return `foreground` unchanged when it already contrasts enough with
 * `background`, otherwise move its OKLCH lightness (keeping hue and chroma)
 * just far enough to pass. Falls back to white or near-black when the
 * background sits too close to mid-grey for any tinted colour to work.
 */
export function ensureContrast(foreground: string, background: string, min = AA_TEXT): string {
  if (contrastRatio(foreground, background) >= min) return foreground;

  const fg = parseColor(foreground);
  const bgLuminance = relativeLuminance(background);
  if (!fg) return bestOnColor(background);

  const lighten = bgLuminance < 0.18;
  const fixed: Oklch = { ...fg };
  let best = foreground;
  let bestRatio = contrastRatio(foreground, background);

  for (let step = 0; step <= 100; step += 1) {
    const candidateL = lighten ? fg.l + (1 - fg.l) * (step / 100) : fg.l * (1 - step / 100);
    const candidate = formatOklch({ ...fixed, l: clamp(candidateL, 0, 1) });
    const ratio = contrastRatio(candidate, background);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= min) return candidate;
  }

  const white = '#ffffff';
  const nearBlack = '#141414';
  return contrastRatio(white, background) > contrastRatio(nearBlack, background) ? white : nearBlack;
}

/**
 * Adjust a filled surface (accent chip, highlight bar) so that `text` on top
 * of it is readable. Keeps hue and chroma, only moves lightness — used when
 * neither white nor near-black text reaches AA on the original colour.
 */
export function ensureSurfaceContrast(surface: string, text: string, min = AA_TEXT): string {
  if (contrastRatio(text, surface) >= min) return surface;

  const parsed = parseColor(surface);
  if (!parsed) return surface;

  const textIsLight = relativeLuminance(text) > 0.5;
  let best = surface;
  let bestRatio = contrastRatio(text, surface);

  for (let step = 1; step <= 100; step += 1) {
    const l = textIsLight ? parsed.l * (1 - step / 100) : parsed.l + (1 - parsed.l) * (step / 100);
    const candidate = formatOklch({ ...parsed, l: clamp(l, 0, 1) });
    const ratio = contrastRatio(text, candidate);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= min) return candidate;
  }

  return best;
}

/**
 * Pick the best foreground for a filled surface (accent, highlight, chip).
 * Keeps `preferred` when it is readable, otherwise swaps to white/near-black.
 */
export function bestOnColor(background: string, preferred?: string, min = AA_TEXT): string {
  if (preferred && contrastRatio(preferred, background) >= min) return preferred;

  const white = '#ffffff';
  const nearBlack = '#141414';
  return contrastRatio(white, background) >= contrastRatio(nearBlack, background)
    ? white
    : nearBlack;
}
