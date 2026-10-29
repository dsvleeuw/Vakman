import { randomBytes } from 'node:crypto';
import type { Account, AccountSession, PublicPublishedSite, StoredLead } from '../types';
import { isValidEmail } from '../utils/contact';
import { hashPassword, passwordProblem, verifyPassword } from '../utils/password';
import { accountId, type AccountStorage, type LeadStorage, type SiteStorage } from './storage';
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
  | 'claim';

export interface AccountRequestBody {
  action?: AccountAction;
  email?: string;
  password?: string;
}

export interface AccountResponseBody {
  ok: boolean;
  account?: { id: string; email: string };
  sites?: PublicPublishedSite[];
  /** The requests that came in through the sites of this customer. */
  leads?: StoredLead[];
  /** The site that was linked to the account. */
  site?: PublicPublishedSite;
  error?: string;
  field?: string;
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
  /** Where the requests are kept. Without it the customer sees no requests. */
  leads?: LeadStorage;
  now?: () => number;
  createSessionId?: () => string;
  /** Rate limiter: returns false when this key is over its limit. */
  allowRequest?: (key: string, now: number) => boolean;
  log?: (message: string) => void;
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
  return { id: account.id, email: account.email };
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

  return {
    status: 200,
    body: { ok: true, account: publicAccount(account) },
    setCookie: sessionCookie(session.id, secureCookie),
  };
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
