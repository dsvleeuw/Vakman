import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord, StoredLead } from '../types';
import { handleAccount } from './accountHandler';
import { handleAdmin } from './adminHandler';
import { accountId, type AccountStorage, type LeadStorage, type SiteStorage } from './storage';
import { buildQuoteRecord, type QuoteRecord } from '../utils/quote';
import { createMemoryAdminStorage } from './adminStorage';

/**
 * The delivery checklist of an offer (phase 7.16).
 *
 * Klusbaas ticks off what he did for the site of the customer; the
 * customer sees the same list in his account and in the offer.
 */

function memoryAccounts(): AccountStorage {
  const accounts = new Map<string, Account>();
  const sessions = new Map<string, AccountSession>();
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
    async listSessionsOf() {
      return [];
    },
    async deleteAccount(id: string) {
      accounts.delete(id);
    },
  };
}

function memorySites(): SiteStorage {
  const sites = new Map<string, PublishedSiteRecord>();
  return {
    async saveSite(record) {
      sites.set(record.slug, record);
      return `memory:${record.slug}`;
    },
    async getSite(slug) {
      return sites.get(slug) ?? null;
    },
    async listSites() {
      return [...sites.values()];
    },
    async deleteSite(slug: string) {
      sites.delete(slug);
    },
  };
}

function memoryQuotes(quotes: QuoteRecord[] = []): LeadStorage {
  const map = new Map(quotes.map((quote) => [quote.id, quote]));
  return {
    async nextQuoteSequence() {
      return map.size + 1;
    },
    async saveQuote(record) {
      map.set(record.id, record);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return map.get(id) ?? null;
    },
    async getQuotePdf() {
      return null;
    },
    async saveLead(reference: string, lead: unknown) {
      return 'memory';
    },
    async listLeads() {
      return [] as StoredLead[];
    },
    async updateLeadStatus() {
      return null;
    },
    async listQuotes() {
      return [...map.values()];
    },
    async updateQuoteStatus(id, status) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, status };
      map.set(id, updated);
      return updated;
    },
    async linkQuoteToAccount(id, accountId) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, accountId };
      map.set(id, updated);
      return updated;
    },
    async extendQuote(id, validUntil) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, validUntil };
      map.set(id, updated);
      return updated;
    },
    async markPaymentReported(id, reportedAt) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, paymentReportedAt: reportedAt };
      map.set(id, updated);
      return updated;
    },
    async updateQuoteDelivery(id, delivery) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, delivery };
      map.set(id, updated);
      return updated;
    },
    async deleteQuote() {
      return;
    },
    async anonymizeQuote() {
      return null;
    },
    async deleteLead() {
      return;
    },
  };
}

const site: PublishedSiteRecord = {
  slug: 'jansen-schilderwerken',
  token: 'tokentokentoken',
  sector: 'schilder',
  styleId: 'modern',
  form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
  channel: 'E-mail',
  disabledServices: {},
  blocks: [],
  blockContent: {},
  text: {
    kicker: 'Schilderen',
    headline: 'De muur die je blijft bewonderen',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Bekijk mijn werk',
    cta2: 'Vraag een offerte',
  },
  timestamp: 1,
  updatedAt: 1,
};

/** An offer with a delivery checklist, as Klusbaas wrote it. */
function quote(accountId: string): QuoteRecord {
  return buildQuoteRecord({
    id: 'KB-2026-0001',
    token: 'geheim',
    now: '2026-10-20T10:00:00.000Z',
    planId: 'pro',
    addons: [],
    customer: {
      biz: 'Jansen Schilderwerken',
      owner: 'Jan Jansen',
      phone: '0698765432',
      city: 'Haarlem',
      email: 'jan@bedrijf.nl',
    },
    sector: 'schilder',
    sectorName: 'Schilder',
    styleName: 'Modern',
    services: ['Binnen schilderen'],
    channel: 'E-mail',
    accountId,
  });
}

