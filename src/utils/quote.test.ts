import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDONS } from '../data/addons';
import { COMPONENT_ENTRIES } from '../data/componentCatalog';
import {
  addDaysIso,
  buildQuotePath,
  buildQuoteRecord,
  calculateQuote,
  daysSince,
  formatDutchDate,
  formatEuroCents,
  formatQuoteNumber,
  isQuoteNumber,
  quoteDelivery,
  sanitizeAddonIds,
  toPublicQuote,
  vatForCents,
} from './quote';

test('every add-on is a real component from the library', () => {
  const ids = new Set(COMPONENT_ENTRIES.map((entry) => entry.id));
  for (const addon of ADDONS) assert.ok(ids.has(addon.id), addon.id);
});

test('sanitizeAddonIds drops unknown ids and duplicates, keeps catalogue order', () => {
  assert.deepEqual(sanitizeAddonIds(['guarantees', 'x', 'trust-bar', 'guarantees']), ['trust-bar', 'guarantees']);
  assert.deepEqual(sanitizeAddonIds('trust-bar'), []);
});

test('daysSince telt hele dagen terug, en nooit negatief', () => {
  const now = new Date('2026-10-30T12:00:00.000Z');
  assert.equal(daysSince('2026-10-30T10:00:00.000Z', now), 0);
  assert.equal(daysSince('2026-10-29T12:00:00.000Z', now), 1);
  assert.equal(daysSince('2026-10-27T11:59:00.000Z', now), 3);
  // Een moment in de toekomst is geen negatief aantal dagen.
  assert.equal(daysSince('2026-11-02T10:00:00.000Z', now), 0);
  // Een onleesbaar moment telt niet als dagen.
  assert.equal(daysSince('onzin', now), 0);
});

test('calculateQuote: plan line, add-ons, 21% btw in cents', () => {
  const quote = calculateQuote('basis', ['trust-bar', 'price-calculator']);
  assert.equal(quote.lines[0].label, 'Website-pakket Basis');
  assert.equal(quote.lines[0].amountCents, 59500);
  assert.equal(quote.subtotalCents, (595 + 49 + 249) * 100);
  assert.equal(quote.vatCents, 18753);
  assert.equal(quote.totalCents, 108053);
});

test('calculateQuote lists components the package includes at € 0', () => {
  const quote = calculateQuote('pro', ['price-calculator', 'trust-bar']);
  const calc = quote.lines.find((line) => line.id === 'price-calculator')!;
  assert.equal(calc.included, true);
  assert.equal(calc.amountCents, 0);
  assert.equal(quote.subtotalCents, (995 + 49) * 100);
});

test('calculateQuote falls back to Pro for an unknown package', () => {
  assert.equal(calculateQuote(undefined, []).planId, 'pro');
  assert.equal(calculateQuote('goud', []).planId, 'pro');
});

test('vatForCents rounds half up to whole cents', () => {
  assert.equal(vatForCents(100), 21);
  assert.equal(vatForCents(250), 53); // 52.5 -> 53
  assert.equal(vatForCents(0), 0);
});

test('formatEuroCents uses Dutch notation', () => {
  assert.equal(formatEuroCents(125000), '€ 1.250,00');
  assert.equal(formatEuroCents(108053), '€ 1.080,53');
  assert.equal(formatEuroCents(5), '€ 0,05');
  assert.equal(formatEuroCents(123456789), '€ 1.234.567,89');
  assert.equal(formatEuroCents(-500), '-€ 5,00');
});

test('formatQuoteNumber pads the sequence and isQuoteNumber recognises it', () => {
  assert.equal(formatQuoteNumber(2026, 1), 'KB-2026-0001');
  assert.equal(formatQuoteNumber(2026, 12345), 'KB-2026-12345');
  assert.throws(() => formatQuoteNumber(2026, 0));
  assert.equal(isQuoteNumber('KB-2026-0001'), true);
  assert.equal(isQuoteNumber('KB-2026-1'), false);
  assert.equal(isQuoteNumber('../etc'), false);
});

test('dates: valid 30 days, Dutch formatting', () => {
  assert.equal(addDaysIso('2026-10-24T10:00:00.000Z', 30), '2026-11-23T10:00:00.000Z');
  assert.equal(formatDutchDate('2026-11-23T10:00:00.000Z'), '23 november 2026');
});

test('quoteDelivery follows the wizard channel', () => {
  assert.deepEqual(quoteDelivery('WhatsApp'), { email: false, whatsapp: true });
  assert.deepEqual(quoteDelivery('E-mail'), { email: true, whatsapp: false });
  assert.deepEqual(quoteDelivery('Allebei'), { email: true, whatsapp: true });
});

test('buildQuoteRecord stores totals, validity and hides the token publicly', () => {
  const record = buildQuoteRecord({
    id: 'KB-2026-0007',
    token: 'geheim',
    now: '2026-10-24T10:00:00.000Z',
    planId: 'premium',
    addons: ['booking-calendar', 'promotion'],
    customer: { biz: 'Lekvrij', owner: 'Sanne', phone: '0612345678', city: 'Hoofddorp' },
    sector: 'loodgieter',
    sectorName: 'Loodgieter',
    styleName: 'Signaal',
    services: ['Lekkage'],
    channel: 'E-mail',
  });
  assert.equal(record.validUntil, '2026-11-23T10:00:00.000Z');
  assert.equal(record.subtotalCents, (1795 + 69) * 100);
  assert.equal(record.lines.find((l) => l.id === 'booking-calendar')!.included, true);
  const pub = toPublicQuote(record);
  assert.equal('token' in pub, false);
  assert.equal(buildQuotePath(record.id, 'a+b'), '/offerte/KB-2026-0007?token=a%2Bb');
});
