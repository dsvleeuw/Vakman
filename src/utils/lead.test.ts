import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_FILL_MS, createRateLimiter, leadFieldRows, parseLead, validateLeadFields } from './lead';
import { buildQuoteEmail, buildSiteLeadEmail, createLeadReference, escapeHtml } from './leadEmail';
import { buildQuoteRecord } from './quote';

const NOW = 1_800_000_000_000;
const started = NOW - 10_000;

const quoteBody = {
  type: 'quote',
  startedAt: started,
  sector: 'loodgieter',
  styleIndex: 2,
  plan: 'basis',
  addons: ['price-calculator', 'trust-bar', 'onbekend'],
  services: ['Lekkage verhelpen'],
  form: { biz: 'Lekvrij', owner: 'Sanne Jansen', phone: '06 12345678', city: 'Hoofddorp', email: 'sanne@example.nl' },
  channel: 'E-mail',
  appointment: { date: 'maandag 2 november', slot: 'Ochtend' },
};

const contactBody = {
  type: 'contact',
  startedAt: started,
  site: { biz: 'Lekvrij', sector: 'loodgieter', style: 'Signaal' },
  fields: { name: 'Piet', phone: '+31 6 12345678', message: 'Mijn kraan lekt al een week.' },
};

test('parseLead accepts a wizard quote and cleans add-ons', () => {
  const parsed = parseLead(quoteBody, NOW);
  assert.equal(parsed.kind, 'quote');
  if (parsed.kind !== 'quote') return;
  assert.deepEqual(parsed.request.addons, ['trust-bar', 'price-calculator']);
  assert.equal(parsed.request.channel, 'E-mail');
  assert.equal(parsed.request.appointment?.slot, 'Ochtend');
});

test('parseLead requires an e-mail only when the channel mails the quote', () => {
  const noMail = { ...quoteBody, form: { ...quoteBody.form, email: '' } };
  assert.equal(parseLead({ ...noMail, channel: 'E-mail' }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...noMail, channel: 'Allebei' }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...noMail, channel: 'WhatsApp' }, NOW).kind, 'quote');
  const bad = parseLead({ ...quoteBody, form: { ...quoteBody.form, email: 'x@y' } }, NOW);
  assert.equal(bad.kind === 'invalid' && bad.field, 'email');
});

test('parseLead rejects unknown sectors, styles, phones and forms', () => {
  assert.equal(parseLead(null, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...quoteBody, sector: 'bakker' }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...quoteBody, styleIndex: 9 }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...quoteBody, form: { ...quoteBody.form, phone: '123' } }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...quoteBody, type: 'nieuwsbrief' }, NOW).kind, 'invalid');
  assert.equal(parseLead({ ...quoteBody, startedAt: undefined }, NOW).kind, 'invalid');
});

test('parseLead flags honeypot and too-fast submissions as spam', () => {
  assert.deepEqual(parseLead({ ...contactBody, website: 'http://spam' }, NOW), { kind: 'spam', reason: 'honeypot' });
  assert.deepEqual(parseLead({ ...contactBody, startedAt: NOW - MIN_FILL_MS + 1 }, NOW), {
    kind: 'spam',
    reason: 'too-fast',
  });
});

test('parseLead validates each site form', () => {
  const contact = parseLead(contactBody, NOW);
  assert.equal(contact.kind, 'site');
  const short = parseLead({ ...contactBody, fields: { ...contactBody.fields, message: 'kort' } }, NOW);
  assert.equal(short.kind === 'invalid' && short.field, 'message');
  const fault = parseLead(
    {
      type: 'fault',
      startedAt: started,
      site: { sector: 'elektricien' },
      fields: { name: 'An', phone: '0612345678', address: 'Dorpsstraat 1', faultType: 'Stroomuitval', since: 'Vandaag', urgency: 'Spoed' },
    },
    NOW
  );
  assert.equal(fault.kind, 'site');
  if (fault.kind === 'site') assert.ok(fault.lead.site.biz.length > 0, 'falls back to sector demo name');
  assert.equal(parseLead({ ...contactBody, site: { sector: 'bakker' } }, NOW).kind, 'invalid');
});

test('validateLeadFields: optional e-mail checked when present, surface name optional', () => {
  const ok = validateLeadFields('surface', { phone: '0612345678', service: 'Schilderwerk', surfaceM2: 24, estimate: '€ 432' });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.fields.surfaceM2, '24');
  const bad = validateLeadFields('appointment', {
    name: 'A', phone: '0612345678', email: 'nee', address: 'x', service: 'y', date: 'z', slot: 's',
  });
  assert.deepEqual(bad, { ok: false, field: 'email', error: 'Ongeldig e-mailadres.' });
});

test('createRateLimiter allows `limit` hits per window per key', () => {
  const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(allow('a', 0), true);
  assert.equal(allow('a', 10), true);
  assert.equal(allow('a', 20), false);
  assert.equal(allow('b', 20), true);
  assert.equal(allow('a', 1011), true);
});

test('site lead e-mail lists the fields and escapes HTML', () => {
  const parsed = parseLead({ ...contactBody, fields: { ...contactBody.fields, name: '<b>Piet</b>' } }, NOW);
  assert.equal(parsed.kind, 'site');
  if (parsed.kind !== 'site') return;
  assert.deepEqual(leadFieldRows(parsed.lead).map((r) => r.label), ['Naam', 'Telefoon', 'Bericht']);
  const mail = buildSiteLeadEmail(parsed.lead, 'team', 'L-TEST01');
  assert.match(mail.subject, /Contactformulier: <b>Piet<\/b> via Lekvrij · L-TEST01/);
  assert.match(mail.text, /Bericht: Mijn kraan lekt al een week\./);
  assert.ok(!mail.html.includes('<b>Piet</b>'));
  assert.ok(mail.html.includes(escapeHtml('<b>Piet</b>')));
  assert.match(createLeadReference(), /^L-[A-Z2-9]{6}$/);
});

test('quote e-mail shows lines, totals and the WhatsApp action for the team', () => {
  const record = buildQuoteRecord({
    id: 'KB-2026-0001',
    token: 't',
    now: '2026-10-24T10:00:00.000Z',
    planId: 'basis',
    addons: ['trust-bar', 'price-calculator'],
    customer: { biz: 'Lekvrij', owner: 'Sanne Jansen', phone: '0612345678', city: 'Hoofddorp', email: 's@example.nl' },
    sector: 'loodgieter',
    sectorName: 'Loodgieter',
    styleName: 'Signaal',
    services: [],
    channel: 'Allebei',
  });
  const team = buildQuoteEmail(record, 'team', { quoteUrl: 'https://x.nl/offerte/KB-2026-0001?token=t', whatsappUrl: 'https://wa.me/31612345678' });
  assert.match(team.subject, /KB-2026-0001/);
  assert.match(team.text, /Prijscalculator: € 249,00/);
  assert.match(team.text, /Totaal \(incl\. btw\): € 1\.080,53/);
  assert.match(team.text, /wa\.me\/31612345678/);
  const customer = buildQuoteEmail(record, 'customer', { quoteUrl: 'https://x.nl/o' });
  assert.match(customer.text, /^Hoi Sanne/);
  assert.ok(!customer.text.includes('wa.me'));
});
