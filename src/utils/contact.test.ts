import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CONTACT_HREF,
  buildSiteTelUrl,
  buildSiteWhatsAppUrl,
  getDemoPhone,
  resolveContactPhone,
  buildMailtoUrl,
  buildQuoteRequestMessage,
  normalizeDutchPhone,
  phoneToWaDigits,
  buildWhatsAppUrl,
  buildTelUrl,
  buildContactMessage,
  buildEmergencyMessage,
  buildFaultReportMessage,
  buildRoofCheckMessage,
  buildSurfaceQuoteMessage,
  canShowContactButtons,
} from './contact';

test('phoneToWaDigits converts Dutch mobile numbers to wa.me format', () => {
  assert.equal(phoneToWaDigits('06 12 34 56 78'), '31612345678');
  assert.equal(phoneToWaDigits('06-12345678'), '31612345678');
  assert.equal(phoneToWaDigits('020 123 4567'), '31201234567');
  // Already international stays untouched
  assert.equal(phoneToWaDigits('31612345678'), '31612345678');
  assert.equal(phoneToWaDigits(''), '');
});

test('normalizeDutchPhone accepts local, +31 and 0031 formats', () => {
  assert.equal(normalizeDutchPhone('06 12 34 56 78'), '0612345678');
  assert.equal(normalizeDutchPhone('06-12345678'), '0612345678');
  assert.equal(normalizeDutchPhone('+31 6 12345678'), '0612345678');
  assert.equal(normalizeDutchPhone('0031 (0)6-12345678'), '0612345678');
  assert.equal(normalizeDutchPhone('020 123 4567'), '0201234567');
  // Too short, too long, letters only and empty input are rejected
  assert.equal(normalizeDutchPhone('06 1234'), null);
  assert.equal(normalizeDutchPhone('06 123456789'), null);
  assert.equal(normalizeDutchPhone('bel me'), null);
  assert.equal(normalizeDutchPhone(''), null);
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

test('buildMailtoUrl encodes subject and body', () => {
  assert.equal(buildMailtoUrl('hallo@klusbaas.nl', '', ''), 'mailto:hallo@klusbaas.nl');
  const url = buildMailtoUrl('hallo@klusbaas.nl', 'Afspraak', 'Regel één\nRegel twee');
  assert.ok(url.startsWith('mailto:hallo@klusbaas.nl?'));
  const params = new URLSearchParams(url.split('?')[1]);
  assert.equal(params.get('subject'), 'Afspraak');
  assert.equal(params.get('body'), 'Regel één\nRegel twee');
});

test('buildQuoteRequestMessage summarises the appointment', () => {
  const message = buildQuoteRequestMessage({
    bizName: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    phone: '06 12345678',
    city: 'Utrecht',
    dateStr: 'maandag 3 november',
    timeSlot: 'Ochtend (08:30 - 12:00)',
    channel: 'E-mail',
    planName: 'Pro',
    appointmentId: 'BK-123',
  });
  for (const expected of ['Houtwerk De Vries', 'Jan de Vries', 'Utrecht', 'E-mail', 'Pro', 'BK-123']) {
    assert.ok(message.includes(expected), `missing ${expected}`);
  }
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

test('buildRoofCheckMessage renders every roof field plus optional details', () => {
  const msg = buildRoofCheckMessage('Van den Brink Daken', {
    name: 'Erik',
    phone: '06 11 22 33 44',
    email: 'erik@example.nl',
    address: 'Kerkstraat 12, Almere',
    roofType: 'Schuin dak met pannen',
    complaint: 'Lekkage in huis',
    urgency: 'Deze week',
    details: 'Bij flinke regen loopt het langs de dakkapel.',
  });
  assert.ok(msg.includes('gratis dakcheck'));
  assert.ok(msg.includes('Type dak: Schuin dak met pannen'));
  assert.ok(msg.includes('Klacht: Lekkage in huis'));
  assert.ok(msg.includes('Urgentie: Deze week'));
  assert.ok(msg.includes('Adres: Kerkstraat 12, Almere'));
  assert.ok(msg.includes('Telefoon: 06 11 22 33 44'));
  assert.ok(msg.includes('E-mail: erik@example.nl'));
  assert.ok(msg.includes('Aanvulling: Bij flinke regen loopt het langs de dakkapel.'));
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

test('resolveContactPhone prefers the owner number, then the demo number', () => {
  assert.equal(resolveContactPhone('06 98765432', '0201234567'), '06 98765432');
  assert.equal(resolveContactPhone('  ', '0201234567'), '0201234567');
  assert.equal(resolveContactPhone(undefined, '0201234567'), '0201234567');
  assert.equal(resolveContactPhone(undefined, null), null);
});

test('site contact links never dial without a safe number', () => {
  assert.equal(buildSiteTelUrl('020 123 45 67'), 'tel:0201234567');
  assert.equal(buildSiteWhatsAppUrl('0612345670', 'Hoi'), 'https://wa.me/31612345670?text=Hoi');
  assert.equal(buildSiteTelUrl(null), DEMO_CONTACT_HREF);
  assert.equal(buildSiteWhatsAppUrl(null, 'Hoi'), DEMO_CONTACT_HREF);
});

test('a customer site without a number shows no call buttons', () => {
  assert.equal(canShowContactButtons({ contactPhone: null, isCustomerSite: true }), false);
  assert.equal(
    canShowContactButtons({ contactPhone: '06 98 76 54 32', isCustomerSite: true }),
    true
  );
  // A demo site may always show the buttons: they open the demo notice.
  assert.equal(canShowContactButtons({ contactPhone: null, isCustomerSite: false }), true);
});

test('getDemoPhone reads and validates VITE_DEMO_PHONE', () => {
  const previous = process.env.VITE_DEMO_PHONE;
  try {
    delete process.env.VITE_DEMO_PHONE;
    assert.equal(getDemoPhone(), null);
    process.env.VITE_DEMO_PHONE = '+31 6 11 22 33 44';
    assert.equal(getDemoPhone(), '0611223344');
    process.env.VITE_DEMO_PHONE = 'geen nummer';
    assert.equal(getDemoPhone(), null);
  } finally {
    if (previous === undefined) delete process.env.VITE_DEMO_PHONE;
    else process.env.VITE_DEMO_PHONE = previous;
  }
});
