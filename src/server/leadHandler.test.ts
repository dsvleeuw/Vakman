import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import type { QuoteRecord } from '../utils/quote';
import { handleGetQuote, handleLead, tokensMatch, type LeadDeps } from './leadHandler';
import { pdfSafe } from './quotePdf';
import type { LeadStorage, SiteStorage } from './storage';
import type { PublishedSiteRecord } from '../types';

function memoryStorage() {
  const quotes = new Map<string, QuoteRecord>();
  const pdfs = new Map<string, Uint8Array>();
  const leads = new Map<string, unknown>();
  const counters = new Map<number, number>();
  const storage: LeadStorage = {
    async nextQuoteSequence(year) {
      const next = (counters.get(year) ?? 0) + 1;
      counters.set(year, next);
      return next;
    },
    async saveQuote(record, pdf) {
      quotes.set(record.id, record);
      pdfs.set(record.id, pdf);
      return { json: `mem:${record.id}`, pdf: `mem:${record.id}.pdf` };
    },
    async getQuote(id) {
      return quotes.get(id) ?? null;
    },
    async getQuotePdf(id) {
      return pdfs.get(id) ?? null;
    },
    async saveLead(reference, lead) {
      leads.set(reference, lead);
      return `mem:${reference}`;
    },
    async listLeads() {
      return [...leads.values()] as Awaited<ReturnType<LeadStorage['listLeads']>>;
    },
  };
  return { storage, quotes, pdfs, leads };
}

const NOW = new Date('2026-10-24T10:00:00.000Z');
const TOKEN = 'x'.repeat(32);
const body = {
  type: 'quote',
  startedAt: NOW.getTime() - 60_000,
  sector: 'schilder',
  styleIndex: 1,
  plan: 'pro',
  addons: ['trust-bar', 'price-calculator'],
  services: ['Binnenschilderwerk', 'Buitenschilderwerk'],
  form: {
    biz: 'Schildersbedrijf Jansen',
    owner: 'Kees Jansen',
    phone: '06 12345678',
    city: 'Hoofddorp',
    email: 'kees@example.nl',
  },
  channel: 'Allebei',
};

function setup(extra: Partial<LeadDeps> = {}) {
  const mem = memoryStorage();
  const logs: string[] = [];
  const deps: LeadDeps = {
    env: {},
    storage: mem.storage,
    siteUrl: 'https://klusbaas.test/',
    now: () => NOW,
    createToken: () => TOKEN,
    log: (message) => logs.push(message),
    allowRequest: () => true,
    ...extra,
  };
  return { deps, mem, logs };
}

type SentMail = { to: string[]; text: string; attachments?: unknown[] };

test('quote lead: numbered, stored with PDF, previewed without API key', async () => {
  const { deps, mem, logs } = setup();
  const first = await handleLead(body, 'ip', deps);
  const second = await handleLead(body, 'ip', deps);
  assert.equal(first.status, 200);
  assert.equal(first.body.reference, 'KB-2026-0001');
  assert.equal(second.body.reference, 'KB-2026-0002');
  assert.equal(first.body.mode, 'preview');
  assert.equal(first.body.delivery?.team.status, 'preview');
  assert.equal(first.body.delivery?.customer.status, 'preview');
  assert.equal(first.body.quote?.path, `/offerte/KB-2026-0001?token=${TOKEN}`);
  assert.equal('token' in (first.body.quote ?? {}), false);
  assert.ok(logs.some((line) => line.includes('Bijlagen: Offerte-KB-2026-0001.pdf')));
  const previewLogs = logs.filter((line) => line.includes('PREVIEW'));
  assert.ok(previewLogs.length > 0);
  assert.ok(previewLogs.every((line) => !line.includes('Hoi Kees')));
  assert.ok(previewLogs.every((line) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line)));
  assert.ok(previewLogs.every((line) => line.includes('Ontvanger-domein:')));

  const pdf = await PDFDocument.load(mem.pdfs.get('KB-2026-0001')!);
  assert.ok(pdf.getPageCount() >= 1);
  assert.match(pdf.getTitle() ?? '', /KB-2026-0001/);
});

