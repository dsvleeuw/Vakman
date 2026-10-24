import test from 'node:test';
import assert from 'node:assert/strict';
import { ADDONS } from '../data/addons';
import { COMPONENT_ENTRIES } from '../data/componentCatalog';
import { handleSendQuote } from '../server/sendQuote';
import { buildQuote, isValidEmail, parseQuoteRequest, sanitizeAddonIds } from './quote';
import { buildQuoteEmail, createQuoteReference, formatEuro } from './quoteEmail';

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

test('quote e-mail contains the full quote and escapes HTML', () => {
  const parsed = parseQuoteRequest({
    ...validBody,
    form: { ...validBody.form, biz: '<b>Lek</b>' },
  });
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const quote = buildQuote(parsed.request.plan, parsed.request.addons);
  const mail = buildQuoteEmail(quote, parsed.request, 'team', 'KB-TEST01');
  assert.match(mail.subject, /KB-TEST01/);
  assert.match(mail.text, /Prijscalculator: € 249/);
  assert.match(mail.text, /Totaal \(incl\. btw\): € 1\.080,53/);
  assert.ok(!mail.html.includes('<b>Lek</b>'));
  assert.ok(mail.html.includes('&lt;b&gt;Lek&lt;/b&gt;'));
});

test('formatEuro and createQuoteReference', () => {
  assert.equal(formatEuro(995), '€ 995');
  assert.equal(formatEuro(187.5), '€ 187,50');
  assert.match(createQuoteReference(), /^KB-[A-Z2-9]{6}$/);
});

test('handleSendQuote previews without an API key', async () => {
  const result = await handleSendQuote(validBody, {}, async () => {
    throw new Error('should not fetch');
  }, () => {});
  assert.equal(result.status, 200);
  assert.equal(result.body.mode, 'preview');
});

test('handleSendQuote mails the team and the customer via Resend', async () => {
  const calls: { to: string[]; reply_to: string }[] = [];
  const fakeFetch = async (_url: string, init: RequestInit) => {
    calls.push(JSON.parse(String(init.body)));
    return new Response('{}', { status: 200 });
  };
  const result = await handleSendQuote(
    validBody,
    { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' },
    fakeFetch,
    () => {}
  );
  assert.equal(result.body.mode, 'sent');
  assert.equal(result.body.customerEmailSent, true);
  assert.deepEqual(calls.map((call) => call.to[0]), ['team@example.nl', 'sanne@example.nl']);
  assert.equal(calls[0].reply_to, 'sanne@example.nl');
});

test('handleSendQuote reports a failed team mail and ignores honeypot bots', async () => {
  const failing = async () => new Response('nope', { status: 403 });
  const failed = await handleSendQuote(validBody, { RESEND_API_KEY: 'k' }, failing, () => {});
  assert.equal(failed.status, 502);

  let fetched = false;
  const bot = await handleSendQuote({ ...validBody, website: 'spam' }, { RESEND_API_KEY: 'k' }, async () => {
    fetched = true;
    return new Response('{}');
  }, () => {});
  assert.equal(bot.body.ok, true);
  assert.equal(fetched, false);
});
