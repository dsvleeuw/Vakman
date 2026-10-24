import test from 'node:test';
import assert from 'node:assert/strict';
import {
  phoneToWaDigits,
  buildWhatsAppUrl,
  buildTelUrl,
  buildContactMessage,
  buildEmergencyMessage,
  buildFaultReportMessage,
  buildSurfaceQuoteMessage,
} from './contact';

test('phoneToWaDigits converts Dutch mobile numbers to wa.me format', () => {
  assert.equal(phoneToWaDigits('06 12 34 56 78'), '31612345678');
  assert.equal(phoneToWaDigits('06-12345678'), '31612345678');
  assert.equal(phoneToWaDigits('020 123 4567'), '31201234567');
  // Already international stays untouched
  assert.equal(phoneToWaDigits('31612345678'), '31612345678');
  assert.equal(phoneToWaDigits(''), '');
});

test('buildWhatsAppUrl builds a link and URL-encodes the prefilled message', () => {
  assert.equal(
    buildWhatsAppUrl('06 12 34 56 78'),
    'https://wa.me/31612345678'
  );
  assert.equal(
    buildWhatsAppUrl('06 12 34 56 78', 'Hallo daar!'),
    'https://wa.me/31612345678?text=Hallo%20daar!'
  );
  // Empty / whitespace message behaves like no message
  assert.equal(
    buildWhatsAppUrl('06 12 34 56 78', '   '),
    'https://wa.me/31612345678'
  );
});

test('buildTelUrl strips spaces and dashes for tel: links', () => {
  assert.equal(buildTelUrl('06 12 34 56 78'), 'tel:0612345678');
  assert.equal(buildTelUrl('020-123 4567'), 'tel:0201234567');
});

test('buildContactMessage includes the message and contact details', () => {
  const msg = buildContactMessage('Lekvrij Installaties', {
    name: 'Sanne de Jong',
    phone: '06 87 65 43 21',
    message: 'Onze gootsteen verstopt steeds.',
  });
  assert.ok(msg.includes('Hallo Lekvrij Installaties!'));
  assert.ok(msg.includes('Onze gootsteen verstopt steeds.'));
  assert.ok(msg.includes('Naam: Sanne de Jong'));
  assert.ok(msg.includes('Telefoon: 06 87 65 43 21'));
});

test('buildEmergencyMessage highlights the problem and optional name', () => {
  const withName = buildEmergencyMessage('Lekvrij Installaties', 'Waterlekkage', 'Bram');
  assert.ok(withName.includes('SPOEDklus'));
  assert.ok(withName.includes('Probleem: Waterlekkage'));
  assert.ok(withName.includes('Naam: Bram'));

  const anonymous = buildEmergencyMessage('Lekvrij Installaties', 'Gaslucht');
  assert.ok(anonymous.includes('Probleem: Gaslucht'));
  assert.ok(!anonymous.includes('Naam:'));
});

test('buildFaultReportMessage renders every fault field plus optional details', () => {
  const msg = buildFaultReportMessage('Stroomwerk Rotterdam', {
    name: 'Erik',
    phone: '06 11 22 33 44',
    address: 'Kerkstraat 12, Rotterdam',
    faultType: 'Aardlek schiet eruit',
    since: 'Vanochtend',
    urgency: 'Vandaag nog (spoed)',
    details: 'Gebeurt vooral als de vaatwasser aan gaat.',
  });
  assert.ok(msg.includes('storing melden'));
  assert.ok(msg.includes('Soort storing: Aardlek schiet eruit'));
  assert.ok(msg.includes('Adres: Kerkstraat 12, Rotterdam'));
  assert.ok(msg.includes('Urgentie: Vandaag nog (spoed)'));
  assert.ok(msg.includes('Aanvulling: Gebeurt vooral als de vaatwasser aan gaat.'));
});

test('buildSurfaceQuoteMessage summarises the m² calculation', () => {
  const msg = buildSurfaceQuoteMessage('Verfwerk Bakker', {
    serviceName: 'Binnenschilderwerk',
    pricePerM2: 18,
    surfaceM2: 42,
    totalPrice: 756,
    wallCount: 3,
    openings: 2,
    name: 'Anouk',
  });
  assert.ok(msg.includes('Werk: Binnenschilderwerk'));
  assert.ok(msg.includes('Oppervlakte: 42 m² (3 wand(en), 2 deur/raam correctie)'));
  assert.ok(msg.includes('Richtprijs: € 756'));
  assert.ok(msg.includes('Naam: Anouk'));
});
