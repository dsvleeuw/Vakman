import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimate,
  formatPrice,
  formatPhoneNumber,
  generateDomainSlug,
  validatePostalCode,
  validateWizardForm,
  getOklchColor,
} from './pricing';

test('calculateEstimate calculates base price and additive add-ons correctly', () => {
  // Base price 650 with +450 and +600 add-ons
  const sel1 = [{ b: 650, l: 'Kozijn' }, { a: 450, l: 'Gemiddeld' }, { a: 600, l: 'Eiken' }];
  assert.equal(calculateEstimate(sel1), 1700);

  // Base price with zero add-on
  const sel2 = [{ b: 900, l: 'Kast' }, { a: 0, l: 'Klein' }, { a: 0, l: 'Vuren' }];
  assert.equal(calculateEstimate(sel2), 900);

  // Missing or empty selections
  assert.equal(calculateEstimate([]), 0);
  assert.equal(calculateEstimate([undefined]), 0);
});

test('formatPrice formats amounts in Dutch currency standard', () => {
  assert.equal(formatPrice(1250), '€ 1.250');
  assert.equal(formatPrice(650), '€ 650');
  assert.equal(formatPrice(0), '€ 0');
});

test('formatPhoneNumber formats 10-digit Dutch phone numbers', () => {
  assert.equal(formatPhoneNumber('0612345678'), '06 12 34 56 78');
  assert.equal(formatPhoneNumber('06-12345678'), '06 12 34 56 78');
  assert.equal(formatPhoneNumber('06 12 34 56 78'), '06 12 34 56 78');
  assert.equal(formatPhoneNumber('123'), '123');
});

test('generateDomainSlug creates clean Dutch web slugs with .nl extension', () => {
  assert.equal(generateDomainSlug('Houtwerk De Vries'), 'houtwerkdevries.nl');
  assert.equal(generateDomainSlug('Groen & Zo'), 'groenenzo.nl');
  assert.equal(generateDomainSlug('Lekvrij Loodgieter'), 'lekvrijloodgieter.nl');
  assert.equal(generateDomainSlug('   '), 'mijnbedrijf.nl');
});

test('validatePostalCode validates format and checks geographic radius', () => {
  const nearUtrecht = ['34', '35', '37'];
  
  // Valid and inside radius
  const resIn = validatePostalCode('3511 AB', nearUtrecht, 'Utrecht', '3511 AB');
  assert.equal(resIn.isValid, true);
  assert.equal(resIn.inArea, true);
  assert.ok(resIn.message.includes('Ja, ik kom bij jou'));

  // Valid but outside radius
  const resOut = validatePostalCode('1011 AB', nearUtrecht, 'Utrecht', '3511 AB');
  assert.equal(resOut.isValid, true);
  assert.equal(resOut.inArea, false);
  assert.ok(resOut.message.includes('net buiten'));

  // Invalid postal code
  const resBad = validatePostalCode('XYZ', nearUtrecht, 'Utrecht', '3511 AB');
  assert.equal(resBad.isValid, false);
  assert.ok(resBad.message.includes('Vul een geldige postcode'));
});

test('validateWizardForm flags required fields and invalid phone numbers', () => {
  const emptyForm = { biz: '', owner: '', phone: '', city: '' };
  const emptyErrors = validateWizardForm(emptyForm);
  assert.ok(emptyErrors.biz);
  assert.ok(emptyErrors.owner);
  assert.ok(emptyErrors.phone);
  assert.ok(emptyErrors.city);

  const whitespaceForm = { biz: '   ', owner: '\t ', phone: '   ', city: '  ' };
  const whitespaceErrors = validateWizardForm(whitespaceForm);
  assert.ok(whitespaceErrors.biz);
  assert.ok(whitespaceErrors.owner);
  assert.ok(whitespaceErrors.phone);
  assert.ok(whitespaceErrors.city);

  const badForm = { biz: '', owner: '', phone: '123', city: '' };
  const errors = validateWizardForm(badForm);
  assert.ok(errors.biz);
  assert.ok(errors.owner);
  assert.ok(errors.phone);
  assert.ok(errors.city);

  const goodForm = {
    biz: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    phone: '06 12345678',
    city: 'Utrecht',
  };
  const noErrors = validateWizardForm(goodForm);
  assert.equal(Object.keys(noErrors).length, 0);
});

test('getOklchColor outputs valid oklch CSS color string', () => {
  const col1 = getOklchColor(0.85, 0.12, 100);
  assert.equal(col1, 'oklch(0.85 0.120 100)');
  const col2 = getOklchColor(0.2, 0.015, 60, 0.85);
  assert.equal(col2, 'oklch(0.2 0.015 60 / 0.85)');
});
