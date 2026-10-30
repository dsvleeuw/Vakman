import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultSiteContent } from '../../utils/siteContent';
import { SiteEditor } from './SiteEditor';
import { OfferteTab } from './OfferteTab';
import { TextField } from './Field';

const form = {
  biz: 'Schildersbedrijf Jansen',
  owner: 'Jan Jansen',
  phone: '0612345678',
  city: 'Hoofddorp',
};

test('de editor toont de site en de blokken die de klant kan zetten', () => {
  const markup = renderToStaticMarkup(<SiteEditor sector="schilder" styleId="modern" />);

  assert.ok(markup.includes('Je eigen site'));
  assert.ok(markup.includes('Blok toevoegen'));
  assert.ok(markup.includes('Prijscalculator'));
  assert.ok(!markup.includes('undefined'));
});

test('elk veld heeft een label dat bij het veld hoort', () => {
  const markup = renderToStaticMarkup(
    <TextField label="Bedrijfsnaam" value="De Vries Schilderwerken" onChange={() => {}} />
  );

  const labelFor = markup.match(/<label[^>]*for="([^"]+)"/);
  const inputId = markup.match(/<input[^>]*id="([^"]+)"/);

  assert.ok(labelFor, 'het label moet naar een veld verwijzen');
  assert.ok(inputId, 'het veld moet een id hebben');
  assert.equal(labelFor?.[1], inputId?.[1]);
});

test('de editor heeft een tab Offerte: de klant vraagt zelf een offerte aan', () => {
  const markup = renderToStaticMarkup(<SiteEditor sector="schilder" styleId="modern" />);

  assert.ok(markup.includes('Offerte'));
  assert.ok(markup.includes('Naar de site-editor') === false);
});

test('zonder account vraagt de klant eerst om in te loggen', () => {
  const markup = renderToStaticMarkup(
    <OfferteTab
      account={null}
      content={defaultSiteContent('schilder', 'klassiek', form)}
      sector="schilder"
      styleId="klassiek"
      onOpenDetails={() => {}}
    />
  );

  assert.ok(markup.includes('Log in om een offerte aan te vragen'));
  assert.ok(!markup.includes('Vraag je offerte aan'));
});

test('met account kiest de klant zelf zijn pakket en ziet hij meteen de prijs', () => {
  const markup = renderToStaticMarkup(
    <OfferteTab
      account={{ id: 'acc-1', email: 'jan@jansen.nl', verified: true }}
      content={defaultSiteContent('schilder', 'klassiek', form)}
      sector="schilder"
      styleId="klassiek"
      onOpenDetails={() => {}}
    />
  );

  assert.ok(markup.includes('Offerte aanvragen'));
  assert.ok(markup.includes('Vraag je offerte aan'));
  // De prijs komt uit de catalogus: Pro is 995 euro excl. btw.
  assert.ok(markup.includes('€ 995,00'));
  assert.ok(markup.includes('€ 1.203,95'));
  assert.ok(markup.includes('Wat wil je dat wij doen?'));
});
