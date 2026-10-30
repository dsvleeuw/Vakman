import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';
import { handleQuoteRequest, OFFER_REQUEST_TYPE } from './quoteRequest';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';

/**
 * The customer asks for an offer himself, in his own site editor (7.13).
 *
 * The offer has to be real: a number, a price, a PDF and a place in his
 * account. The request has to be stored too, so Klusbaas sees what the
 * customer wants and the request never disappears.
 */

const ACCOUNT: Account = {
  id: 'acc-jansen',
  email: 'jan@jansen.nl',
  passwordHash: 'hash',
  createdAt: 1,
  updatedAt: 1,
  verifiedAt: 2,
};

const SESSION_ID = 'sess-jansen';
const COOKIE = `klusbaas_session=${SESSION_ID}`;

function memoryAccounts(): AccountStorage {
  const accounts = new Map<string, Account>([[ACCOUNT.id, ACCOUNT]]);
  const sessions = new Map<string, AccountSession>([
    [
      SESSION_ID,
      {
        id: SESSION_ID,
        accountId: ACCOUNT.id,
        createdAt: 1,
        expiresAt: Date.parse('2026-12-31T00:00:00.000Z'),
      },
    ],
  ]);
  return {
    async saveAccount(account) {
      accounts.set(account.id, account);
      return `memory:${account.id}`;
    },
    async listAccounts() {
      return [...accounts.values()];
    },
    async getAccount(id) {
      return accounts.get(id) ?? null;
    },
    async getAccountByEmail(email) {
      return [...accounts.values()].find((account) => account.email === email) ?? null;
    },
    async saveSession(session) {
      sessions.set(session.id, session);
      return `memory:${session.id}`;
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
  };
}

interface MemoryStorage extends LeadStorage {
  quotes: Map<string, QuoteRecord>;
  leads: Map<string, StoredLead>;
}

function memoryStorage(): MemoryStorage {
  const quotes = new Map<string, QuoteRecord>();
  const leads = new Map<string, StoredLead>();
  let sequence = 0;
  return {
    quotes,
    leads,
    async nextQuoteSequence() {
      sequence += 1;
      return sequence;
    },
    async saveQuote(record) {
      quotes.set(record.id, record);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return quotes.get(id) ?? null;
    },
    async getQuotePdf() {
      return null;
    },
    async saveLead(reference, lead) {
      leads.set(reference, lead as StoredLead);
      return `memory:${reference}`;
    },
    async listLeads() {
      return [...leads.values()];
    },
    async listQuotes() {
      return [...quotes.values()];
    },
    async updateQuoteStatus() {
      return null;
    },
    async linkQuoteToAccount() {
      return null;
    },
    async extendQuote() {
      return null;
    },
    async markPaymentReported() {
      return null;
    },
    async updateQuoteDelivery() {
      return null;
    },
  };
}

function memorySites(site: PublishedSiteRecord | null): SiteStorage {
  return {
    async saveSite(record) {
      site = record;
      return `memory:${record.slug}`;
    },
    async getSite(slug) {
      return site && site.slug === slug ? site : null;
    },
    async listSites() {
      return site ? [site] : [];
    },
  };
}

/** A published site of the customer. */
function ownSite(overrides: Partial<PublishedSiteRecord> = {}): PublishedSiteRecord {
  return {
    slug: 'jansen-schilderwerken',
    token: 'sitetoken',
    ownerId: ACCOUNT.id,
    sector: 'schilder',
    styleId: 'klassiek',
    form: {
      biz: 'Jansen Schilderwerken',
      owner: 'Jan Jansen',
      phone: '0612345678',
      city: 'Haarlem',
      email: 'jan@jansen.nl',
    },
    channel: 'E-mail',
    disabledServices: {},
    blocks: [],
    blockContent: {},
    services: [{ n: 'Binnenmuur schilderen', d: '', amount: 0 }],
    text: {
      kicker: '',
      headline: '',
      intro: '',
      about: '',
      cta1: '',
      cta2: '',
    },
    timestamp: 1,
    updatedAt: 1,
    ...overrides,
  } as unknown as PublishedSiteRecord;
}

const REQUEST_BODY = {
  plan: 'pro',
  addons: ['trust-bar'],
  message: 'Ik wil graag een eigen .nl-domein.',
  sector: 'schilder',
  style: 'klassiek',
  services: ['Binnenmuur schilderen'],
  form: {
    biz: 'Jansen Schilderwerken',
    owner: 'Jan Jansen',
    phone: '0612345678',
    city: 'Haarlem',
  },
};

test('zonder sessie wordt de aanvraag geweigerd: er is geen klant', async () => {
  const storage = memoryStorage();
  const result = await handleQuoteRequest(
    REQUEST_BODY,
    { accounts: memoryAccounts(), leads: storage },
    null
  );
  assert.equal(result.status, 401);
  assert.equal(result.body.ok, false);
  assert.equal(storage.quotes.size, 0);
  assert.equal(storage.leads.size, 0);
});

test('zonder pakket of zonder bedrijfsnaam komt een duidelijke fout terug', async () => {
  const storage = memoryStorage();
  const deps = { accounts: memoryAccounts(), leads: storage };

  const noPlan = await handleQuoteRequest({ ...REQUEST_BODY, plan: 'duur' }, deps, COOKIE);
  assert.equal(noPlan.status, 400);
  assert.equal(noPlan.body.field, 'plan');

  const noBiz = await handleQuoteRequest(
    { ...REQUEST_BODY, form: { ...REQUEST_BODY.form, biz: '' } },
    deps,
    COOKIE
  );
  assert.equal(noBiz.status, 400);
  assert.equal(noBiz.body.field, 'biz');
});

test('de klant krijgt een echte offerte met nummer, prijs en link', async () => {
  const storage = memoryStorage();
  const mails: { to: string; subject: string; text: string; attachments?: unknown[] }[] = [];

  const result = await handleQuoteRequest(
    REQUEST_BODY,
    {
      accounts: memoryAccounts(),
      leads: storage,
      sites: memorySites(ownSite()),
      sendMail: async (mail) => {
        mails.push(mail);
        return 'sent';
      },
      notifyEmail: 'team@klusbaas.nl',
      siteUrl: 'https://klusbaas.nl',
      payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
      now: () => new Date('2026-10-30T09:00:00.000Z'),
    },
    COOKIE
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.quote?.id, 'KB-2026-0001');
  assert.match(result.body.quote?.path ?? '', /^\/offerte\/KB-2026-0001\?token=/);
  // Pro 995 + vertrouwensbalk 49 = 1044 excl. btw, 21% btw.
  assert.equal(result.body.quote?.subtotalCents, 104400);
  assert.equal(result.body.quote?.vatCents, 21924);
  assert.equal(result.body.quote?.totalCents, 126324);

  // De offerte staat in het account van de klant en verwijst naar de aanvraag.
  const stored = await storage.getQuote('KB-2026-0001');
  assert.equal(stored?.accountId, ACCOUNT.id);
  assert.equal(stored?.leadReference, result.body.reference);
  assert.equal(stored?.customer.email, 'jan@jansen.nl');
  assert.equal(stored?.sectorName, 'Schilder');
  assert.deepEqual(stored?.services, ['Binnenmuur schilderen']);

  // De aanvraag zelf is opgeslagen, met de eigen woorden van de klant.
  const leads = await storage.listLeads();
  assert.equal(leads.length, 1);
  assert.equal(leads[0].type, OFFER_REQUEST_TYPE);
  assert.equal(leads[0].reference, result.body.reference);
  assert.equal(leads[0].fields.message, 'Ik wil graag een eigen .nl-domein.');
  assert.equal(leads[0].fields.email, 'jan@jansen.nl');
  assert.equal(leads[0].fields.biz, 'Jansen Schilderwerken');

  // Klusbaas en de klant krijgen beide een mail, met de offerte als PDF.
  assert.equal(mails.length, 2);
  assert.equal(mails[0].to, 'team@klusbaas.nl');
  assert.match(mails[0].subject, /Offerte-aanvraag/);
  assert.match(mails[0].text, /eigen \.nl-domein/);
  assert.equal(mails[1].to, 'jan@jansen.nl');
  assert.match(mails[1].text, /KB-2026-0001/);
  assert.match(mails[1].text, /NL91ABNA0417164300/);
  assert.equal(mails[0].attachments?.length, 1);
  assert.equal(mails[1].attachments?.length, 1);
});

test('een site van iemand anders wordt niet gebruikt', async () => {
  const storage = memoryStorage();
  const site = ownSite({ ownerId: 'iemand-anders' });
  const result = await handleQuoteRequest(
    { ...REQUEST_BODY, siteSlug: site.slug, form: { biz: '', owner: '', phone: '', city: '' } },
    {
      accounts: memoryAccounts(),
      leads: storage,
      sites: memorySites(site),
      now: () => new Date('2026-10-30T09:00:00.000Z'),
    },
    COOKIE
  );
  // De klantgegevens van de site van een ander worden niet overgenomen.
  assert.equal(result.status, 400);
  assert.equal(result.body.field, 'biz');
});

test('de klant kan niet onbeperkt offertes aanvragen', async () => {
  const storage = memoryStorage();
  const result = await handleQuoteRequest(
    REQUEST_BODY,
    {
      accounts: memoryAccounts(),
      leads: storage,
      allowRequest: () => false,
      now: () => new Date('2026-10-30T09:00:00.000Z'),
    },
    COOKIE
  );
  assert.equal(result.status, 429);
  assert.equal(storage.quotes.size, 0);
});

test('ook zonder mailer blijft de offerte staan: hij staat in het account', async () => {
  const storage = memoryStorage();
  const result = await handleQuoteRequest(
    REQUEST_BODY,
    {
      accounts: memoryAccounts(),
      leads: storage,
      now: () => new Date('2026-10-30T09:00:00.000Z'),
    },
    COOKIE
  );
  assert.equal(result.status, 200);
  assert.equal(storage.quotes.size, 1);
  assert.equal(storage.leads.size, 1);
});
