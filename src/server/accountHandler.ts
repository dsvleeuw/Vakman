import { randomBytes, timingSafeEqual } from 'node:crypto';
import { buildResetMail, buildVerifyMail } from '../utils/accountMail';
import type {
  Account,
  AccountSession,
  AccountQuote,
  PaymentDetails,
  PublicPublishedSite,
  ServiceState,
  StoredLead,
} from '../types';
import { isValidEmail } from '../utils/contact';
import { PLATFORM_CONTACT } from '../data/platform';
import { hashPassword, passwordProblem, verifyPassword } from '../utils/password';
import { accountId, type AccountStorage, type LeadStorage, type SiteStorage } from './storage';
import { buildQuotePath, isQuoteNumber, type QuoteRecord } from '../utils/quote';
import { SERVICE_AMOUNT_CENTS } from '../utils/service';
import {
  buildServiceCancelNoticeEmail,
  buildServiceRequestedEmail,
  type ServiceSubject,
} from '../utils/serviceMail';
import { isValidSlug, toPublicSite } from './siteHandler';
import { tokensMatch } from './tokens';

/**
 * Customer accounts: `POST /api/account`.
 *
 * A craftsman logs in once and then manages his own sites. The session lives
 * in an httpOnly cookie, so the browser never handles the session id in
 * JavaScript and a link in a chat log cannot log anyone in.
 */

export const SESSION_COOKIE = 'klusbaas_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type AccountAction =
  | 'register'
  | 'login'
  | 'logout'
  | 'me'
  | 'sites'
  | 'leads'
  | 'quotes'
  | 'claim'
  | 'claim-quote'
  | 'reset-request'
  | 'reset'
  | 'verify'
  | 'verify-request'
  | 'service-request'
  | 'service-cancel';

export interface AccountRequestBody {
  action?: AccountAction;
  email?: string;
  password?: string;
}

export interface AccountResponseBody {
  ok: boolean;
  account?: { id: string; email: string; verified: boolean };
  sites?: PublicPublishedSite[];
  /** The requests that came in through the sites of this customer. */
  leads?: StoredLead[];
  /** The offers this customer requested. */
  quotes?: AccountQuote[];
  /** The offer that was linked to the account. */
  quote?: AccountQuote;
  /** How to pay, when Klusbaas filled in the payment details. */
  payment?: PaymentDetails;
  /** The site that was linked to the account. */
  site?: PublicPublishedSite;
  /** The monthly service of this customer, when he asked for it. */
  service?: ServiceState;
  error?: string;
  field?: string;
  /** A message for the customer, e.g. after a reset request. */
  message?: string;
}

export interface AccountHandlerResult {
  status: number;
  body: AccountResponseBody;
  /** Set-Cookie value when a session was created. */
  setCookie?: string;
  /** Set-Cookie value that clears the session. */
  clearCookie?: string;
}

export interface AccountDeps {
  accounts: AccountStorage;
  sites: SiteStorage;
  /**
   * Sends a mail to the customer. Without it no mail is sent and the reset
   * and the verification still work for a customer who has the link.
   */
  sendMail?: (mail: { to: string; subject: string; text: string; html: string }) => Promise<string>;
  /** The origin for the links in the mails, e.g. https://klusbaas.nl */
  siteUrl?: string;
  /**
   * Where the mails about the service go: the inbox of Klusbaas himself
   * (`QUOTE_NOTIFY_EMAIL`). Without it the public contact address is used.
   */
  notifyEmail?: string;
  /** Where the requests are kept. Without it the customer sees no requests. */
  leads?: LeadStorage;
  /** Where the offers are kept. Without it the customer sees no offers. */
  quotes?: LeadStorage;
  /** How the customer can pay. Without it no payment details are shown. */
  payment?: PaymentDetails;
  now?: () => number;
  createSessionId?: () => string;
  /** Rate limiter: returns false when this key is over its limit. */
  allowRequest?: (key: string, now: number) => boolean;
  log?: (message: string) => void;
}

/**
 * The offer as the customer sees it: without the token, but with the link
 * that opens the offer.
 */
