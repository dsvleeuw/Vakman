import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../data/tradesData';
import { defaultSiteContent } from '../utils/siteContent';
import { publishedSite } from '../utils/publishedContent';
import { SiteView } from './SiteView';
import type { SiteContent } from '../types';

/**
 * The tools on a published page: the price calculator and the postcode
 * check. They work with what the craftsman filled in, and they say nothing
 * about him that he did not say himself.
 */

const FORM = {
  biz: 'Jansen Schilderwerken',
  owner: 'Jan Jansen',
  phone: '0698765432',
  city: 'Haarlem',
};

function content(overrides: Partial<SiteContent> = {}): SiteContent {
  return { ...defaultSiteContent('schilder', 'modern', FORM), ...overrides };
}

function markupOf(withContent: SiteContent): string {
  const active = buildActiveSite(
    withContent.sector,
    0,
    withContent.form,
    withContent.disabledServices,
    undefined,
    true
  );
  const site = publishedSite(active, withContent);
  return renderToStaticMarkup(
    <SiteView site={site} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );
}

test('de calculator toont de diensten en prijzen van de vakman', () => {
  const markup = markupOf(
    content({
      services: [
        { n: 'Binnen schilderwerk', d: 'Wanden en kozijnen', amount: 45, unit: 'per uur' },
        { n: 'Vloer leggen', d: 'Massief hout', amount: 28, unit: 'per m²' },
      ],
    })
  );

  assert.ok(markup.includes('Welke klus wil je laten doen?'));
  assert.ok(markup.includes('Binnen schilderwerk'));
  assert.ok(markup.includes('€ 45 per uur'));
  assert.ok(markup.includes('€ 28 per m²'));
});

test('de calculator eindigt in een offerteaanvraag', () => {
  const markup = markupOf(
    content({
      services: [{ n: 'Binnen schilderwerk', d: 'Wanden', amount: 45, unit: 'per uur' }],
    })
  );

  assert.ok(markup.includes('JOUW PRIJSINDICATIE'));
  assert.ok(markup.includes('Beantwoord alle vragen voor offerte'));
});

test('zonder eigen prijzen staat er geen calculator op de site', () => {
  const markup = markupOf(content());

  assert.ok(!markup.includes('Welke klus wil je laten doen?'));
  assert.ok(!markup.includes('v.a. € 650'), 'een voorbeeldprijs hoort niet op een klantsite');
});

test('de postcodecheck praat over het werkgebied van de vakman', () => {
  const markup = markupOf(content({ workArea: ['2011 AB', '2031 AA'] }));

  assert.ok(markup.includes('Kom ik bij jou op locatie?'));
  assert.ok(markup.includes('Haarlem'));
  assert.ok(markup.includes('Stuur mijn postcode'));
  assert.ok(!markup.includes('+ 25 km'), 'de straal van het voorbeeld hoort niet bij de klant');
  assert.ok(!markup.includes('geen extra voorrijkosten'), 'dat is een belofte van de vakman');
});

test('zonder eigen werkgebied staat er geen postcodecheck op de site', () => {
  const markup = markupOf(content());

  assert.ok(!markup.includes('Kom ik bij jou op locatie?'));
});