async function setup() {
  const accounts = memoryAccounts();
  const sites = memorySites();
  await sites.saveSite(site);
  const accountIdOfCustomer = accountId('jan@bedrijf.nl');
  const quotes = memoryQuotes([quote(accountIdOfCustomer)]);
  const sessions = createMemoryAdminStorage();

  const accountDeps = {
    accounts,
    sites,
    quotes,
    now: () => 1_700_000_000_000,
    createSessionId: () => 'sessie-1',
    siteUrl: 'https://klusbaas.test',
  };

  const adminDeps = {
    env: { ADMIN_PASSWORD: 'geheim' },
    sessions,
    sites,
    leads: quotes,
    accounts,
    now: () => 1_700_000_000_000,
    createSessionId: () => 'admin-sessie',
    siteUrl: 'https://klusbaas.test',
  };

  const login = await handleAdmin({ action: 'login', password: 'geheim' }, adminDeps, null);
  const adminCookie = login.setCookie?.split(';')[0] ?? '';

  // De klant maakt een account en logt in.
  await handleAccount(
    { action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk-wachtwoord' },
    accountDeps
  );
  const customer = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk-wachtwoord' },
    accountDeps
  );
  const cookie = customer.setCookie?.split(';')[0] ?? '';

  return { accounts, quotes, adminDeps, adminCookie, accountDeps, cookie };
}

test('de klant ziet de opleverchecklist van zijn offerte', async () => {
  const { accountDeps, cookie } = await setup();
  const result = await handleAccount({ action: 'quotes' }, accountDeps, cookie);
  assert.equal(result.status, 200);
  const quote = result.body.quotes?.[0];
  assert.ok(quote);
  assert.ok(quote.delivery && quote.delivery.length > 0);
  assert.equal(quote.delivery.every((item) => !item.done), true);
});

test('Klusbaas vinkt een stap af; de klant ziet dat', async () => {
  const { adminDeps, adminCookie, accountDeps, cookie, quotes } = await setup();
  const record = await quotes.getQuote('KB-2026-0001');
  assert.ok(record?.delivery?.length);
  const first = record.delivery[0];

  const result = await handleAdmin(
    { action: 'delivery', id: 'KB-2026-0001', itemId: first.id, done: true },
    adminDeps,
    adminCookie
  );
  assert.equal(result.status, 200);

  const stored = await quotes.getQuote('KB-2026-0001');
  assert.equal(stored?.delivery?.[0].done, true);
  assert.ok(stored?.delivery?.[0].doneAt);

  const customer = await handleAccount({ action: 'quotes' }, accountDeps, cookie);
  const item = customer.body.quotes?.[0].delivery?.[0];
  assert.equal(item?.done, true);
});

test('een stap kan weer worden afgevinkt', async () => {
  const { adminDeps, adminCookie, quotes } = await setup();
  const record = await quotes.getQuote('KB-2026-0001');
  const first = record!.delivery![0];

  await handleAdmin(
    { action: 'delivery', id: 'KB-2026-0001', itemId: first.id, done: true },
    adminDeps,
    adminCookie
  );
  await handleAdmin(
    { action: 'delivery', id: 'KB-2026-0001', itemId: first.id, done: false },
    adminDeps,
    adminCookie
  );

  const stored = await quotes.getQuote('KB-2026-0001');
  assert.equal(stored?.delivery?.[0].done, false);
});

test('een onbekende offerte of stap geeft een duidelijke melding', async () => {
  const { adminDeps, adminCookie } = await setup();
  const unknownQuote = await handleAdmin(
    { action: 'delivery', id: 'KB-2026-9999', itemId: 'pro-1', done: true },
    adminDeps,
    adminCookie
  );
  assert.equal(unknownQuote.status, 404);

  const unknownItem = await handleAdmin(
    { action: 'delivery', id: 'KB-2026-0001', itemId: 'bestaat-niet', done: true },
    adminDeps,
    adminCookie
  );
  assert.equal(unknownItem.status, 200);
  // De lijst blijft zoals hij was: er wordt niets toegevoegd of weggehaald.
  const stored = await adminDeps.leads.getQuote('KB-2026-0001');
  assert.equal(stored?.delivery?.length, 3 + 2);
});
