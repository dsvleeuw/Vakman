import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENING_DEDUCTION_M2,
  parsePricePerM2,
  calculateSurfaceArea,
  calculateM2Estimate,
} from './surface';

test('parsePricePerM2 extracts euro values from per-m² service labels', () => {
  assert.equal(parsePricePerM2('€ 18 per m²'), 18);
  assert.equal(parsePricePerM2('€ 27 per m²'), 27);
  assert.equal(parsePricePerM2('v.a. € 650 per stuk'), null);
  assert.equal(parsePricePerM2('op nacalculatie'), null);
  assert.equal(parsePricePerM2(''), null);
});

test('calculateSurfaceArea sums wall dimensions and deducts openings', () => {
  // Two walls of 5 x 2.5 and 4 x 2.5 = 12.5 + 10 = 22.5 m²
  assert.equal(
    calculateSurfaceArea([
      { length: 5, height: 2.5 },
      { length: 4, height: 2.5 },
    ]),
    22.5
  );

  // One opening deducts OPENING_DEDUCTION_M2
  assert.equal(
    calculateSurfaceArea([{ length: 4, height: 3 }], 1),
    12 - OPENING_DEDUCTION_M2
  );

  // Negative/zero dimensions are treated as zero, result never below zero
  assert.equal(
    calculateSurfaceArea([
      { length: -5, height: 2.5 },
      { length: 0, height: 3 },
    ]),
    0
  );
  assert.equal(calculateSurfaceArea([{ length: 2, height: 2 }], 10), 0);
});

test('calculateM2Estimate multiplies surface by price and rounds to whole euros', () => {
  assert.equal(calculateM2Estimate(42, 18), 756);
  assert.equal(calculateM2Estimate(22.5, 18), 405);
  assert.equal(calculateM2Estimate(0, 18), 0);
});