test('quote lead: WhatsApp-only skips the customer mail, team gets a wa.me link', async () => {
  const sent: SentMail[] = [];
  const fetchImpl = async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response('{"id":"re_1"}', { status: 200 });
  };
  const { deps } = setup({ env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' }, fetchImpl });
  const result = await handleLead({ ...body, channel: 'WhatsApp', form: { ...body.form, email: '' } }, 'ip', deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.mode, 'sent');
  assert.deepEqual(sent.map((mail) => mail.to[0]), ['team@example.nl']);
  assert.equal(sent[0].attachments?.length, 1);
  assert.match(sent[0].text, /wa\.me\/31612345678/);
  assert.equal(result.body.delivery?.customer.status, 'skipped');
});

test('quote lead: a refused customer mail (Resend test mode) does not fail the request', async () => {
  const fetchImpl = async (_url: string, init: RequestInit) => {
    const mail = JSON.parse(String(init.body)) as SentMail;
    return mail.to[0] === 'kees@example.nl'
      ? new Response('{"message":"You can only send testing emails to your own email address"}', { status: 403 })
      : new Response('{"id":"re_2"}', { status: 200 });
  };
  const { deps, mem } = setup({ env: { RESEND_API_KEY: 'test' }, fetchImpl });
  const result = await handleLead(body, 'ip', deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.delivery?.team.status, 'sent');
  assert.equal(result.body.delivery?.team.to, 'thomascliphero@gmail.com');
  assert.equal(result.body.delivery?.customer.status, 'failed');
  assert.ok(mem.quotes.has('KB-2026-0001'));
});

test('quote lead: the PDF goes out as application/pdf to both sides', async () => {
  const sent: { to: string[]; attachments?: { filename: string; content_type?: string }[] }[] = [];
  const fetchImpl = async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response('{"id":"re_1"}', { status: 200 });
  };
  const { deps } = setup({ env: { RESEND_API_KEY: 'test' }, fetchImpl });
  await handleLead(body, 'ip', deps);
  assert.equal(sent.length, 2);
  for (const mail of sent) {
    assert.equal(mail.attachments?.[0].filename, 'Offerte-KB-2026-0001.pdf');
    assert.equal(mail.attachments?.[0].content_type, 'application/pdf');
  }
});

test('quote lead: a failed team mail returns 502 but keeps the stored quote', async () => {
  const { deps, mem } = setup({
    env: { RESEND_API_KEY: 'test' },
    fetchImpl: async () => new Response('nope', { status: 500 }),
  });
  const result = await handleLead(body, 'ip', deps);
  assert.equal(result.status, 502);
  assert.equal(result.body.ok, false);
  assert.ok(result.body.error);
  assert.ok(mem.quotes.has('KB-2026-0001'));
});

test('site lead: stored and mailed; spam, invalid input and floods are not', async () => {
  const { deps, mem } = setup();
  const lead = {
    type: 'appointment',
    startedAt: NOW.getTime() - 60_000,
    site: { biz: 'Lekvrij', sector: 'loodgieter' },
    fields: {
      name: 'Piet',
      phone: '0612345678',
      address: 'Kerkweg 1',
      service: 'Lekkage',
      date: 'maandag 2 november',
      slot: 'Ochtend',
    },
  };
  const ok = await handleLead(lead, 'ip', deps);
  assert.equal(ok.status, 200);
  assert.match(ok.body.reference ?? '', /^L-/);
  assert.equal(mem.leads.size, 1);

  const spam = await handleLead({ ...lead, website: 'x' }, 'ip', deps);
  assert.equal(spam.status, 200);
  assert.equal(mem.leads.size, 1);

  const invalid = await handleLead({ ...lead, fields: { ...lead.fields, phone: '1' } }, 'ip', deps);
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.field, 'phone');

  const limited = await handleLead(lead, 'ip', { ...deps, allowRequest: () => false });
  assert.equal(limited.status, 429);
});

test('GET quote: right token returns it, wrong token 403, unknown 404, bad id 400', async () => {
  const { deps } = setup();
  await handleLead(body, 'ip', deps);
  const ok = await handleGetQuote(new URLSearchParams({ id: 'KB-2026-0001', token: TOKEN }), deps.storage);
  assert.equal(ok.status, 200);
  assert.ok(ok.kind === 'json' && 'customer' in ok.body && !('token' in ok.body));
  const pdf = await handleGetQuote(
    new URLSearchParams({ id: 'KB-2026-0001', token: TOKEN, format: 'pdf' }),
    deps.storage
  );
  assert.equal(pdf.kind, 'pdf');
  const wrong = await handleGetQuote(new URLSearchParams({ id: 'KB-2026-0001', token: 'fout' }), deps.storage);
  assert.equal(wrong.status, 403);
  const unknown = await handleGetQuote(new URLSearchParams({ id: 'KB-2026-0099', token: TOKEN }), deps.storage);
  assert.equal(unknown.status, 404);
  const bad = await handleGetQuote(new URLSearchParams({ id: '../x', token: TOKEN }), deps.storage);
  assert.equal(bad.status, 400);
});

