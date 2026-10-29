import test from 'node:test';
import assert from 'node:assert/strict';
import type { PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';
import { createMemoryAdminStorage } from './adminStorage';
import { adminCookie, handleAdmin, passwordMatches, readAdminSessionId } from './adminHandler';
import type { LeadStorage, SiteStorage } from './storage';

/** A site in memory. */
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
  };
}

/** Requests and offers in memory. */
function memoryStorage(leads: StoredLead[] = [], quotes: QuoteRecord[] = []): LeadStorage {
  const leadMap = new Map(leads.map((lead) => [lead.reference, lead]));
  const quoteMap = new Map(quotes.map((quote) => [quote.id, quote]));
  return {
    async nextQuoteSequence() {
      return quoteMap.size + 1;
    },
    async saveQuote(record) {
      quoteMap.set(record.id, record);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return quoteMap.get(id) ?? null;
    },
    async getQuotePdf() {
      return null;
    },
    async saveLead(reference, lead) {
      leadMap.set(reference, lead as StoredLead);
      return `memory:${reference}`;
    },
    async listLeads() {
      return [...leadMap.values()];
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
  };
}

const publishedSite: PublishedSiteRecord = {
  slug: 'jansen-schilderwerken',
  token: 'tokentokentoken',
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
  timestamp: 1,
  updatedAt: 1,
};

const quote: QuoteRecord = {
  id: 'KB-2026-0001',
  token: 'quotetoken',
  createdAt: '2026-10-29T10:00:00.000Z',
  validUntil: '2026-11-28T10:00:00.000Z',
  status: 'open',
  customer: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
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
};

function deps(overrides: { password?: string | undefined } = {}) {
  return {
    env: { ADMIN_PASSWORD: overrides.password === undefined ? 'geheim' : overrides.password },
    sessions: createMemoryAdminStorage(),
    sites: memorySites([publishedSite]),
    leads: memoryStorage(
      [
        {
          reference: 'L-AAAA01',
          createdAt: '2026-10-29T10:00:00.000Z',
          type: 'contact',
          site: { biz: 'Jansen Schilderwerken', sector: 'schilder', slug: 'jansen-schilderwerken' },
          fields: { name: 'Sanne', phone: '0612345678', message: 'Ik wil drie kozijnen schilderen.' },
        },
      ],
      [quote]
    ),
    now: () => 1_700_000_000_000,
    createSessionId: () => 'adminsessie',
  };
}

test('zonder beheerderswachtwoord is het overzicht gesloten', async () => {
  const result = await handleAdmin({ action: 'login', password: 'geheim' }, deps({ password: '' }), null, false);
  assert.equal(result.status, 503);
  assert.equal(result.setCookie, undefined);
});

test('een verkeerd wachtwoord geeft geen sessie', async () => {
  const result = await handleAdmin({ action: 'login', password: 'fout' }, deps(), null, false);
  assert.equal(result.status, 401);
  assert.equal(result.setCookie, undefined);
});

test('inloggen met het juiste wachtwoord geeft een sessie', async () => {
  const result = await handleAdmin({ action: 'login', password: 'geheim' }, deps(), null, false);
  assert.equal(result.status, 200);
  assert.match(result.setCookie ?? '', /^klusbaas_admin=/);
  assert.match(result.setCookie ?? '', /HttpOnly/);
});

test('zonder cookie ziet niemand het overzicht', async () => {
  const result = await handleAdmin({ action: 'overview' }, deps(), null, false);
  assert.equal(result.status, 401);
});

test('het overzicht toont de sites, de aanvragen en de offertes', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const cookie = login.setCookie;

  const result = await handleAdmin({ action: 'overview' }, d, cookie, false);
  assert.equal(result.status, 200);
  const overview = result.body.overview;
  assert.equal(overview?.sites.length, 1);
  assert.equal(overview?.sites[0].slug, 'jansen-schilderwerken');
  assert.equal(overview?.sites[0].hasAccount, false);
  assert.match(overview?.sites[0].manageUrl ?? '', /token=tokentokentoken/);
  assert.equal(overview?.leads.length, 1);
  assert.equal(overview?.leads[0].reference, 'L-AAAA01');
  assert.equal(overview?.quotes.length, 1);
  assert.equal(overview?.quotes[0].status, 'open');
  assert.equal(overview?.quotes[0].customerName, 'Jan Jansen');
});

