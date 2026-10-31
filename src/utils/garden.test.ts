import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGardenEstimate, gardenEstimate, parseGardenSize } from './garden';

/**
 * De tuinprijs van de hovenier: de grootte van de tuin maal de prijs per
 * m². Voor werk zonder prijs per m² is er geen bedrag: dan maakt de
 * hovenier de prijs zelf.
 */

test('de grootte van de tuin wordt gelezen', () => {
  assert.equal(parseGardenSize('120'), 120);
  assert.equal(parseGardenSize('120,5'), 120.5);
  assert.equal(parseGardenSize('120 m²'), 120);
  assert.equal(parseGardenSize('ongeveer 80'), 80);
  assert.equal(parseGardenSize(''), 0);
  assert.equal(parseGardenSize('abc'), 0);
  assert.equal(parseGardenSize('-5'), 0);
});

test('de indicatie is de grootte maal de prijs per m²', () => {
  assert.equal(gardenEstimate(120, { name: 'Sierbestrating', pricePerM2: 58 }), 6960);
  assert.equal(gardenEstimate(25, { name: 'Sierbestrating', pricePerM2: 58 }), 1450);
});

test('zonder prijs per m² is er geen indicatie', () => {
  assert.equal(gardenEstimate(120, { name: 'Tuinonderhoud' }), null);
  assert.equal(gardenEstimate(120, { name: 'Sierbestrating', pricePerM2: 0 }), null);
});

test('zonder grootte is er geen indicatie', () => {
  assert.equal(gardenEstimate(0, { name: 'Sierbestrating', pricePerM2: 58 }), null);
});

test('het bedrag leest als euro', () => {
  assert.equal(formatGardenEstimate(6960), '€ 6.960');
  assert.equal(formatGardenEstimate(null), '');
});
