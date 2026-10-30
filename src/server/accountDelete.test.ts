import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';
import { handleAccount } from './accountHandler';
import { deleteAccountData, mediaKeysOf, planAccountDeletion } from './accountDelete';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import type { MediaStorage } from './mediaHandler';

/**
 * Het verwijderen van een account (AVG art. 17). De klant doet het zelf,
 * in zijn eigen account. Zijn sites, zijn aanvragen en zijn openstaande
 * offertes gaan; de betaalde offertes blijven als fiscale gegevens, zonder
 * zijn persoonsgegevens.
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
    async listSessionsOf(accountId) {
      return [...sessions.values()].filter((session) => session.accountId === accountId);
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
    async deleteAccount(id) {
      accounts.delete(id);
    },
  };
}

function memorySites(sites: PublishedSiteRecord[] = []): SiteStorage {
  const map = new Map(sites.map((site) => [site.slug, site]));
  return {
    async saveSite(record) {
      map.set(record.slug, record);
      return `memory:${record.slug}`;
    },
    async getSite(slug) {
      return map.get(slug) ?? null;
    },
    async listSites() {
      return [...map.values()];
    },
    async deleteSite(slug) {
      map.delete(slug);
    },
  };
}

function memoryStorage(leads: StoredLead[] = [], quotes: QuoteRecord[] = []): LeadStorage {
  const leadMap = new Map(leads.map((lead) => [lead.reference, lead]));
  const quoteMap = new Map(quotes.map((quote) => [quote.id, quote]));
  const pdfs = new Map<string, Uint8Array>();
  return {
    async nextQuoteSequence() {
      return quoteMap.size + 1;
    },
    async saveQuote(record, pdf) {
      quoteMap.set(record.id, record);
      pdfs.set(record.id, pdf);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return quoteMap.get(id) ?? null;
    },
    async getQuotePdf(id) {
      return pdfs.get(id) ?? null;
    },
    async saveLead(reference, lead) {
      leadMap.set(reference, lead as StoredLead);
      return `memory:${reference}`;
    },
    async listLeads() {
      return [...leadMap.values()];
    },
    async updateLeadStatus(reference, status) {
      const record = leadMap.get(reference);
      if (!record) return null;
      const updated = { ...record, status };
      leadMap.set(reference, updated);
      return updated;
    },
    async deleteLead(reference) {
      leadMap.delete(reference);
    },
    async listQuotes() {
      return [...quoteMap.values()];
    },
    async updateQuoteStatus(id, status) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, status };
      quoteMap.set(id, updated);
      return updated;
    },
    async linkQuoteToAccount(id, accountId) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, accountId };
      quoteMap.set(id, updated);
      return updated;
    },
    async extendQuote(id, validUntil) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, validUntil };
      quoteMap.set(id, updated);
      return updated;
    },
    async markPaymentReported(id, reportedAt) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, paymentReportedAt: reportedAt };
      quoteMap.set(id, updated);
      return updated;
    },
    async updateQuoteDelivery(id, delivery) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, delivery };
      quoteMap.set(id, updated);
      return updated;
    },
    async deleteQuote(id) {
      quoteMap.delete(id);
      pdfs.delete(id);
    },
    async anonymizeQuote(id, at) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = {
        ...record,
        customer: { biz: record.customer.biz, owner: '', phone: '', city: record.customer.city },
        anonymizedAt: at,
      };
      quoteMap.set(id, updated);
      pdfs.delete(id);
      return updated;
    },
  };
}

function memoryMedia(): MediaStorage {
  const photos = new Map<string, { data: Uint8Array; contentType: string }>();
  return {
    async saveMedia(key, data, contentType) {
      photos.set(key, { data, contentType });
      return `memory:${key}`;
    },
    async getMedia(key) {
      return photos.get(key) ?? null;
    },
    async deleteMedia(key) {
      photos.delete(key);
    },
  };
}

const site: PublishedSiteRecord = {
  slug: 'jansen-schilderwerken',
  token: 'tokentokentoken',
  ownerId: 'account-1',
  sector: 'schilder',
  styleId: 'modern',
  form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
  channel: 'WhatsApp',
  disabledServices: {},
  blocks: [],
  blockContent: {},
  text: {
    kicker: 'Schilderen',
    headline: 'De muur',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Werk',
    cta2: 'Offerte',
  },
  heroPhoto: '/api/media?key=photo-001.jpg',
  work: [{ t: 'Kozijnen', c: 'Haarlem', y: '2026', img: '/api/media?key=photo-002.png' }],
  timestamp: 1,
  updatedAt: 1,
};

const lead: StoredLead = {
  reference: 'L-AAAA01',
  createdAt: '2026-10-29T10:00:00.000Z',
  type: 'contact',
  site: { biz: 'Jansen Schilderwerken', sector: 'schilder', slug: 'jansen-schilderwerken' },
  fields: { name: 'Sanne', phone: '0612345678' },
};

function quote(overrides: Partial<QuoteRecord> = {}): QuoteRecord {
  return {
    id: 'KB-2026-0001',
    token: 'quotetoken',
    createdAt: '2026-10-29T10:00:00.000Z',
    validUntil: '2026-11-28T10:00:00.000Z',
    status: 'open',
    accountId: 'account-1',
    customer: {
      biz: 'Jansen Schilderwerken',
      owner: 'Jan Jansen',
      phone: '0698765432',
      city: 'Haarlem',
      email: 'jan@jansen.nl',
    },
    sector: 'schilder',
    sectorName: 'Schilder',
    styleName: 'Modern',
    services: ['Binnenmuur schilderen'],
    channel: 'WhatsApp',
    planId: 'pro',
    planName: 'Pro',
    lines: [],
    subtotalCents: 99500,
    vatCents: 20895,
    totalCents: 120395,
    ...overrides,
  };
}

test('de foto\'s van een site horen bij de site', () => {
  assert.deepEqual(mediaKeysOf(site), ['photo-001.jpg', 'photo-002.png']);
  // Een foto die niet van ons is, telt niet mee.
  assert.deepEqual(mediaKeysOf({ ...site, heroPhoto: 'https://example.com/foto.jpg' }), [
    'photo-002.png',
  ]);
});

test('het plan bepaalt wat gaat en wat blijft', () => {
  const plan = planAccountDeletion({
    sites: [site],
    leads: [lead, { ...lead, reference: 'L-BBBB02', site: { biz: 'Andere', sector: 'schilder', slug: 'anders' } }],
    quotes: [quote(), quote({ id: 'KB-2026-0002', status: 'paid', paidAt: '2026-10-29T12:00:00.000Z' })],
  });

  assert.equal(plan.sites.length, 1);
  assert.equal(plan.leads.length, 1, 'alleen de aanvragen van de eigen site');
  assert.equal(plan.quotes.length, 1, 'de onbetaalde offerte gaat');
  assert.equal(plan.keptQuotes.length, 1, 'de betaalde offerte blijft');
  assert.equal(plan.mediaKeys.length, 2);
});

test('het verwijderen haalt de site, de aanvragen en de offertes weg', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites([site]);
  const leads = memoryStorage([lead], [quote(), quote({ id: 'KB-2026-0002', status: 'paid' })]);
  const media = memoryMedia();
  await media.saveMedia('photo-001.jpg', new Uint8Array([1, 2, 3]), 'image/jpeg');
  await media.saveMedia('photo-002.png', new Uint8Array([4, 5, 6]), 'image/png');

  const plan = planAccountDeletion({
    sites: [site],
    leads: [lead],
    quotes: [quote(), quote({ id: 'KB-2026-0002', status: 'paid' })],
  });
  const result = await deleteAccountData('account-1', plan, {
    accounts,
    sites,
    leads,
    media,
  });

  assert.equal(result.sites, 1);
  assert.equal(result.leads, 1);
  assert.equal(result.quotes, 1);
  assert.equal(result.keptQuotes, 1);
  assert.equal(result.media, 2);

  assert.equal(await sites.getSite('jansen-schilderwerken'), null, 'de site is weg');
  assert.equal((await leads.listLeads()).length, 0, 'de aanvraag is weg');
  assert.equal(await media.getMedia('photo-001.jpg'), null, 'de foto is weg');

  const kept = await leads.getQuote('KB-2026-0002');
  assert.ok(kept, 'de betaalde offerte blijft bestaan');
  assert.equal(kept.customer.owner, '', 'de persoonsgegevens zijn weg');
  assert.equal(kept.customer.phone, '');
  assert.equal(kept.customer.email, undefined);
  assert.equal(kept.customer.biz, 'Jansen Schilderwerken', 'de bedrijfsnaam blijft');
  assert.equal(kept.totalCents, 120395, 'het bedrag blijft');
  assert.ok(kept.anonymizedAt, 'de offerte zegt dat de persoonsgegevens zijn verwijderd');
});

test('de klant verwijdert zijn account zelf, met zijn wachtwoord', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites([site]);
  const leads = memoryStorage([lead], [quote()]);
  const d = { accounts, sites, leads, quotes: leads };

  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const login = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';
  await handleAccount({ action: 'claim', slug: 'jansen-schilderwerken', token: 'tokentokentoken' }, d, cookie);

  // Zonder wachtwoord of bevestiging gebeurt er niets.
  const noPassword = await handleAccount({ action: 'delete-account', confirm: true }, d, cookie);
  assert.equal(noPassword.status, 400);
  const wrongPassword = await handleAccount(
    { action: 'delete-account', password: 'fout', confirm: true },
    d,
    cookie
  );
  assert.equal(wrongPassword.status, 401);
  const noConfirm = await handleAccount(
    { action: 'delete-account', password: 'moeilijk' },
    d,
    cookie
  );
  assert.equal(noConfirm.status, 400);
  assert.ok(await sites.getSite('jansen-schilderwerken'), 'de site staat er nog');

  // Met het juiste wachtwoord en een bevestiging gaat het account weg.
  const result = await handleAccount(
    { action: 'delete-account', password: 'moeilijk', confirm: true },
    d,
    cookie
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.deleted?.sites, 1);
  assert.equal(await sites.getSite('jansen-schilderwerken'), null);
  assert.equal(await accounts.getAccountByEmail('jan@bedrijf.nl'), null, 'het account is weg');

  // Zonder sessie kan niemand meer inloggen met dat account.
  const again = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  assert.equal(again.status, 401);
});

test('zonder sessie kan niemand een account verwijderen', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites();
  const leads = memoryStorage();
  const d = { accounts, sites, leads, quotes: leads };

  const result = await handleAccount(
    { action: 'delete-account', password: 'moeilijk', confirm: true },
    d
  );
  assert.equal(result.status, 401);
});
