import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANS, getPlan, isPlanId } from './plans';

/**
 * The packages are a promise on a public page. What Klusbaas does not
 * builds does not go on the list (VISION principle 2).
 */
test('elk pakket heeft prijs, tekst en voordelen', () => {
  assert.equal(PLANS.length, 3);
  for (const plan of PLANS) {
    assert.ok(plan.price > 0, `${plan.name} moet een prijs hebben`);
    assert.ok(plan.blurb.trim().length > 0, `${plan.name} moet een intro hebben`);
    assert.ok(plan.features.length >= 5, `${plan.name} moet zijn voordelen tonen`);
  }
});

test('de beloftes die Klusbaas niet bouwt staan niet op de lijst', () => {
  const verboden = [
    'Bedrijfsprofiel',
    'Google-badge',
    'eerste jaar inbegrepen',
    'Meerdere pagina',
    'Google Drive',
  ];
  for (const plan of PLANS) {
    for (const feature of plan.features) {
      for (const claim of verboden) {
        assert.ok(
          !feature.includes(claim),
          `"${claim}" hoort niet in pakket ${plan.name}: "${feature}"`
        );
      }
    }
  }
});

test('het Pro-pakket belooft de tools die echt werken', () => {
  const pro = getPlan('pro');
  assert.ok(pro);
  const features = pro.features.join(' | ');
  assert.ok(features.includes('prijscalculator'), 'de prijscalculator hoort bij Pro');
  assert.ok(features.includes('eigen prijzen'), 'de prijzen zijn die van de vakman');
  assert.ok(features.includes('Postcodecheck'), 'de postcodecheck hoort bij Pro');
});

test('het pakket van de klant herkennen', () => {
  assert.equal(isPlanId('pro'), true);
  assert.equal(isPlanId('platinum'), false);
  assert.equal(isPlanId(null), false);
});
