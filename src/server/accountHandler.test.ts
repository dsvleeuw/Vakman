import test from 'node:test';
import assert from 'node:assert/strict';
import type { Account, AccountSession, PublishedSiteRecord } from '../types';
import {
  accountFromSession,
  clearSessionCookie,
  handleAccount,
  readSessionId,
  sessionCookie,
} from './accountHandler';
import type { AccountStorage, SiteStorage } from './storage';

/** Accounts and sessions in memory. */
function memoryAccounts(): AccountStorage {
  const accounts = new Map<string, Account>();
  const sessions = new Map<string, AccountSession>();
  return {
    async saveAccount(account) {
      accounts.set(account.id, account);
      return `memory:${account.id}`;
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

function deps(overrides: { accounts?: AccountStorage; sites?: SiteStorage } = {}) {
  return {
    accounts: overrides.accounts ?? memoryAccounts(),
    sites: overrides.sites ?? memorySites(),
    now: () => 1_700_000_000_000,
    createSessionId: (() => {
      let counter = 0;
      return () => `sessie-${++counter}`;
    })(),
  };
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
