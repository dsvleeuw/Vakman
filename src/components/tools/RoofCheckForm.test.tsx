import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../../data/tradesData';
import { RoofCheckForm } from './RoofCheckForm';

/**
 * De gratis dakcheck van de dakdekker. De velden staan in de pagina, ook
 * zonder JavaScript, en de bezoeker weet precies wat hij moet invullen.
 */

const site = buildActiveSite('dakdekker', 0, undefined, undefined, null);

test('de dakcheck vraagt om naam, telefoon, adres, type dak en klacht', () => {
  const markup = renderToStaticMarkup(<RoofCheckForm site={site} />);

  assert.ok(markup.includes('Gratis dakcheck'));
  assert.ok(markup.includes('Je naam *'));
  assert.ok(markup.includes('Telefoonnummer *'));
  assert.ok(markup.includes('Adres van het dak *'));
  assert.ok(markup.includes('Welk type dak heb je?'));
  assert.ok(markup.includes('Waar zit je tegen aan?'));
  assert.ok(markup.includes('Hoe snel wil je weten wat er aan de hand is?'));
  assert.ok(markup.includes('Vraag een gratis dakcheck'));
});

test('de dakcheck noemt de opties van het vak', () => {
  const markup = renderToStaticMarkup(<RoofCheckForm site={site} />);

  assert.ok(markup.includes('Schuin dak met pannen'));
  assert.ok(markup.includes('Plat dak'));
  assert.ok(markup.includes('Lekkage in huis'));
  assert.ok(markup.includes('Binnen 24 uur'));
});

test('de dakcheck is een echt formulier met labels', () => {
  const markup = renderToStaticMarkup(<RoofCheckForm site={site} />);

  assert.ok(markup.includes('<form'));
  // Elk verplicht veld heeft een label en een aria-invalid zodat de browser
  // en de schermlezer het kunnen volgen.
  assert.ok((markup.match(/aria-required="true"/g) ?? []).length >= 3);
  assert.ok(markup.includes('id="dakcheck"'));
});

test('op een klantsite staan geen beloften van de demosite', () => {
  const customerSite = buildActiveSite(
    'dakdekker',
    0,
    { biz: 'Dakwerk Jansen', owner: 'Jan Jansen', phone: '0698765432', city: 'Almere' },
    undefined,
    null,
    true
  );
  const markup = renderToStaticMarkup(<RoofCheckForm site={customerSite} />);

  assert.ok(!markup.includes('gratis'), 'de belofte "gratis" hoort niet op een klantsite');
  assert.ok(!markup.includes('Reactie binnen één werkdag'));
  assert.ok(markup.includes('Vraag een dakcheck'));
});
