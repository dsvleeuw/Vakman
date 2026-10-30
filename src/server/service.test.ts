import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord } from '../types';
import { handleAccount } from './accountHandler';
import { handleAdmin } from './adminHandler';
import type { AccountStorage, SiteStorage } from './storage';
import { createMemoryAdminStorage } from './adminStorage';
import { SERVICE_AMOUNT_CENTS } from '../utils/service';

/**
 * The monthly service (phase 7.15).
 *
 * The customer asks for it in his own account, Klusbaas switches it on and
 * sends the monthly invoice. The customer can stop it every month, and the
 * site and the code stay his.
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
  };
}

const memoryAdminSessions = () => createMemoryAdminStorage();

interface SentMail {
  to: string;
  subject: string;
  text: string;
  html: string;
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

function deps(overrides: { mails?: SentMail[]; sites?: SiteStorage } = {}) {
  const mails = overrides.mails ?? [];
  return {
    accounts: memoryAccounts(),
    sites: overrides.sites ?? memorySites(),
    now: () => 1_700_000_000_000,
    createSessionId: (() => {
      let counter = 0;
      return () => `sessie-${++counter}`;
    })(),
    sendMail: async (mail: SentMail) => {
      mails.push(mail);
      return 'sent';
    },
    siteUrl: 'https://klusbaas.test',
    mails,
  };
}

/** A customer with an account and a published site, plus his session cookie. */
async function customerWithSite(d: ReturnType<typeof deps>) {
  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const login = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';
  await handleAccount({ action: 'claim', slug: site.slug, token: site.token }, d, cookie);
  return cookie;
}

test('de klant vraagt de service aan; de aanvraag staat bij Klusbaas', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);

  const result = await handleAccount({ action: 'service-request' }, d, cookie);

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.service?.status, 'requested');
  assert.equal(result.body.service?.amountCents, SERVICE_AMOUNT_CENTS);
  assert.equal(result.body.service?.siteSlug, 'jansen-schilderwerken');
  assert.ok(result.body.service?.requestedAt);

  // Klusbaas moet het weten: de service loopt pas als hij hem aanzet.
  const teamMail = mails.find((mail) => mail.to !== 'jan@bedrijf.nl');
  assert.ok(teamMail, 'Klusbaas krijgt een mail over de aanvraag');
  assert.match(teamMail.subject, /service/i);
  assert.match(teamMail.text, /Jansen Schilderwerken/);
});

test('zonder site kan de klant geen service aanvragen', async () => {
  const d = deps();
  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const login = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';

  const result = await handleAccount({ action: 'service-request' }, d, cookie);
  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
});

test('twee keer aanvragen kan niet: de service staat er al', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const d = deps({ sites });
  const cookie = await customerWithSite(d);

  const first = await handleAccount({ action: 'service-request' }, d, cookie);
  assert.equal(first.status, 200);
  const second = await handleAccount({ action: 'service-request' }, d, cookie);
  assert.equal(second.status, 409);
});

test('de klant stopt de service; Klusbaas levert de site en de code terug', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);

  await handleAccount({ action: 'service-request' }, d, cookie);
  const result = await handleAccount({ action: 'service-cancel' }, d, cookie);

  assert.equal(result.status, 200);
  assert.equal(result.body.service?.status, 'stopped');
  assert.ok(result.body.service?.stoppedAt);
  assert.ok(
    mails.some((mail) => mail.subject.includes('stopt') && mail.to !== 'jan@bedrijf.nl'),
    'Klusbaas krijgt bericht dat de klant stopt'
  );
});

test('stoppen zonder service geeft een duidelijke melding', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const d = deps({ sites });
  const cookie = await customerWithSite(d);

  const result = await handleAccount({ action: 'service-cancel' }, d, cookie);
  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
});

test('Klusbaas zet de service aan; de klant krijgt het bedrag en de IBAN', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);
  await handleAccount({ action: 'service-request' }, d, cookie);

  const admin = await adminDeps(d, mails);
  const account = await d.accounts.getAccountByEmail('jan@bedrijf.nl');
  assert.ok(account);

  const result = await handleAdmin(
    { action: 'service-activate', id: account.id },
    admin,
    adminCookie
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  const stored = await d.accounts.getAccount(account.id);
  assert.equal(stored?.service?.status, 'active');
  assert.ok(stored?.service?.activeSince);

  const customerMail = mails.find((mail) => mail.to === 'jan@bedrijf.nl' && mail.subject.includes('service'));
  assert.ok(customerMail, 'de klant krijgt een mail over de service');
  assert.match(customerMail.text, /€ 25,00 per maand/);
  assert.match(customerMail.text, /NL91/);
  assert.match(customerMail.text, /SERVICE-jansen-schilderwerken/);
});