test('helpers: tokensMatch and pdfSafe', () => {
  assert.equal(tokensMatch('abc', 'abc'), true);
  assert.equal(tokensMatch('abc', 'abd'), false);
  assert.equal(tokensMatch('abc', 'ab'), false);
  assert.equal(pdfSafe('Prijs € 1.250,00 · m² ✓ → klaar'), 'Prijs € 1.250,00 · m² v -> klaar');
});

test('MAIL_TEST_RECIPIENT sends the customer mail to the test inbox, marked as test', async () => {
  const sent: { to: string[]; subject: string; text: string; html: string }[] = [];
  const fetchImpl = async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)));
    return new Response('{"id":"re_1"}', { status: 200 });
  };
  const { deps } = setup({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl', MAIL_TEST_RECIPIENT: 'team@example.nl' },
    fetchImpl,
  });
  const result = await handleLead(body, 'ip', deps);
  assert.equal(result.body.delivery?.customer.status, 'sent');
  assert.deepEqual(sent.map((mail) => mail.to[0]), ['team@example.nl', 'team@example.nl']);
  assert.match(sent[1].subject, /^\[TEST → kees@example\.nl\] /);
  assert.match(sent[1].text, /^TESTMAIL: bedoeld voor kees@example\.nl/);
  assert.ok(sent[1].html.includes('TESTMAIL: bedoeld voor kees@example.nl'));
  assert.ok(!sent[0].subject.startsWith('[TEST'));
});


