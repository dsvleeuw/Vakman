import test from 'node:test';
import assert from 'node:assert/strict';
import { buildActiveSite, SECTORS } from '../data/tradesData';
import { DEFAULT_BLOCK_ORDER, mergeBlocks } from '../data/blocks';
import {
  applySiteContent,
  defaultSiteContent,
  moveBlock,
  sanitizeSiteContent,
  setBlockEnabled,
} from './siteContent';

const form = { biz: 'Schildersbedrijf Jansen', owner: 'Jan Jansen', phone: '0612345678', city: 'Hoofddorp' };

test('een nieuwe site start met de standaardblokken en de tekst van het vak', () => {
  const content = defaultSiteContent('schilder', 'modern', form);

  assert.deepEqual(content.blocks, DEFAULT_BLOCK_ORDER);
  assert.equal(content.sector, 'schilder');
  assert.equal(content.styleId, 'modern');
  assert.equal(content.text.headline, SECTORS.schilder.headline);
  assert.ok(content.text.kicker.includes('HOOFDDORP'));
  assert.ok(content.text.about.startsWith('Ik ben Jan.'));
  assert.equal(content.blockContent['trust-bar']?.items.length, 4);
});

test('de gekozen add-ons komen als blokken op de site', () => {
  const blocks = mergeBlocks(DEFAULT_BLOCK_ORDER, ['trust-bar', 'contact-cta']);

  assert.deepEqual(blocks, [...DEFAULT_BLOCK_ORDER, 'trust-bar', 'contact-cta']);
});

test('de voor/na-slider blijft bij het portfolio en wordt geen blok', () => {
  const blocks = mergeBlocks(DEFAULT_BLOCK_ORDER, ['before-after']);

  assert.deepEqual(blocks, DEFAULT_BLOCK_ORDER);
});

test('een blok aanzetten zet hem achteraan, uitzetten haalt hem weg', () => {
  const on = setBlockEnabled(DEFAULT_BLOCK_ORDER, 'trust-bar', true);
  const off = setBlockEnabled(on, 'price-calculator', false);

  assert.deepEqual(on, [...DEFAULT_BLOCK_ORDER, 'trust-bar']);
  assert.ok(!off.includes('price-calculator'));
  assert.equal(off.length, DEFAULT_BLOCK_ORDER.length);
});

test('een blok verplaatsen werkt en stopt aan de randen', () => {
  const moved = moveBlock([...DEFAULT_BLOCK_ORDER], 'price-calculator', 1);

  assert.equal(moved[1], 'price-calculator');
  assert.equal(moved[0], 'area-checker');
  assert.deepEqual(moveBlock(moved, 'area-checker', -1), moved);
});

test('de tekst van de craftsman overschrijft die van het vak', () => {
  const content = defaultSiteContent('schilder', 'modern', form);
  content.text.headline = 'Verf die niet aflaakt.';

  const site = applySiteContent(buildActiveSite('schilder', 0, form), content);

  assert.equal(site.headline, 'Verf die niet aflaakt.');
  assert.equal(site.biz, 'Schildersbedrijf Jansen');
  assert.equal(site.city, 'Hoofddorp');
});

test('een leeg veld valt terug op de tekst van het vak', () => {
  const content = defaultSiteContent('schilder', 'modern', form);
  content.text.headline = '   ';

  const site = applySiteContent(buildActiveSite('schilder', 0, form), content);

  assert.equal(site.headline, SECTORS.schilder.headline);
});

test('de tekst van een blok komt op de site', () => {
  const content = defaultSiteContent('loodgieter', 'donker', form);
  content.blocks = setBlockEnabled(content.blocks, 'opening-hours', true);
  content.blockContent['opening-hours'] = {
    hours: [{ days: 'Maandag', time: '08:00 – 17:00' }],
    note: 'Altijd bereikbaar op 06 12345678.',
  };

  const site = applySiteContent(buildActiveSite('loodgieter', 3, form), content);

  assert.equal(site.blockContent['opening-hours']?.hours[0]?.time, '08:00 – 17:00');
  assert.equal(site.blocks.includes('opening-hours'), true);
});

test('opslaan en teruglezen geeft hetzelfde document terug', () => {
  const content = defaultSiteContent('elektricien', 'klassiek', form);
  content.blocks = setBlockEnabled(content.blocks, 'trust-bar', true);
  content.disabledServices = { 1: true };

  const restored = sanitizeSiteContent(JSON.parse(JSON.stringify(content)));

  assert.ok(restored);
  assert.deepEqual(restored?.blocks, content.blocks);
  assert.deepEqual(restored?.disabledServices, { 1: true });
  assert.equal(restored?.form.biz, 'Schildersbedrijf Jansen');
});

test('een document van een andere versie of met onbekende blokken wordt genegeerd', () => {
  assert.equal(sanitizeSiteContent(null), null);
  assert.equal(sanitizeSiteContent({ version: 99, sector: 'schilder' }), null);
  assert.equal(sanitizeSiteContent({ version: 1, sector: 'niet-bestaand' }), null);

  const restored = sanitizeSiteContent({
    version: 1,
    sector: 'schilder',
    styleId: 'modern',
    blocks: ['trust-bar', 'onzin', 42],
    form: { biz: 'X', owner: 'Y', phone: '', city: '' },
  });

  assert.deepEqual(restored?.blocks, ['trust-bar']);
});
