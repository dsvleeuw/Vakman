import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildActiveSite } from '../../data/tradesData';
import { GardenPlanForm } from './GardenPlanForm';

/**
 * De tuinplan van de hovenier: de bezoeker geeft de grootte van de tuin en
 * het werk, en krijgt een indicatie of een eerlijk "op aanvraag".
 */

const site = buildActiveSite('hovenier', 0, undefined, undefined, null);

test('het tuinplan vraagt om naam, telefoon, adres en de grootte van de tuin', () => {
  const markup = renderToStaticMarkup(<GardenPlanForm site={site} />);

  assert.ok(markup.includes('Wat wil je laten doen?'));
  assert.ok(markup.includes('Grootte van de tuin (m²)'));
  assert.ok(markup.includes('Adres van de tuin'));
  assert.ok(markup.includes('Je naam'));
  assert.ok(markup.includes('Telefoonnummer'));
  assert.ok(markup.includes('Vraag een tuinplan'));
});

test('de diensten van de hovenier staan in de lijst', () => {
  const markup = renderToStaticMarkup(<GardenPlanForm site={site} />);

  assert.ok(markup.includes('Tuinonderhoud'));
  assert.ok(markup.includes('Sierbestrating'));
});

test('zonder grootte is er geen bedrad, maar wel een eerlijke uitleg', () => {
  const markup = renderToStaticMarkup(<GardenPlanForm site={site} />);

  assert.ok(!markup.includes('Indicatie: €'), 'er staat geen bedrag zonder grootte');
  assert.ok(markup.includes('maakt'), 'er staat wie de prijs maakt');
});

test('het tuinplan is een echt formulier met labels', () => {
  const markup = renderToStaticMarkup(<GardenPlanForm site={site} />);

  assert.ok(markup.includes('<form'));
  assert.ok(markup.includes('for='), 'elk veld heeft een label');
});
