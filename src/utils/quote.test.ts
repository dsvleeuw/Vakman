import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDONS } from '../data/addons';
import { COMPONENT_ENTRIES } from '../data/componentCatalog';
import { renderQuotePdf } from '../server/quotePdf';
import {
  QUOTE_VALIDITY_DAYS,
  buildQuote,
  buildQuoteDocument,
  formatDutchDate,
  formatEuroCents,
  formatQuoteNumber,
  isQuoteNumber,
  isQuoteToken,
  isValidEmail,
  parseQuoteRequest,
  quoteDelivery,
  quoteViewPath,
  sanitizeAddonIds,
  tokensMatch,
} from './quote';
import { buildQuoteEmail, formatEuro } from './quoteEmail';

const validBody = {
  sector: 'loodgieter',
  styleIndex: 2,
  plan: 'basis',
  addons: ['price-calculator', 'trust-bar', 'onbekend'],
  services: ['Lekkage verhelpen'],
  form: {
    biz: 'Lekvrij',
    owner: 'Sanne Jansen',
    phone: '06 12345678',
    city: 'Amsterdam',
    email: 'sanne@example.nl',
  },
  channel: 'E-mail',
  appointment: { date: 'maandag 2 november', slot: 'Ochtend' },
};

test('every add-on is a real component from the library', () => {
  const ids = new Set(COMPONENT_ENTRIES.map((entry) => entry.id));
  for (const addon of ADDONS) assert.ok(ids.has(addon.id), addon.id);
});

test('sanitizeAddonIds drops unknown ids and duplicates, keeps catalogue order', () => {
  assert.deepEqual(sanitizeAddonIds(['trust-bar', 'x', 'guarantees', 'trust-bar']), [
    'trust-bar',
    'guarantees',
  ]);
  assert.deepEqual(sanitizeAddonIds('trust-bar'), []);
});

test('buildQuote charges add-ons and adds 21% btw', () => {
  const quote = buildQuote('basis', ['trust-bar', 'price-calculator']);
  assert.equal(quote.planPrice, 595);
  assert.equal(quote.subtotal, 595 + 49 + 249);
  assert.equal(quote.vat, 187.53);
  assert.equal(quote.total, 1080.53);
});

test('buildQuote lists components the package includes at € 0', () => {
  const quote = buildQuote('pro', ['price-calculator', 'trust-bar']);
  const calc = quote.addons.find((line) => line.id === 'price-calculator')!;
  assert.equal(calc.included, true);
  assert.equal(calc.price, 0);
  assert.equal(quote.subtotal, 995 + 49);
});

test('buildQuote falls back to Pro without a package', () => {
  assert.equal(buildQuote(undefined, []).planId, 'pro');
});

test('isValidEmail', () => {
  assert.equal(isValidEmail('a@b.nl'), true);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail('geen mail'), false);
});

test('parseQuoteRequest cleans a valid body', () => {
  const parsed = parseQuoteRequest(validBody);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.request.addons, ['trust-bar', 'price-calculator']);
  assert.equal(parsed.request.channel, 'E-mail');
});

test('parseQuoteRequest rejects bad input', () => {
  assert.equal(parseQuoteRequest(null).ok, false);
  assert.equal(parseQuoteRequest({ ...validBody, sector: 'bakker' }).ok, false);
  assert.equal(parseQuoteRequest({ ...validBody, form: { ...validBody.form, email: 'x' } }).ok, false);
  assert.equal(parseQuoteRequest({ ...validBody, form: { ...validBody.form, phone: '123' } }).ok, false);
});

test('parseQuoteRequest only requires an e-mail address when the quote is mailed', () => {
  const noEmail = { ...validBody, form: { ...validBody.form, email: '' } };
  assert.equal(parseQuoteRequest({ ...noEmail, channel: 'WhatsApp' }).ok, true);
  assert.equal(parseQuoteRequest({ ...noEmail, channel: 'E-mail' }).ok, false);
  assert.equal(parseQuoteRequest({ ...noEmail, channel: 'Allebei' }).ok, false);
});