test('een offerte als betaald markeren werkt', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const cookie = login.setCookie;

  const result = await handleAdmin(
    { action: 'quote-status', id: 'KB-2026-0001', status: 'paid' },
    d,
    cookie,
    false
  );
  assert.equal(result.status, 200);

  const overview = await handleAdmin({ action: 'overview' }, d, cookie, false);
  assert.equal(overview.body.overview?.quotes[0].status, 'paid');
});

test('een onbekende offerte geeft een duidelijke melding', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const result = await handleAdmin(
    { action: 'quote-status', id: 'KB-2099-9999', status: 'paid' },
    d,
    login.setCookie,
    false
  );
  assert.equal(result.status, 404);
});

test('zonder cookie kan niemand een offerte maken', async () => {
  const d = deps();
  const result = await handleAdmin(
    { action: 'create-quote', email: 'jan@jansen.nl', plan: 'pro' },
    d,
    null,
    false
  );
  assert.equal(result.status, 401);
  assert.equal((await d.leads.listQuotes()).length, 1, 'er is nog steeds alleen de oude offerte');
});

test('Klusbaas maakt een offerte voor een klant', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const cookie = login.setCookie;

  const result = await handleAdmin(
    {
      action: 'create-quote',
      email: 'jan@jansen.nl',
      plan: 'pro',
      siteSlug: 'jansen-schilderwerken',
    },
    d,
    cookie,
    false
  );

  assert.equal(result.status, 200);
  assert.match(result.body.quote?.id ?? '', /^KB-\d{4}-0002$/);
  assert.equal(result.body.quote?.planName, 'Pro');
  assert.equal(result.body.quote?.mailed, false, 'zonder mailer gaat er geen mail uit');

  // De nieuwe offerte staat in het overzicht.
  const overview = await handleAdmin({ action: 'overview' }, d, cookie, false);
  assert.equal(overview.body.overview?.quotes.length, 2);
});

test('een offerte zonder e-mailadres wordt geweigerd', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const result = await handleAdmin(
    { action: 'create-quote', plan: 'pro' },
    d,
    login.setCookie,
    false
  );
  assert.equal(result.status, 400);
  assert.equal(result.body.field, 'email');
});

test('uitloggen wist de sessie', async () => {
  const d = deps();
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  const cookie = login.setCookie;

  const out = await handleAdmin({ action: 'logout' }, d, cookie, false);
  assert.equal(out.status, 200);
  assert.match(out.clearCookie ?? '', /Max-Age=0/);

  const result = await handleAdmin({ action: 'overview' }, d, cookie, false);
  assert.equal(result.status, 401);
});

test('de wachtwoordvergelijking is constant in tijd', () => {
  assert.equal(passwordMatches('geheim', 'geheim'), true);
  assert.equal(passwordMatches('geheim', 'geheimp'), false);
  assert.equal(passwordMatches('', 'geheim'), false);
});

test('de sessiecookie draagt de sessie mee', () => {
  const cookie = adminCookie('sessie123', false);
  assert.equal(readAdminSessionId(cookie), 'sessie123');
  assert.equal(readAdminSessionId('andere=1; klusbaas_admin=sessie123'), 'sessie123');
  assert.equal(readAdminSessionId(null), null);
});

test('te veel inlogpogingen worden geweigerd', async () => {
  let attempts = 0;
  const d = {
    ...deps(),
    allowRequest: () => {
      attempts += 1;
      return attempts <= 2;
    },
  };
  const first = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  assert.equal(first.status, 200);
  const second = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  assert.equal(second.status, 200);
  const third = await handleAdmin({ action: 'login', password: 'geheim' }, d, null, false);
  assert.equal(third.status, 429);
  assert.equal(third.setCookie, undefined);
});
