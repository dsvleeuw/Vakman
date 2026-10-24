import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureAllStyleFontsLoaded,
  ensureStyleFontLoaded,
  getStyleFontHref,
} from './fonts';

function createFakeDocument() {
  const links: Array<{ rel: string; href: string; attr: Record<string, string> }> = [];
  const doc = {
    head: {
      querySelector(selector: string) {
        const match = selector.match(/^link\[data-style-font="([^"]+)"\]$/);
        if (!match) return null;
        return links.find((l) => l.attr['data-style-font'] === match[1]) ?? null;
      },
      appendChild(el: { rel: string; href: string; attr: Record<string, string> }) {
        links.push(el);
        return el;
      },
    },
    createElement() {
      const attr: Record<string, string> = {};
      return {
        rel: '',
        href: '',
        attr,
        setAttribute(k: string, v: string) {
          attr[k] = v;
        },
      };
    },
  } as unknown as Document;

  return { doc, links };
}

test('getStyleFontHref only returns extra Google Fonts for styles that do not use Archivo', () => {
  assert.equal(getStyleFontHref('krachtig'), null);
  assert.match(getStyleFontHref('klassiek') ?? '', /DM\+Serif\+Display/);
  assert.match(getStyleFontHref('modern') ?? '', /Space\+Grotesk/);
  assert.match(getStyleFontHref('donker') ?? '', /Instrument\+Serif/);
  assert.match(getStyleFontHref('minimaal') ?? '', /Bricolage\+Grotesque/);
  assert.match(getStyleFontHref('minimaal') ?? '', /display=swap/);
});

test('ensureStyleFontLoaded appends each style font stylesheet at most once and skips SSR', () => {
  assert.equal(ensureStyleFontLoaded('klassiek', undefined), false);

  const { doc, links } = createFakeDocument();
  assert.equal(ensureStyleFontLoaded('krachtig', doc), false);
  assert.equal(links.length, 0);

  assert.equal(ensureStyleFontLoaded('klassiek', doc), true);
  assert.equal(ensureStyleFontLoaded('klassiek', doc), false);
  assert.equal(links.length, 1);
  assert.equal(links[0].attr['data-style-font'], 'klassiek');

  ensureAllStyleFontsLoaded(doc);
  assert.equal(links.length, 4);
});
