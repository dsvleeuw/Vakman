import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord, StoredLead } from '../types';
import {
  accountFromSession,
  clearSessionCookie,
  handleAccount,
  readSessionId,
  sessionCookie,
} from './accountHandler';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import type { QuoteRecord } from '../utils/quote';

/** Accounts and sessions in memory. */
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
      const found = [...accounts.values()].find((account) => account.email === email);
      return found ?? null;
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

function memoryLeads(leads: StoredLead[] = []): LeadStorage {
  const map = new Map(leads.map((lead) => [lead.reference, lead]));
  return {
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
    async saveLead(reference, lead) {
      map.set(reference, lead as StoredLead);
      return `memory:${reference}`;
    },
    async listLeads() {
      return [...map.values()];
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
  };
}

/** Offers in memory, so a customer can see his own. */
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
    async saveLead() {
      return 'memory';
    },
    async listLeads() {
      return [];
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
    headline: 'De muur die je blijft bewonderen',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Bekijk mijn werk',
    cta2: 'Vraag een offerte',
  },
  timestamp: 1,
  updatedAt: 1,
};

interface SentMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

function deps(overrides: {
  accounts?: AccountStorage;
  sites?: SiteStorage;
  mails?: SentMail[];
  now?: () => number;
} = {}) {
  const mails = overrides.mails ?? [];
  return {
    accounts: overrides.accounts ?? memoryAccounts(),
    sites: overrides.sites ?? memorySites(),
    now: overrides.now ?? (() => 1_700_000_000_000),
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

/** The token out of the link in a mail. */
function tokenFromMail(mail: SentMail): string {
  const match = mail.text.match(/[?&](?:reset|verifieer)=([A-Za-z0-9._-]+)/);
  return match?.[1] ?? '';
}

test('registreren maakt een account en een sessie', async () => {
  const d = deps();
  const result = await handleAccount(
    { action: 'register', email: 'Jan@Bedrijf.nl', password: 'moeilijk-wachtwoord' },
    d
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.account?.email, 'jan@bedrijf.nl');
  assert.ok(result.setCookie);
  assert.match(result.setCookie, /HttpOnly/);
  assert.match(result.setCookie, /SameSite=Lax/);
  assert.match(result.setCookie, /Path=\//);

  // The password itself is never stored, only the hash.
  const stored = await d.accounts.getAccountByEmail('jan@bedrijf.nl');
  assert.ok(stored);
  assert.notEqual(stored.passwordHash, 'moeilijk-wachtwoord');
});

test('inloggen werkt met het juiste wachtwoord', async () => {
  const d = deps();
  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const result = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
});

test('inloggen met een verkeerd wachtwoord of onbekend adres geeft dezelfde melding', async () => {
  const d = deps();
  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);

  const wrongPassword = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'fout-wachtwoord' },
    d
  );
  const unknownEmail = await handleAccount(
    { action: 'login', email: 'iemand@anders.nl', password: 'moeilijk' },
    d
  );

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.equal(wrongPassword.body.error, unknownEmail.body.error);
});

test('een te kort wachtwoord of ongeldig e-mailadres wordt geweigerd', async () => {
  const d = deps();
  const short = await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'abc' }, d);
  assert.equal(short.status, 400);
  assert.equal(short.body.field, 'password');

  const badMail = await handleAccount({ action: 'register', email: 'geen-adres', password: 'lang genoeg' }, d);
  assert.equal(badMail.status, 400);
  assert.equal(badMail.body.field, 'email');
});