test('de maandfactuur noemt het bedrag inclusief btw', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);
  await handleAccount({ action: 'service-request' }, d, cookie);

  const admin = await adminDeps(d, mails);
  const account = await d.accounts.getAccountByEmail('jan@bedrijf.nl');
  assert.ok(account);
  await handleAdmin({ action: 'service-activate', id: account.id }, admin, adminCookie);

  const result = await handleAdmin(
    { action: 'service-invoice', id: account.id },
    admin,
    adminCookie
  );

  assert.equal(result.status, 200);
  const invoice = mails.find((mail) => mail.subject.includes('maandfactuur'));
  assert.ok(invoice, 'er gaat een maandfactuur naar de klant');
  assert.match(invoice.text, /€ 30,25/);
  assert.match(invoice.text, /SERVICE-jansen-schilderwerken/);
});

test('de maandfactuur gaat alleen naar een klant met een lopende service', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);
  await handleAccount({ action: 'service-request' }, d, cookie);

  const admin = await adminDeps(d, mails);
  const account = await d.accounts.getAccountByEmail('jan@bedrijf.nl');
  assert.ok(account);

  const result = await handleAdmin(
    { action: 'service-invoice', id: account.id },
    admin,
    adminCookie
  );
  assert.equal(result.status, 400);
  assert.equal(result.body.ok, false);
});

test('Klusbaas stopt de service; de klant krijgt bericht', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const mails: SentMail[] = [];
  const d = deps({ sites, mails });
  const cookie = await customerWithSite(d);
  await handleAccount({ action: 'service-request' }, d, cookie);

  const admin = await adminDeps(d, mails);
  const account = await d.accounts.getAccountByEmail('jan@bedrijf.nl');
  assert.ok(account);
  await handleAdmin({ action: 'service-activate', id: account.id }, admin, adminCookie);

  const result = await handleAdmin({ action: 'service-stop', id: account.id }, admin, adminCookie);
  assert.equal(result.status, 200);
  const stored = await d.accounts.getAccount(account.id);
  assert.equal(stored?.service?.status, 'stopped');
  assert.ok(
    mails.some((mail) => mail.to === 'jan@bedrijf.nl' && mail.subject.includes('gestopt')),
    'de klant krijgt bericht dat de service stopt'
  );
});

test('het overzicht van Klusbaas laat zien wie de service heeft', async () => {
  const sites = memorySites();
  await sites.saveSite(site);
  const d = deps({ sites });
  const cookie = await customerWithSite(d);
  await handleAccount({ action: 'service-request' }, d, cookie);

  const admin = await adminDeps(d, []);
  const result = await handleAdmin({ action: 'overview' }, admin, adminCookie);
  assert.equal(result.status, 200);
  const accounts = result.body.overview?.accounts ?? [];
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].service?.status, 'requested');
});

/** The admin session cookie, after a successful login. */
let adminCookie = '';

/** The deps of the admin handler, with a logged-in Klusbaas. */
async function adminDeps(d: ReturnType<typeof deps>, mails: SentMail[]) {
  const sessions = memoryAdminSessions();
  const admin = {
    env: { ADMIN_PASSWORD: 'geheim' },
    sessions,
    sites: d.sites,
    leads: {
      async nextQuoteSequence() {
        return 1;
      },
      async saveQuote() {
        return { json: 'memory', pdf: 'memory' };
      },
      async getQuote() {
        return null;
      },
      async getQuotePdf() {
        return null;
      },
      async saveLead() {
        return 'memory';
      },
      async listLeads() {
        return [];
      },
      async listQuotes() {
        return [];
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
    },
    accounts: d.accounts,
    sendMail: async (mail: SentMail) => {
      mails.push(mail);
      return 'sent';
    },
    payment: { iban: 'NL91 KLUSBAAS 0123 4567 89', name: 'Klusbaas', email: 'hallo@klusbaas.nl' },
    siteUrl: 'https://klusbaas.test',
    now: () => 1_700_000_000_000,
    createSessionId: () => 'admin-sessie',
  };
  const login = await handleAdmin({ action: 'login', password: 'geheim' }, admin, null);
  adminCookie = login.setCookie?.split(';')[0] ?? '';
  return admin;
}