test('quote e-mail contains the full quote, the link and escapes HTML', () => {
  const parsed = parseQuoteRequest({
    ...validBody,
    form: { ...validBody.form, biz: '<b>Lek</b>' },
  });
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const doc = buildQuoteDocument(parsed.request, 'KB-2026-0007', new Date('2026-10-24T10:00:00Z'));
  const mail = buildQuoteEmail(doc, parsed.request, 'team', 'https://klusbaas.test/offerte/KB-2026-0007?token=abc');
  assert.match(mail.subject, /KB-2026-0007/);
  assert.match(mail.text, /Prijscalculator: € 249,00/);
  assert.match(mail.text, /Totaal \(incl\. btw\): € 1\.080,53/);
  assert.match(mail.text, /Geldig tot en met 23 november 2026/);
  assert.match(mail.text, /Online bekijken: https:\/\/klusbaas\.test\/offerte\/KB-2026-0007/);
  assert.ok(!mail.html.includes('<b>Lek</b>'));
  assert.ok(mail.html.includes('&lt;b&gt;Lek&lt;/b&gt;'));
  const customer = buildQuoteEmail(doc, parsed.request, 'customer');
  assert.match(customer.text, /PDF in de bijlage/);
});

test('formatEuro and formatEuroCents', () => {
  assert.equal(formatEuro(995), '€ 995');
  assert.equal(formatEuro(187.5), '€ 187,50');
  assert.equal(formatEuroCents(1250), '€ 1.250,00');
  assert.equal(formatEuroCents(1080.5), '€ 1.080,50');
  assert.equal(formatEuroCents(1234567.891), '€ 1.234.567,89');
});

test('quote numbers, tokens and links', () => {
  assert.equal(formatQuoteNumber(2026, 1), 'KB-2026-0001');
  assert.equal(formatQuoteNumber(2026, 12345), 'KB-2026-12345');
  assert.equal(isQuoteNumber('KB-2026-0001'), true);
  assert.equal(isQuoteNumber('KB-2026-1'), false);
  assert.equal(isQuoteNumber('../etc'), false);
  const token = 'a'.repeat(64);
  assert.equal(isQuoteToken(token), true);
  assert.equal(isQuoteToken('a'.repeat(63)), false);
  assert.equal(tokensMatch(token, token), true);
  assert.equal(tokensMatch(token, 'b'.repeat(64)), false);
  assert.equal(tokensMatch(token, 'a'), false);
  assert.equal(quoteViewPath('KB-2026-0001', token), `/offerte/KB-2026-0001?token=${token}`);
});

test('buildQuoteDocument: lines, totals, 21% btw and 30 days validity', () => {
  const parsed = parseQuoteRequest(validBody);
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const doc = buildQuoteDocument(parsed.request, 'KB-2026-0001', new Date('2026-10-24T10:00:00Z'));
  assert.deepEqual(
    doc.lines.map((line) => [line.label, line.amount, line.included]),
    [
      ['Pakket Basis', 595, false],
      ['Vertrouwensbalk', 49, false],
      ['Prijscalculator', 249, false],
    ]
  );
  assert.equal(doc.subtotal, 893);
  assert.equal(doc.vat, 187.53);
  assert.equal(doc.total, 1080.53);
  assert.equal(QUOTE_VALIDITY_DAYS, 30);
  assert.equal(formatDutchDate(doc.issuedAt), '24 oktober 2026');
  assert.equal(formatDutchDate(doc.validUntil), '23 november 2026');
  assert.equal(doc.sectorName, 'Loodgieter');
});

test('renderQuotePdf produces a PDF, even with characters Helvetica lacks', async () => {
  const parsed = parseQuoteRequest({ ...validBody, form: { ...validBody.form, biz: 'Lekvrij 🚿 & Zn — Ω' } });
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const pdf = await renderQuotePdf(buildQuoteDocument(parsed.request, 'KB-2026-0001', new Date('2026-10-24T10:00:00Z')));
  assert.equal(Buffer.from(pdf.subarray(0, 5)).toString(), '%PDF-');
  assert.ok(pdf.length > 1500);
});

test('quoteDelivery maps the wizard channel choice', () => {
  assert.deepEqual(quoteDelivery('WhatsApp'), { email: false, whatsapp: true });
  assert.deepEqual(quoteDelivery('E-mail'), { email: true, whatsapp: false });
  assert.deepEqual(quoteDelivery('Allebei'), { email: true, whatsapp: true });
});
