import type { StyleId } from '../types';

const STYLE_FONT_HREFS: Record<StyleId, string | null> = {
  klassiek:
    'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap',
  modern:
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap',
  // Signaal ('krachtig') uses Archivo, which is already loaded in index.html.
  krachtig: null,
  donker:
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap',
  minimaal:
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;700;800&display=swap',
};

/**
 * Returns the on-demand Google Fonts stylesheet URL for a preset style, or
 * `null` when the style only uses base fonts already present in `index.html`.
 */
export function getStyleFontHref(styleId: StyleId): string | null {
  return STYLE_FONT_HREFS[styleId] ?? null;
}

/**
 * Appends a `<link rel="stylesheet" data-style-font="...">` tag for `styleId`
 * once if not already present in `doc.head` (including prerendered `<link>`s).
 */
export function ensureStyleFontLoaded(
  styleId: StyleId,
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined
): boolean {
  const href = getStyleFontHref(styleId);
  if (!href || !doc?.head) return false;
  if (doc.head.querySelector(`link[data-style-font="${styleId}"]`)) {
    return false;
  }
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-style-font', styleId);
  doc.head.appendChild(link);
  return true;
}

/** Loads all four extra display fonts (used when comparing all styles at once). */
export function ensureAllStyleFontsLoaded(
  doc: Document | undefined = typeof document !== 'undefined' ? document : undefined
): void {
  (Object.keys(STYLE_FONT_HREFS) as StyleId[]).forEach((styleId) => {
    ensureStyleFontLoaded(styleId, doc);
  });
}