test('een tweede account met hetzelfde adres wordt geweigerd', async () => {
  const d = deps();
  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const again = await handleAccount(
    { action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  assert.equal(again.status, 409);
});

test('de cookie draagt de sessie mee en uitloggen wist hem', async () => {
  const d = deps();
  const login = await handleAccount(
    { action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';
  const sessionId = readSessionId(cookie);
  assert.ok(sessionId);

  const account = await accountFromSession(cookie, d);
  assert.equal(account?.email, 'jan@bedrijf.nl');

  const logout = await handleAccount({ action: 'logout' }, d, cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.clearCookie ?? '', /Max-Age=0/);
  assert.equal(await accountFromSession(cookie, d), null);
});

test('zonder cookie is er niemand ingelogd', async () => {
  const d = deps();
  const me = await handleAccount({ action: 'me' }, d);
  assert.equal(me.status, 401);
  assert.equal(me.body.ok, false);
});

test('een verlopen sessie telt niet mee', async () => {
  const d = deps();
  const login = await handleAccount(
    { action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';
  const session = await d.accounts.getSession(readSessionId(cookie) ?? '');
  assert.ok(session);
  session.expiresAt = 1;
  await d.accounts.saveSession(session);
  assert.equal(await accountFromSession(cookie, d), null);
});

test('een site koppelen aan het account kan alleen met de juiste beheerlink', async () => {
  const sites = memorySites();
  await sites.saveSite(publishedSite);
  const d = deps({ sites });

  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const login = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';

  const wrong = await handleAccount(
    { action: 'claim', slug: 'jansen-schilderwerken', token: 'fout' },
    d,
    cookie
  );
  assert.equal(wrong.status, 403);

  const claim = await handleAccount(
    { action: 'claim', slug: 'jansen-schilderwerken', token: 'tokentokentoken' },
    d,
    cookie
  );
  assert.equal(claim.status, 200);

  const record = await sites.getSite('jansen-schilderwerken');
  assert.equal(record?.ownerId, (await d.accounts.getAccountByEmail('jan@bedrijf.nl'))?.id);
});

test('de site-lijst toont alleen de eigen sites', async () => {
  const sites = memorySites();
  await sites.saveSite(publishedSite);
  const d = deps({ sites });

  await handleAccount({ action: 'register', email: 'jan@bedrijf.nl', password: 'moeilijk' }, d);
  const login = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    d
  );
  const cookie = login.setCookie?.split(';')[0] ?? '';
  await handleAccount({ action: 'claim', slug: 'jansen-schilderwerken', token: 'tokentokentoken' }, d, cookie);

  const list = await handleAccount({ action: 'sites' }, d, cookie);
  assert.equal(list.status, 200);
  assert.equal(list.body.sites?.length, 1);
  assert.equal(list.body.sites?.[0]?.slug, 'jansen-schilderwerken');
  // The token never leaves the server.
  assert.equal((list.body.sites?.[0] as { token?: string } | undefined)?.token, undefined);
});

test('te veel inlogpogingen worden geweigerd', async () => {
  const d = deps();
  let allowed = true;
  const limited = { ...d, allowRequest: () => allowed };
  allowed = false;
  const result = await handleAccount(
    { action: 'login', email: 'jan@bedrijf.nl', password: 'moeilijk' },
    limited
  );
  assert.equal(result.status, 429);
});

test('de sessioncookie bevat geen spaties en de lege cookie wist de sessie', () => {
  const cookie = sessionCookie('sessie-1', false);
  assert.equal(readSessionId(cookie), 'sessie-1');
  assert.ok(!cookie.includes('Secure'));
  assert.match(clearSessionCookie(true), /Secure/);
});

test('de klant ziet de aanvragen van zijn eigen sites', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites();
  const leads = memoryLeads([
    {
      reference: 'L-AAAA01',
      createdAt: '2026-10-29T10:00:00.000Z',
      type: 'contact',
      site: { biz: 'Jansen Schilderwerken', sector: 'schilder', slug: 'jansen-schilderwerken' },
      fields: { name: 'Sanne', phone: '0612345678', message: 'Ik wil drie kozijnen schilderen.' },
    },
    {
      reference: 'L-AAAA02',
      createdAt: '2026-10-30T10:00:00.000Z',
      type: 'contact',
      site: { biz: 'Andere Site', sector: 'schilder', slug: 'andere-site' },
      fields: { name: 'Piet', phone: '0698765432', message: 'Dit is voor iemand anders.' },
    },
  ]);

  await sites.saveSite(publishedSite);
  const registered = await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts, sites, leads }
  );
  assert.equal(registered.status, 200);
  const cookie = registered.setCookie;

  const mine = await handleAccount(
    { action: 'claim', slug: 'jansen-schilderwerken', token: publishedSite.token },
    { accounts, sites, leads },
    cookie
  );
  assert.equal(mine.status, 200);

  const result = await handleAccount({ action: 'leads' }, { accounts, sites, leads }, cookie);
  assert.equal(result.status, 200);
  assert.equal(result.body.leads?.length, 1);
  assert.equal(result.body.leads?.[0].reference, 'L-AAAA01');
  assert.equal(result.body.leads?.[0].fields.name, 'Sanne');
});

test('zonder aanvragen in de opslag ziet de klant geen aanvragen', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites();
  const registered = await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts, sites }
  );
  const result = await handleAccount(
    { action: 'leads' },
    { accounts, sites },
    registered.setCookie
  );
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.leads, []);
});

const quoteOf = (overrides: Partial<QuoteRecord> = {}): QuoteRecord => ({
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
  ...overrides,
});

