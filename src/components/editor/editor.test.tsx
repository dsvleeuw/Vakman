import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteEditor } from './SiteEditor';
import { TextField } from './Field';

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