/** A published site with an owner who has an e-mail address. */
function publishedSite(overrides: Partial<PublishedSiteRecord> = {}): PublishedSiteRecord {
  return {
    slug: 'piet-schilderwerken',
    token: 'x'.repeat(32),
    sector: 'schilder',
    styleId: 'modern',
    form: {
      biz: 'Piet Schilderwerken',
      owner: 'Piet Jansen',
      phone: '0698765432',
      city: 'Haarlem',
      email: 'piet@pietschilderwerken.nl',
    },
    channel: 'WhatsApp',
    disabledServices: {},
    blocks: [],
    blockContent: {},
    text: {
      kicker: 'Schilderen',
      headline: 'De muur die je blijft bewonderen',
      intro: 'Sinds 1998',
      about: 'Ik ben Piet.',
      cta1: 'Bekijk mijn werk',
      cta2: 'Vraag een offerte',
    },
    timestamp: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function memorySites(sites: PublishedSiteRecord[] = []): SiteStorage {
  const map = new Map(sites.map((site) => [site.slug, site]));
  return {
    async saveSite(record) {
      map.set(record.slug, record);
      return `mem:${record.slug}`;
    },
    async getSite(slug) {
      return map.get(slug) ?? null;
    },
    async listSites() {
      return [...map.values()];
    },
  };
}

/** A mailer that records every mail instead of sending it. */
function mailRecorder(status = 'sent') {
  const sent: { to: string; subject: string; text: string }[] = [];
  const fetchImpl = async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as {
      to?: string[];
      subject?: string;
      text?: string;
    };
    sent.push({
      to: body.to?.[0] ?? '',
      subject: body.subject ?? '',
      text: body.text ?? '',
    });
    return new Response(
      status === 'sent' ? JSON.stringify({ id: 'mail-1' }) : 'kapot',
      { status: status === 'sent' ? 200 : 500 }
    );
  };
  return { sent, fetchImpl };
}

const contactLead = {
  type: 'contact',
  startedAt: NOW.getTime() - 60_000,
  site: { biz: 'Piet Schilderwerken', sector: 'schilder', slug: 'piet-schilderwerken' },
  fields: { name: 'Sanne', phone: '0612345678', message: 'Ik wil drie kozijnen schilderen.' },
};

test('een aanvraag op een klantsite gaat naar de vakman, niet naar Klusbaas', async () => {
  const { deps, mem } = setup();
  const mail = mailRecorder();
  const result = await handleLead(contactLead, 'ip', {
    ...deps,
    env: { RESEND_API_KEY: 'test' },
    fetchImpl: mail.fetchImpl,
    sites: memorySites([publishedSite()]),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.delivery?.owner?.status, 'sent');
  assert.equal(result.body.delivery?.team.status, 'skipped');
  // De bezoeker ziet het adres van de vakman nooit.
  assert.equal(result.body.delivery?.customer.to, '');
  assert.equal(mail.sent[0].to, 'piet@pietschilderwerken.nl');
  assert.match(mail.sent[0].subject, /Nieuwe aanvraag via je website/);
  assert.match(mail.sent[0].text, /Sanne/);
  // De aanvraag wordt bewaard in naam van de vakman, zodat hij hem in zijn
  // account kan terugzien. Het team mailt hem niet: de vakman is de
  // ontvanger.
  assert.equal(mem.leads.size, 1);
  assert.equal(mail.sent.length, 1);
});

test('een aanvraag zonder klantsite komt bij Klusbaas', async () => {
  const { deps, mem } = setup();
  const mail = mailRecorder();
  const result = await handleLead(
    { ...contactLead, site: { biz: 'Piet Schilderwerken', sector: 'schilder' } },
    'ip',
    {
      ...deps,
      env: { RESEND_API_KEY: 'test' },
      fetchImpl: mail.fetchImpl,
      sites: memorySites([publishedSite()]),
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.delivery?.owner, undefined);
  assert.equal(result.body.delivery?.team.status, 'sent');
  assert.equal(mail.sent.length, 1);
  assert.equal(mail.sent[0].to, 'thomascliphero@gmail.com');
  assert.equal(mem.leads.size, 1);
});

test('een onbekend adres of een site zonder e-mailadres gaat naar Klusbaas', async () => {
  const { deps, mem } = setup();
  const mail = mailRecorder();
  const unknown = await handleLead(
    { ...contactLead, site: { ...contactLead.site, slug: 'bestaat-niet' } },
    'ip',
    {
      ...deps,
      env: { RESEND_API_KEY: 'test' },
      fetchImpl: mail.fetchImpl,
      sites: memorySites([publishedSite()]),
    }
  );
  assert.equal(unknown.body.delivery?.owner, undefined);
  assert.equal(mail.sent[0].to, 'thomascliphero@gmail.com');

  const withoutMail = await handleLead(contactLead, 'ip', {
    ...deps,
    env: { RESEND_API_KEY: 'test' },
    fetchImpl: mail.fetchImpl,
    sites: memorySites([
      publishedSite({
        form: { biz: 'Piet Schilderwerken', owner: 'Piet', phone: '0698765432', city: 'Haarlem' },
      }),
    ]),
  });
  assert.equal(withoutMail.body.delivery?.owner, undefined);
  assert.equal(mem.leads.size, 2);
});

test('kan de site niet worden opgezocht, dan gaat de aanvraag naar Klusbaas', async () => {
  const { deps, mem } = setup();
  const mail = mailRecorder();
  const brokenSites: SiteStorage = {
    ...memorySites([publishedSite()]),
    async getSite() {
      throw new Error('blobs liggen plat');
    },
  };
  const result = await handleLead(contactLead, 'ip', {
    ...deps,
    env: { RESEND_API_KEY: 'test' },
    fetchImpl: mail.fetchImpl,
    sites: brokenSites,
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.delivery?.owner, undefined);
  assert.equal(mail.sent[0].to, 'thomascliphero@gmail.com');
  assert.equal(mem.leads.size, 1);
});

test('gaat de mail naar de vakman mis, dan blijft de aanvraag bij Klusbaas', async () => {
  const { deps, mem } = setup();
  const mail = mailRecorder('failed');
  const result = await handleLead(contactLead, 'ip', {
    ...deps,
    env: { RESEND_API_KEY: 'test' },
    fetchImpl: mail.fetchImpl,
    sites: memorySites([publishedSite()]),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.delivery?.owner?.status, 'failed');
  // Niets mag verloren gaan: Klusbaas bewaart hem en mailt het team.
  assert.equal(mem.leads.size, 1);
  // Eerst de vakman, dan Klusbaas als back-up.
  assert.equal(mail.sent.length, 2);
  assert.equal(mail.sent[0].to, 'piet@pietschilderwerken.nl');
  assert.equal(mail.sent[1].to, 'thomascliphero@gmail.com');
});