function toAccountQuote(quote: QuoteRecord): AccountQuote {
  return {
    id: quote.id,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    status: quote.status,
    ...(quote.paidAt ? { paidAt: quote.paidAt } : {}),
    ...(quote.acceptedAt ? { acceptedAt: quote.acceptedAt } : {}),
    ...(quote.paymentReportedAt ? { paymentReportedAt: quote.paymentReportedAt } : {}),
    planId: quote.planId,
    planName: quote.planName,
    sectorName: quote.sectorName,
    styleName: quote.styleName,
    services: quote.services,
    subtotalCents: quote.subtotalCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    url: buildQuotePath(quote.id, quote.token),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read the session id from the cookie header of the request. */
export function readSessionId(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** The cookie that carries the session id. */
export function sessionCookie(id: string, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ]
    .filter(Boolean)
    .join('; ');
}

/** The cookie that ends the session. */
export function clearSessionCookie(secure: boolean): string {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');
}

function publicAccount(account: Account) {
  return {
    id: account.id,
    email: account.email,
    verified: Boolean(account.verifiedAt),
    ...(account.service ? { service: account.service } : {}),
  };
}

/**
 * Where the mails about the service go: the inbox of Klusbaas, or the
 * public contact address when no inbox is configured.
 */
function notifyAddress(deps: AccountDeps): string {
  return deps.notifyEmail?.trim() || PLATFORM_CONTACT.email;
}

/**
 * Who the service is about: the customer and his site.
 *
 * The name of the business comes from the site, because that is what the
 * customer wrote there; the account address is the fallback.
 */
function serviceSubject(
  account: Account,
  site: { slug: string; form: { biz: string; owner: string; city: string } } | undefined
): ServiceSubject {
  const owner = site?.form.owner?.trim() ?? '';
  const biz = site?.form.biz?.trim() ?? '';
  return {
    name: owner || account.email,
    biz: biz || owner || account.email,
    city: site?.form.city ?? '',
    siteSlug: site?.slug ?? '',
  };
}

/** How long a reset link works: one hour. */
const RESET_TOKEN_MS = 60 * 60 * 1000;
/** How long a verification link works: one day. */
const VERIFY_TOKEN_MS = 24 * 60 * 60 * 1000;

/** The absolute link the customer clicks in the mail. */
function accountLink(deps: AccountDeps, path: string): string {
  const origin = (deps.siteUrl ?? '').replace(/\/$/, '');
  return `${origin}${path}`;
}

/**
 * A token that carries the id of the account, so the server can find the
 * account without scanning the whole table. The random part makes it
 * impossible to guess.
 */
function accountToken(account: Account): string {
  return `${account.id}.${randomBytes(16).toString('base64url')}`;
}

/**
 * The account a token belongs to. The token is compared with the stored one
 * in constant time, and only the account it was made for is accepted.
 */
async function findAccountByToken(
  deps: AccountDeps,
  token: string,
  kind: 'reset' | 'verify'
): Promise<Account | null> {
  const id = token.split('.')[0];
  if (!id) return null;
  const account = await deps.accounts.getAccount(id);
  if (!account) return null;
  const stored = kind === 'reset' ? account.resetToken : account.verifyToken;
  if (!stored) return null;
  const a = Buffer.from(stored);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return account;
}

async function findAccountByResetToken(deps: AccountDeps, token: string): Promise<Account | null> {
  return findAccountByToken(deps, token, 'reset');
}

async function findAccountByVerifyToken(deps: AccountDeps, token: string): Promise<Account | null> {
  return findAccountByToken(deps, token, 'verify');
}

/** Send a mail to the customer, if there is a mailer. */
async function sendAccountMail(
  deps: AccountDeps,
  to: string,
  mail: { subject: string; text: string; html: string }
): Promise<string> {
  if (!deps.sendMail) return 'geen mailer';
  try {
    return await deps.sendMail({ to, ...mail });
  } catch (error) {
    deps.log?.(`[account] mail mislukt: ${error instanceof Error ? error.message : String(error)}`);
    return 'mislukt';
  }
}

/** An e-mail address in the log: enough to recognise, not enough to spam. */
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return 'onbekend';
  const head = name.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function createSession(
  account: Account,
  deps: AccountDeps
): Promise<AccountSession> {
  const now = deps.now ? deps.now() : Date.now();
  const makeId = deps.createSessionId ?? (() => randomBytes(24).toString('base64url'));
  const session: AccountSession = {
    id: makeId(),
    accountId: account.id,
    createdAt: now,
    expiresAt: now + SESSION_MAX_AGE_SECONDS * 1000,
  };
  await deps.accounts.saveSession(session);
  return session;
}

/** The account behind the session cookie, or null when there is none. */
export async function accountFromSession(
  cookieHeader: string | null | undefined,
  deps: Pick<AccountDeps, 'accounts' | 'now'>
): Promise<Account | null> {
  const sessionId = readSessionId(cookieHeader);
  if (!sessionId) return null;
  const session = await deps.accounts.getSession(sessionId);
  if (!session) return null;
  const now = deps.now ? deps.now() : Date.now();
  if (session.expiresAt <= now) {
    await deps.accounts.deleteSession(sessionId);
    return null;
  }
  return deps.accounts.getAccount(session.accountId);
}

async function handleRegister(
  email: string,
  password: string,
  deps: AccountDeps,
  secureCookie: boolean
): Promise<AccountHandlerResult> {
  const existing = await deps.accounts.getAccountByEmail(email);
  if (existing) {
    return {
      status: 409,
      body: {
        ok: false,
        error: 'Met dit e-mailadres bestaat al een account. Log in met je wachtwoord.',
        field: 'email',
      },
    };
  }

  const now = deps.now ? deps.now() : Date.now();
  const account: Account = {
    id: accountId(email),
    email,
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };
  await deps.accounts.saveAccount(account);
  const session = await createSession(account, deps);

  // Het e-mailadres moet bevestigd worden. De klant kan inloggen en zijn
  // site beheren, maar publiceren kan pas na de bevestiging.
  const withToken = await issueVerifyToken(account, deps, now);
  const mail = buildVerifyMail({
    url: accountLink(deps, `/mijn-account?verifieer=${encodeURIComponent(withToken.verifyToken ?? '')}`),
  });
  const status = await sendAccountMail(deps, account.email, mail);
  deps.log?.(`[account] account aangemaakt voor ${maskEmail(account.email)}: ${status}`);

  return {
    status: 200,
    body: { ok: true, account: publicAccount(withToken) },
    setCookie: sessionCookie(session.id, secureCookie),
  };
}

/** Give the account a fresh verification token and store it. */
async function issueVerifyToken(
  account: Account,
  deps: AccountDeps,
  now: number
): Promise<Account> {
  const token = accountToken(account);
  const updated: Account = {
    ...account,
    verifyToken: token,
    verifyExpiresAt: now + VERIFY_TOKEN_MS,
    updatedAt: now,
  };
  await deps.accounts.saveAccount(updated);
  return updated;
}

async function handleLogin(
  email: string,
  password: string,
  deps: AccountDeps,
  secureCookie: boolean
): Promise<AccountHandlerResult> {
  const account = await deps.accounts.getAccountByEmail(email);
  // The same message for an unknown address and a wrong password: the page
  // must not tell who has an account.
  const invalid: AccountHandlerResult = {
    status: 401,
    body: { ok: false, error: 'E-mailadres of wachtwoord klopt niet.' },
  };
  if (!account) return invalid;
  if (!(await verifyPassword(password, account.passwordHash))) return invalid;

  const session = await createSession(account, deps);
  return {
    status: 200,
    body: { ok: true, account: publicAccount(account) },
    setCookie: sessionCookie(session.id, secureCookie),
  };
}

/**
 * `POST /api/account` with an action: register, login, logout, me or sites.
 */
export async function handleAccount(
  body: unknown,
  deps: AccountDeps,
  cookieHeader?: string | null,
  secureCookie = true
): Promise<AccountHandlerResult> {
  if (!isRecord(body)) {
    return { status: 400, body: { ok: false, error: 'Ongeldige aanvraag.' } };
  }
  const action = body.action as AccountAction | undefined;

  if (action === 'register' || action === 'login') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!isValidEmail(email)) {
      return {
        status: 400,
        body: { ok: false, error: 'Vul een geldig e-mailadres in.', field: 'email' },
      };
    }
    const problem = passwordProblem(password);
    if (problem) {
      return { status: 400, body: { ok: false, error: problem, field: 'password' } };
    }

    if (deps.allowRequest && !deps.allowRequest(`account-${action}-${email}`, Date.now())) {
      return {
        status: 429,
        body: {
          ok: false,
          error:
            action === 'login'
              ? 'Te veel pogingen. Wacht een paar minuten en probeer het opnieuw.'
              : 'Te veel aanvragen. Wacht een paar minuten en probeer het opnieuw.',
        },
      };
    }

    return action === 'register'
      ? handleRegister(email, password, deps, secureCookie)
      : handleLogin(email, password, deps, secureCookie);
  }

  if (action === 'reset-request') {
    // "Wachtwoord vergeten". Het antwoord is altijd hetzelfde, ook als er
    // geen account is met dat adres: anders kan iemand uitzoeken wie er een
    // account heeft.
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const same = {
      status: 200,
      body: {
        ok: true,
        error: undefined,
        message:
          'Als er een account is met dit e-mailadres, dan stuur ik je een link om een nieuw wachtwoord te kiezen.',
      },
    };
    if (!isValidEmail(email)) return same;
    if (deps.allowRequest && !deps.allowRequest(`account-reset-${email}`, Date.now())) {
      return {
        status: 429,
        body: { ok: false, error: 'Te veel aanvragen. Wacht een paar minuten en probeer het opnieuw.' },
      };
    }
    const account = await deps.accounts.getAccountByEmail(email);
    if (!account) return same;

    const now = deps.now ? deps.now() : Date.now();
    const token = accountToken(account);
    await deps.accounts.saveAccount({
      ...account,
      resetToken: token,
      resetExpiresAt: now + RESET_TOKEN_MS,
      updatedAt: now,
    });
    const mail = buildResetMail({
      url: accountLink(deps, `/mijn-account?reset=${encodeURIComponent(token)}`),
    });
    const status = await sendAccountMail(deps, account.email, mail);
    deps.log?.(`[account] resetlink voor ${maskEmail(account.email)}: ${status}`);
    return same;
  }

  if (action === 'reset') {
    // Een nieuw wachtwoord kiezen met de link uit de mail.
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const problem = passwordProblem(password);
    if (problem) {
      return { status: 400, body: { ok: false, error: problem, field: 'password' } };
    }
    if (!token) {
      return { status: 400, body: { ok: false, error: 'Deze link klopt niet meer.', field: 'token' } };
    }
    const account = await findAccountByResetToken(deps, token);
    const now = deps.now ? deps.now() : Date.now();
    if (!account || !account.resetExpiresAt || account.resetExpiresAt <= now) {
      return {
        status: 400,
        body: { ok: false, error: 'Deze link is verlopen of klopt niet. Vraag een nieuwe aan.', field: 'token' },
      };
    }
    const updated: Account = {
      ...account,
      passwordHash: await hashPassword(password),
      resetToken: undefined,
      resetExpiresAt: undefined,
      updatedAt: now,
    };
    await deps.accounts.saveAccount(updated);
    const session = await createSession(updated, deps);
    deps.log?.(`[account] nieuw wachtwoord voor ${maskEmail(updated.email)}`);
    return {
      status: 200,
      body: { ok: true, account: publicAccount(updated) },
      setCookie: sessionCookie(session.id, secureCookie),
    };
  }

  if (action === 'verify') {
    // Het e-mailadres bevestigen met de link uit de mail.
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) {
      return { status: 400, body: { ok: false, error: 'Deze link klopt niet.', field: 'token' } };
    }
    const account = await findAccountByVerifyToken(deps, token);
    const now = deps.now ? deps.now() : Date.now();
    if (!account || !account.verifyExpiresAt || account.verifyExpiresAt <= now) {
      return {
        status: 400,
        body: { ok: false, error: 'Deze link is verlopen of klopt niet. Vraag een nieuwe aan.', field: 'token' },
      };
    }
    const updated: Account = {
      ...account,
      verifiedAt: now,
      verifyToken: undefined,
      verifyExpiresAt: undefined,
      updatedAt: now,
    };
    await deps.accounts.saveAccount(updated);
    deps.log?.(`[account] e-mailadres bevestigd voor ${maskEmail(updated.email)}`);
    return { status: 200, body: { ok: true, account: publicAccount(updated) } };
  }

  if (action === 'verify-request') {
    // Nog een bevestigingsmail sturen. Alleen voor een account dat nog niet
    // bevestigd is.
    const account = await accountFromSession(cookieHeader, deps);
    if (!account) {
      return { status: 401, body: { ok: false, error: 'Niet ingelogd.' } };
    }
    if (account.verifiedAt) {
      return { status: 200, body: { ok: true, account: publicAccount(account) } };
    }
    const now = deps.now ? deps.now() : Date.now();
    if (deps.allowRequest && !deps.allowRequest(`account-verify-${account.id}`, now)) {
      return {
        status: 429,
        body: { ok: false, error: 'Te veel aanvragen. Wacht een paar minuten en probeer het opnieuw.' },
      };
    }
    const withToken = await issueVerifyToken(account, deps, now);
    const mail = buildVerifyMail({
      url: accountLink(deps, `/mijn-account?verifieer=${encodeURIComponent(withToken.verifyToken ?? '')}`),
    });
    const status = await sendAccountMail(deps, account.email, mail);
    deps.log?.(`[account] nieuwe bevestigingsmail voor ${maskEmail(account.email)}: ${status}`);
    return { status: 200, body: { ok: true, account: publicAccount(withToken) } };
  }

  if (action === 'logout') {
    const sessionId = readSessionId(cookieHeader);
    if (sessionId) await deps.accounts.deleteSession(sessionId);
    return {
      status: 200,
      body: { ok: true },
      clearCookie: clearSessionCookie(secureCookie),
    };
  }

  const account = await accountFromSession(cookieHeader, deps);
  if (!account) {
    return { status: 401, body: { ok: false, error: 'Niet ingelogd.' } };
  }

  if (action === 'sites') {
    const owned = (await deps.sites.listSites()).filter((site) => site.ownerId === account.id);
    return {
      status: 200,
      body: { ok: true, account: publicAccount(account), sites: owned.map(toPublicSite) },
    };
  }

  if (action === 'leads') {
    // De aanvragen van de sites van deze klant. Klusbaas bewaart ze in zijn
    // naam, zodat de vakman ze ook kan terugzien als de mail niet aankwam.
    const owned = (await deps.sites.listSites()).filter((site) => site.ownerId === account.id);
    const slugs = new Set(owned.map((site) => site.slug));
    const all = deps.leads ? await deps.leads.listLeads() : [];
    const leads = all
      .filter((lead) => lead.site?.slug && slugs.has(lead.site.slug))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return {
      status: 200,
      body: { ok: true, account: publicAccount(account), leads },
    };
  }

  if (action === 'quotes') {
    // De offertes van deze klant: alleen de offertes die hij zelf heeft
    // aangevraagd terwijl hij ingelogd was.
    const all = deps.quotes ? await deps.quotes.listQuotes() : [];
    const quotes = all
      .filter((quote) => quote.accountId === account.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((quote) => toAccountQuote(quote));
    return {
      status: 200,
      body: { ok: true, account: publicAccount(account), quotes, ...(deps.payment ? { payment: deps.payment } : {}) },
    };
  }

  if (action === 'service-request') {
    // De klant vraagt de maandelijkse service aan. De service draait om
    // zijn eigen site: zonder site is er niets om te hosten.
    const owned = (await deps.sites.listSites()).filter((site) => site.ownerId === account.id);
    if (owned.length === 0) {
      return {
        status: 400,
        body: {
          ok: false,
          error:
            'De service draait om je eigen site. Publiceer eerst je site in de editor, dan komt de service hier.',
        },
      };
    }
    if (account.service && account.service.status !== 'stopped') {
      return {
        status: 409,
        body: { ok: false, error: 'Je service staat al aan.' },
      };
    }
    const now = deps.now ? deps.now() : Date.now();
    const service: ServiceState = {
      status: 'requested',
      requestedAt: new Date(now).toISOString(),
      amountCents: SERVICE_AMOUNT_CENTS,
      siteSlug: owned[0].slug,
    };
    const updated: Account = { ...account, service, updatedAt: now };
    await deps.accounts.saveAccount(updated);
    // Klusbaas moet het weten: de service loopt pas als hij hem aanzet.
    const mail = buildServiceRequestedEmail(serviceSubject(updated, owned[0]));
    const mailStatus = await sendAccountMail(deps, notifyAddress(deps), mail);
    deps.log?.(
      `[account] service aangevraagd door ${maskEmail(account.email)}: ${mailStatus}`
    );
    return {
      status: 200,
      body: { ok: true, account: publicAccount(updated), service },
    };
  }

  if (action === 'service-cancel') {
    // De klant stopt de service. De site blijft online; Klusbaas levert de
    // site en de code aan hem terug.
    const service = account.service;
    if (!service || service.status === 'stopped') {
      return {
        status: 400,
        body: { ok: false, error: 'Je hebt geen lopende service.' },
      };
    }
    const now = deps.now ? deps.now() : Date.now();
    const stopped: ServiceState = {
      ...service,
      status: 'stopped',
      stoppedAt: new Date(now).toISOString(),
    };
    const updated: Account = { ...account, service: stopped, updatedAt: now };
    await deps.accounts.saveAccount(updated);
    const site = (await deps.sites.listSites()).find((record) => record.slug === service.siteSlug);
    const mail = buildServiceCancelNoticeEmail(serviceSubject(updated, site));
    const mailStatus = await sendAccountMail(deps, notifyAddress(deps), mail);
    deps.log?.(`[account] service gestopt door ${maskEmail(account.email)}: ${mailStatus}`);
    return {
      status: 200,
      body: { ok: true, account: publicAccount(updated), service: stopped },
    };
  }

  if (action === 'claim-quote') {
    // Een offerte die de klant per mail kreeg koppelen aan zijn account. De
    // link bewijst dat de offerte van hem is.
    const id = typeof body.id === 'string' ? body.id : '';
    const token = typeof body.token === 'string' ? body.token : '';
    if (!isQuoteNumber(id)) {
      return { status: 400, body: { ok: false, error: 'Ongeldige offertenummer.', field: 'id' } };
    }
    const quote = deps.quotes ? await deps.quotes.getQuote(id) : null;
    if (!quote) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    if (!tokensMatch(quote.token, token)) {
      return { status: 403, body: { ok: false, error: 'Deze offertelink klopt niet.' } };
    }
    const linked = (await deps.quotes?.linkQuoteToAccount(quote.id, account.id)) ?? {
      ...quote,
      accountId: account.id,
    };
    return {
      status: 200,
      body: { ok: true, account: publicAccount(account), quote: toAccountQuote(linked) },
    };
  }

  if (action === 'claim') {
    // A site that was published with a management link can be linked to the
    // account: the customer proves ownership with the link, and from then on
    // the account is enough.
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const token = typeof body.token === 'string' ? body.token : '';
    if (!isValidSlug(slug)) {
      return { status: 400, body: { ok: false, error: 'Ongeldige adressering.', field: 'slug' } };
    }
    const record = await deps.sites.getSite(slug);
    if (!record) {
      return { status: 404, body: { ok: false, error: 'Deze site bestaat niet (meer).' } };
    }
    if (!tokensMatch(record.token, token)) {
      return { status: 403, body: { ok: false, error: 'Deze beheerlink klopt niet.' } };
    }
    await deps.sites.saveSite({ ...record, ownerId: account.id });
    return {
      status: 200,
      body: { ok: true, account: publicAccount(account), site: toPublicSite(record) },
    };
  }

  return { status: 200, body: { ok: true, account: publicAccount(account) } };
}
