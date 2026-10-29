import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../data/tradesData';
import { SiteView } from './SiteView';

test('de footer noemt alleen een KvK-nummer dat de klant zelf heeft ingevuld', () => {
  const withoutKvk = buildActiveSite('schilder', 0, undefined, undefined, null);
  const markup = renderToStaticMarkup(
    <SiteView site={withoutKvk} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );

  assert.ok(!markup.includes('12345678'), 'een verzonnen KvK-nummer hoort niet op de site');
  assert.ok(!markup.includes('· KvK'), 'de footer noemt geen KvK-nummer');

  const withKvk = buildActiveSite(
    'schilder',
    0,
    { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem', kvk: '87654321' },
    undefined,
    null
  );
  const kvkMarkup = renderToStaticMarkup(
    <SiteView site={withKvk} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );

  assert.ok(kvkMarkup.includes('KvK 87654321'));
});

test('op een klantsite zonder eigen nummer staan geen bel- en WhatsApp-knoppen', () => {
  const site = buildActiveSite(
    'schilder',
    0,
    { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '', city: 'Haarlem' },
    undefined,
    '0201234567',
    true
  );
  const markup = renderToStaticMarkup(
    <SiteView site={site} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );

  assert.ok(!markup.includes('tel:'), 'geen belknop zonder nummer van de klant');
  assert.ok(!markup.includes('wa.me'), 'geen WhatsApp-knop zonder nummer van de klant');
  assert.ok(!markup.includes('02 01 23 45 67'), 'geen demonummer op een klantsite');
});


test('het contactformulier vertelt wie de aanvraag krijgt', () => {
  const demo = buildActiveSite('schilder', 0, undefined, undefined, null);
  const demoMarkup = renderToStaticMarkup(
    <SiteView site={demo} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );
  assert.ok(
    demoMarkup.includes('Dit is een demosite: je bericht komt bij Klusbaas binnen.'),
    'op een demosite moet de tekst zeggen dat de aanvraag bij Klusbaas komt'
  );

  const customer = {
    ...buildActiveSite(
      'schilder',
      0,
      { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
      undefined,
      null,
      true
    ),
    publishedSlug: 'jansen-schilderwerken',
  };
  const customerMarkup = renderToStaticMarkup(
    <SiteView site={customer} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );
  assert.ok(
    customerMarkup.includes('Je bericht gaat direct naar Jansen Schilderwerken.'),
    'op een klantsite moet de tekst zeggen dat de aanvraag naar de vakman gaat'
  );
  assert.ok(
    !customerMarkup.includes('Dit is een demosite'),
    'een klantsite is geen demosite'
  );
});

test('op een klantsite wijst de privacylink naar de verklaring van die site', () => {
  const customer = {
    ...buildActiveSite(
      'schilder',
      0,
      { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
      undefined,
      null,
      true
    ),
    publishedSlug: 'jansen-schilderwerken',
  };
  const markup = renderToStaticMarkup(
    <SiteView site={customer} selectedSector="schilder" selectedStyleIndex={0} embedded />
  );
  assert.ok(
    markup.includes('/site/jansen-schilderwerken/privacy'),
    'de privacylink moet naar de verklaring van de klantsite wijzen'
  );
  // De nieuwsbrief onderin de voet blijft naar de verklaring van Klusbaas
  // wijzen: die nieuwsbrief is van Klusbaas, niet van de vakman.
  assert.ok(markup.includes('href="/privacy"'), 'de nieuwsbrief hoort bij Klusbaas');
});