test('de klant ziet zijn eigen offerte met de status en de betaalgegevens', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites();
  const quotes = memoryQuotes();
  const registered = await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts, sites, quotes }
  );
  const cookie = registered.setCookie;
  const accountId = registered.body.account?.id ?? '';

  await quotes.saveQuote(quoteOf({ accountId }), new Uint8Array());
  await quotes.saveQuote(
    quoteOf({ id: 'KB-2026-0002', accountId: 'iemand-anders', createdAt: '2026-10-31T10:00:00.000Z' }),
    new Uint8Array()
  );

  const result = await handleAccount(
    { action: 'quotes' },
    {
      accounts,
      sites,
      quotes,
      payment: { iban: 'NL12 KLUS 0000 0000 00', name: 'Klusbaas', email: 'info@klusbaas.nl' },
    },
    cookie
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.quotes?.length, 1);
  assert.equal(result.body.quotes?.[0].id, 'KB-2026-0001');
  assert.equal(result.body.quotes?.[0].status, 'open');
  assert.equal(result.body.quotes?.[0].totalCents, 120395);
  assert.match(result.body.quotes?.[0].url ?? '', /^\/offerte\/KB-2026-0001\?token=/);
  assert.equal(result.body.payment?.iban, 'NL12 KLUS 0000 0000 00');
});

test('zonder offertes in de opslag ziet de klant geen offertes', async () => {
  const accounts = memoryAccounts();
  const sites = memorySites();
  const registered = await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts, sites }
  );
  const result = await handleAccount({ action: 'quotes' }, { accounts, sites }, registered.setCookie);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.quotes, []);
  assert.equal(result.body.payment, undefined);
});

test('een wachtwoordreset stuurt een mail en het nieuwe wachtwoord werkt', async () => {
  const d = deps();
  await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  const requested = await handleAccount(
    { action: 'reset-request', email: 'jan@example.nl' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  assert.equal(requested.status, 200);
  const mail = d.mails.find((m) => m.subject.includes('wachtwoord'));
  assert.ok(mail, 'er is een resetmail verstuurd');
  assert.equal(mail?.to, 'jan@example.nl');

  const token = tokenFromMail(mail!);
  assert.ok(token, 'de mail bevat een link met een token');

  const reset = await handleAccount(
    { action: 'reset', token, password: 'nieuwewachtwoord' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  assert.equal(reset.status, 200);

  const withOld = await handleAccount(
    { action: 'login', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts: d.accounts, sites: d.sites }
  );
  assert.equal(withOld.status, 401);

  const withNew = await handleAccount(
    { action: 'login', email: 'jan@example.nl', password: 'nieuwewachtwoord' },
    { accounts: d.accounts, sites: d.sites }
  );
  assert.equal(withNew.status, 200);
});

test('een resetlink werkt maar een keer', async () => {
  const d = deps();
  await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  await handleAccount(
    { action: 'reset-request', email: 'jan@example.nl' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  const mail = d.mails.find((m) => m.subject.includes('wachtwoord'))!;
  const token = tokenFromMail(mail);
  const first = await handleAccount(
    { action: 'reset', token, password: 'nieuwewachtwoord' },
    { accounts: d.accounts, sites: d.sites }
  );
  assert.equal(first.status, 200);
  const second = await handleAccount(
    { action: 'reset', token, password: 'nogmaalsnieuw' },
    { accounts: d.accounts, sites: d.sites }
  );
  assert.equal(second.status, 400);
});

test('een resetverzoek voor een onbekend adres geeft hetzelfde antwoord', async () => {
  const d = deps();
  const result = await handleAccount(
    { action: 'reset-request', email: 'niemand@example.nl' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  assert.equal(result.status, 200);
  assert.ok(result.body.message);
  assert.equal(d.mails.length, 0);
});

test('het e-mailadres kan bevestigd worden', async () => {
  const d = deps();
  const registered = await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  assert.equal(registered.body.account?.verified, false);

  const mail = d.mails.find((m) => m.subject.includes('Bevestig'));
  assert.ok(mail, 'er is een bevestigingsmail verstuurd');
  const token = tokenFromMail(mail!);

  const verified = await handleAccount(
    { action: 'verify', token },
    { accounts: d.accounts, sites: d.sites }
  );
  assert.equal(verified.status, 200);
  assert.equal(verified.body.account?.verified, true);

  const again = await handleAccount({ action: 'verify', token }, { accounts: d.accounts, sites: d.sites });
  assert.equal(again.status, 400);
});

test('een verlopen resetlink wordt geweigerd', async () => {
  const accounts = memoryAccounts();
  let clock = 1_700_000_000_000;
  const d = deps({ accounts, now: () => clock });
  await handleAccount(
    { action: 'register', email: 'jan@example.nl', password: 'achtienletters' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl }
  );
  await handleAccount(
    { action: 'reset-request', email: 'jan@example.nl' },
    { accounts: d.accounts, sites: d.sites, sendMail: d.sendMail, siteUrl: d.siteUrl, now: () => clock }
  );
  const mail = d.mails.find((m) => m.subject.includes('wachtwoord'))!;
  const token = tokenFromMail(mail);
  clock += 2 * 60 * 60 * 1000;
  const result = await handleAccount(
    { action: 'reset', token, password: 'nieuwewachtwoord' },
    { accounts: d.accounts, sites: d.sites, now: () => clock }
  );
  assert.equal(result.status, 400);
});
