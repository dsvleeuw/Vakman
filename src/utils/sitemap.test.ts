import test from 'node:test';
import assert from 'node:assert/strict';
import type { PublishedSiteRecord } from '../types';
import { buildPublishedSitesSitemap, marketingSitemapPaths } from './sitemap';

test("de marketingpagina's staan in de sitemap van de build", () => {
  const paths = marketingSitemapPaths();

  assert.ok(paths.includes('/'));
  assert.ok(paths.includes('/privacy'));
  assert.ok(paths.includes('/voorbeeld/schilder/modern'));
  assert.equal(paths.length, 3 + 7 * 5);
});

test('gepubliceerde sites staan in hun eigen sitemap', () => {
  const sites: PublishedSiteRecord[] = [
    {
      slug: 'jansen-schilderwerken',
      token: 'geheim',
      sector: 'schilder',
      styleId: 'modern',
      form: { biz: 'Jansen', owner: 'Jan', phone: '0698765432', city: 'Haarlem' },
      channel: 'WhatsApp',
      disabledServices: {},
      blocks: [],
      blockContent: {},
      text: {
        kicker: '',
        headline: '',
        intro: '',
        about: '',
        cta1: '',
        cta2: '',
      },
      timestamp: Date.parse('2026-01-01T00:00:00Z'),
      updatedAt: Date.parse('2026-02-03T00:00:00Z'),
    },
  ];

  const xml = buildPublishedSitesSitemap(sites, 'https://klusbaas.nl');

  assert.ok(xml.includes('<loc>https://klusbaas.nl/site/jansen-schilderwerken</loc>'));
  assert.ok(xml.includes('<lastmod>2026-02-03</lastmod>'));
  assert.ok(!xml.includes('geheim'), 'het beheertoken hoort niet in de sitemap');
});
