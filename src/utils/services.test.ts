import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatServicePrice,
  offersOf,
  parseDutchNumber,
  parseServicePrice,
  presetOffers,
  pricedOffers,
  rowsToOffers,
  serviceItems,
  serviceRows,
} from './services';
import type { SiteContent } from '../types';

function content(overrides: Partial<SiteContent> = {}): SiteContent {
  return {
    version: 1,
    sector: 'schilder',
    styleId: 'klassiek',
    form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
    disabledServices: {},
    blocks: [],
    blockContent: {},
    confirmed: [],
    text: {
      kicker: 'Schilderen',
      headline: 'De muur die je blijft bewonderen',
      intro: 'Sinds 1998',
      about: 'Ik ben Jan.',
      cta1: 'Bekijk mijn werk',
      cta2: 'Vraag een offerte',
    },
    ...overrides,
  };
}

test('een Nederlandse prijs wordt een getal met een eenheid', () => {
  assert.deepEqual(parseServicePrice('v.a. € 650 per stuk'), { amount: 650, unit: 'per stuk' });
  assert.deepEqual(parseServicePrice('€ 28 per m²'), { amount: 28, unit: 'per m²' });
  assert.deepEqual(parseServicePrice('v.a. € 2.400'), { amount: 2400 });
  assert.deepEqual(parseServicePrice('op aanvraag'), { amount: 0 });
  assert.deepEqual(parseServicePrice(''), { amount: 0 });
});

test('Nederlandse getallen worden goed gelezen', () => {
  assert.equal(parseDutchNumber('2.400'), 2400);
  assert.equal(parseDutchNumber('1.250,50'), 1250.5);
  assert.equal(parseDutchNumber('650,50'), 650.5);
  assert.equal(parseDutchNumber('28'), 28);
  assert.equal(parseDutchNumber('28.5'), 28.5);
});

test('een dienst toont zijn prijs zoals de vakman hem opgaf', () => {
  assert.equal(formatServicePrice({ n: 'Kozijnen', d: '', amount: 650 }), 'v.a. € 650');
  assert.equal(formatServicePrice({ n: 'Vloer', d: '', amount: 28, unit: 'per m²' }), '€ 28 per m²');
  assert.equal(formatServicePrice({ n: 'Advies', d: '', amount: 0 }), '');
});

test('het voorbeeld van het vak is een startpunt, met voorbeeldprijzen', () => {
  const offers = presetOffers('schilder');
  assert.ok(offers.length > 0);
  assert.ok(offers.every((offer) => offer.n.trim()));
  assert.ok(offers.some((offer) => offer.amount > 0));
});

test('eigen diensten van de vakman gaan voor het voorbeeld', () => {
  const own = offersOf(
    content({
      services: [{ n: 'Binnen schilderwerk', d: 'Wanden en kozijnen', amount: 45, unit: 'per uur' }],
    })
  );
  assert.equal(own.length, 1);
  assert.equal(own[0].n, 'Binnen schilderwerk');
  assert.equal(own[0].unit, 'per uur');
});

test('zonder eigen diensten blijft het voorbeeld staan', () => {
  const offers = offersOf(content());
  assert.ok(offers.length > 0);
  assert.deepEqual(offersOf(content({ services: [] })), offers);
});

test('de pagina toont de diensten met nummer en prijs', () => {
  const items = serviceItems([
    { n: 'Binnen schilderwerk', d: 'Wanden', amount: 45, unit: 'per uur' },
    { n: 'Advies op locatie', d: '', amount: 0 },
  ]);
  assert.equal(items[0].p, '€ 45 per uur');
  assert.equal(items[0].nr, '01');
  assert.equal(items[1].p, '');
  assert.equal(items[1].nr, '02');
});

test('alleen diensten met een prijs komen in de calculator', () => {
  const priced = pricedOffers([
    { n: 'Binnen schilderwerk', d: '', amount: 45 },
    { n: 'Advies op locatie', d: '', amount: 0 },
    { n: '  ', d: '', amount: 500 },
  ]);
  assert.equal(priced.length, 1);
  assert.equal(priced[0].n, 'Binnen schilderwerk');
});

test('de editor begint met het voorbeeld, maar zonder de voorbeeldprijzen', () => {
  const rows = serviceRows(content());
  assert.ok(rows.length > 0);
  assert.ok(
    rows.every((row) => row.amount === ''),
    'een voorbeeldprijs is niet van de vakman en mag niet in het veld staan'
  );
});

test('de editor bewaart wat de vakman typt', () => {
  const offers = rowsToOffers([
    { n: ' Binnen schilderwerk ', d: ' Wanden ', amount: '45', unit: ' per uur ' },
    { n: '', d: 'zonder naam', amount: '10', unit: '' },
  ]);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].n, 'Binnen schilderwerk');
  assert.equal(offers[0].amount, 45);
  assert.equal(offers[0].unit, 'per uur');
});
