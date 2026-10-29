import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AdminAccount, AdminOverview, AdminQuote } from '../types';
import type { QuoteRecord, QuoteStatus } from '../utils/quote';
import { buildQuotePath } from '../utils/quote';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import { adminSession, type AdminStorage } from './adminStorage';

/**
 * The Klusbaas overview: what Klusbaas needs to see to sell and to serve.
 *
 * It is behind a password from the environment (`ADMIN_PASSWORD`). Without
 * that variable the overview is closed: there is no default password and no
 * way around it.
 */

export const ADMIN_COOKIE = 'klusbaas_admin';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type AdminAction =
  | 'login'
  | 'logout'
  | 'overview'
  | 'quote-status'
  | 'verify-account';

export interface AdminRequestBody {
  action?: AdminAction;
  password?: string;
  id?: string;
  status?: QuoteStatus;
}

export interface AdminResponseBody {
  ok: boolean;
  overview?: AdminOverview;
  error?: string;
}

export interface AdminHandlerResult {
  status: number;
  body: AdminResponseBody;
  setCookie?: string;
  clearCookie?: string;
}

export interface AdminDeps {
  /** The environment. `ADMIN_PASSWORD` opens the overview. */
  env: { ADMIN_PASSWORD?: string };
  sessions: AdminStorage;
  sites: SiteStorage;
  /** Where the requests and the offers live. */
  leads: LeadStorage;
  /** The customer accounts. Without them the overview has no account list. */
  accounts?: AccountStorage;
  now?: () => number;
  createSessionId?: () => string;
  /** Rate limiter: returns false when this key is over its limit. */
  allowRequest?: (key: string, now: number) => boolean;
  /** The address of the visitor, for the rate limiter. */
  ip?: string;
  log?: (message: string) => void;
}

export type { AdminAccount, AdminOverview, AdminQuote };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Compare two passwords without leaking how much of them matches. Both sides
 * are hashed first, so the comparison has the same length every time.
 */
export function passwordMatches(given: string, expected: string): boolean {
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Read the session id from the cookie header of the request. */
export function readAdminSessionId(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === ADMIN_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** The cookie that carries the admin session id. */
export function adminCookie(id: string, secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=${encodeURIComponent(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`,
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

/** The cookie that clears the admin session. */
export function clearAdminCookie(secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ].join('; ');
}

/** The session of the request, or null when nobody is logged in. */
export async function adminFromSession(
  cookieHeader: string | null | undefined,
  deps: Pick<AdminDeps, 'sessions' | 'now'>
): Promise<{ id: string } | null> {
  const sessionId = readAdminSessionId(cookieHeader);
  if (!sessionId) return null;
  const session = await deps.sessions.getSession(sessionId);
  if (!session) return null;
  const now = deps.now ? deps.now() : Date.now();
  if (new Date(session.expiresAt).getTime() <= now) {
    await deps.sessions.deleteSession(sessionId);
    return null;
  }
  return { id: session.id };
}

function toAdminQuote(quote: QuoteRecord): AdminQuote {
  return {
    id: quote.id,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    status: quote.status,
    ...(quote.paidAt ? { paidAt: quote.paidAt } : {}),
    planId: quote.planId,
    planName: quote.planName,
    sectorName: quote.sectorName,
    styleName: quote.styleName,
    services: quote.services,
    subtotalCents: quote.subtotalCents,
    vatCents: quote.vatCents,
    totalCents: quote.totalCents,
    url: buildQuotePath(quote.id, quote.token),
    customerName: quote.customer.owner,
    ...(quote.customer.email ? { customerEmail: quote.customer.email } : {}),
    customerPhone: quote.customer.phone,
    city: quote.customer.city,
  };
}

/** Everything Klusbaas needs to see: the sites, the requests and the offers. */
export async function buildOverview(deps: AdminDeps): Promise<AdminOverview> {
  const records = await deps.sites.listSites();
  const sites = records.map((site) => ({
    slug: site.slug,
    biz: site.form.biz,
    owner: site.form.owner,
    phone: site.form.phone,
    city: site.form.city,
    ...(site.form.email ? { email: site.form.email } : {}),
    sector: site.sector,
    updatedAt: site.updatedAt,
    hasAccount: Boolean(site.ownerId),
    ownerId: site.ownerId ?? '',
    manageUrl: `/mijn-site/${site.slug}?token=${site.token}`,
  }));
  const leads = [...(await deps.leads.listLeads())].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
  const quotes = (await deps.leads.listQuotes())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(toAdminQuote);
  const accounts: AdminAccount[] = deps.accounts
    ? (await deps.accounts.listAccounts()).map((account) => ({
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        verified: Boolean(account.verifiedAt),
        sites: sites.filter((site) => site.ownerId === account.id).length,
      }))
    : [];
  return { sites, leads, quotes, accounts };
}

/**
 * Handle a call to `/api/admin`.
 *
 * `login` checks the password from the environment, `overview` returns
 * everything Klusbaas needs and `quote-status` marks an offer as paid or
 * cancelled.
 */
export async function handleAdmin(
  rawBody: unknown,
  deps: AdminDeps,
  cookieHeader: string | null | undefined,
  secure = true
): Promise<AdminHandlerResult> {
  const body: AdminRequestBody = isRecord(rawBody) ? (rawBody as AdminRequestBody) : {};
  const action = body.action;
  const log = deps.log ?? (() => {});

  if (action === 'login') {
    const expected = (deps.env.ADMIN_PASSWORD ?? '').trim();
    if (!expected) {
      return {
        status: 503,
        body: { ok: false, error: 'Er is geen beheerderswachtwoord ingesteld.' },
      };
    }
    // Brute force: max 10 pogingen per kwartier per IP.
    if (deps.allowRequest && !deps.allowRequest(`admin-login-${deps.ip ?? 'onbekend'}`, Date.now())) {
      log('[admin] te veel inlogpogingen');
      return {
        status: 429,
        body: { ok: false, error: 'Te veel pogingen. Probeer het over een kwartier opnieuw.' },
      };
    }
    const given = typeof body.password === 'string' ? body.password : '';
    if (!passwordMatches(given, expected)) {
      log('[admin] verkeerd wachtwoord');
      return { status: 401, body: { ok: false, error: 'Verkeerd wachtwoord.' } };
    }
    const id = deps.createSessionId ? deps.createSessionId() : randomBytes(24).toString('base64url');
    const now = deps.now ? deps.now() : Date.now();
    await deps.sessions.saveSession(adminSession(id, now));
    log(`[admin] ingelogd, sessie ${id.slice(0, 6)}…`);
    return {
      status: 200,
      body: { ok: true },
      setCookie: adminCookie(id, secure),
    };
  }

  if (action === 'logout') {
    const sessionId = readAdminSessionId(cookieHeader);
    if (sessionId) await deps.sessions.deleteSession(sessionId);
    return { status: 200, body: { ok: true }, clearCookie: clearAdminCookie(secure) };
  }

  const session = await adminFromSession(cookieHeader, deps);
  if (!session) {
    return { status: 401, body: { ok: false, error: 'Niet ingelogd.' } };
  }

  if (action === 'quote-status') {
    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status;
    if (!id || (status !== 'paid' && status !== 'cancelled' && status !== 'open')) {
      return { status: 400, body: { ok: false, error: 'Ongeldige offerte of status.' } };
    }
    const updated = await deps.leads.updateQuoteStatus(id, status);
    if (!updated) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    log(`[admin] offerte ${id} is nu ${status}`);
    return { status: 200, body: { ok: true } };
  }

  if (action === 'verify-account') {
    // De mail van de klant is niet aangekomen: Klusbaas bevestigt het
    // e-mailadres zelf, zodat de klant verder kan.
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id || !deps.accounts) {
      return { status: 400, body: { ok: false, error: 'Onbekend account.' } };
    }
    const account = await deps.accounts.getAccount(id);
    if (!account) {
      return { status: 404, body: { ok: false, error: 'Dit account bestaat niet (meer).' } };
    }
    const now = deps.now ? deps.now() : Date.now();
    await deps.accounts.saveAccount({
      ...account,
      verifiedAt: account.verifiedAt ?? now,
      verifyToken: undefined,
      verifyExpiresAt: undefined,
      updatedAt: now,
    });
    log(`[admin] account ${id} bevestigd`);
    return { status: 200, body: { ok: true } };
  }

  if (action === 'overview') {
    return { status: 200, body: { ok: true, overview: await buildOverview(deps) } };
  }

  return { status: 400, body: { ok: false, error: 'Onbekende actie.' } };
}
