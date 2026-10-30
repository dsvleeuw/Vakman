import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type {
  AdminAccount,
  AdminCreatedQuote,
  AdminOverview,
  AdminQuote,
  DeliveryItem,
  InvoiceDetails,
  PaymentDetails,
} from '../types';
import type { QuoteRecord, QuoteStatus } from '../utils/quote';
import { QUOTE_VALID_DAYS, addDaysIso, buildQuotePath, isQuoteExpired } from '../utils/quote';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import { adminSession, type AdminStorage } from './adminStorage';
import { createOfferForCustomer, type OfferRequest } from './adminOffer';
import { activateService, sendServiceInvoice, stopService } from './adminService';
import type { AccountMail } from './accountMailer';
import { sendPaidNotice } from './paidNotice';
import { remindPayment } from './payReminder';
import { remindQuote } from './remindQuote';

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
  | 'extend-quote'
  | 'remind-quote'
  | 'remind-payment'
  | 'verify-account'
  | 'create-quote'
  | 'service-activate'
  | 'service-stop'
  | 'service-invoice'
  | 'delivery';

export interface AdminRequestBody extends OfferRequest {
  action?: AdminAction;
  password?: string;
  id?: string;
  status?: QuoteStatus;
  /** What the customer pays per month for the service, in cents. */
  amountCents?: number;
  /** The step on the delivery checklist of the offer. */
  itemId?: string;
  /** True when the step is done. */
  done?: boolean;
}

export interface AdminResponseBody {
  ok: boolean;
  overview?: AdminOverview;
  /** The offer Klusbaas made by hand. */
  quote?: AdminCreatedQuote;
  /** What happened with the invoice mail when an offer was marked as paid. */
  mailStatus?: string;
  /** What happened with the reminder mail. */
  reminderStatus?: string;
  /** What happened with the payment reminder mail. */
  paymentReminderStatus?: string;
  /** What happened with the mail of the monthly service. */
  serviceMailStatus?: string;
  /** The checklist of the offer, after a change. */
  delivery?: DeliveryItem[];
  /** The new validity date of an extended offer. */
  validUntil?: string;
  error?: string;
  field?: string;
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
  /** Sends the offer to the customer. Without it the offer is still made. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, shown in the mail. */
  payment?: PaymentDetails;
  /** Klusbaas' own details, printed on the invoice the customer gets. */
  invoice?: InvoiceDetails;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
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

function toAdminQuote(quote: QuoteRecord, now: Date): AdminQuote {
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
    customerName: quote.customer.owner,
    ...(quote.customer.email ? { customerEmail: quote.customer.email } : {}),
    customerPhone: quote.customer.phone,
    city: quote.customer.city,
    expired: isQuoteExpired(quote, now),
    ...(quote.leadReference ? { leadReference: quote.leadReference } : {}),
    ...(quote.delivery ? { delivery: quote.delivery } : {}),
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
    styleId: site.styleId,
    services: (site.services ?? []).map((offer) => offer.n).filter(Boolean),
    updatedAt: site.updatedAt,
    hasAccount: Boolean(site.ownerId),
    ownerId: site.ownerId ?? '',
    manageUrl: `/mijn-site/${site.slug}?token=${site.token}`,
  }));
  const leads = [...(await deps.leads.listLeads())].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
  const now = new Date(deps.now ? deps.now() : Date.now());
  const quotes = (await deps.leads.listQuotes())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((quote) => toAdminQuote(quote, now));
  const accounts: AdminAccount[] = deps.accounts
    ? (await deps.accounts.listAccounts()).map((account) => ({
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        verified: Boolean(account.verifiedAt),
        sites: sites.filter((site) => site.ownerId === account.id).length,
        ...(account.service ? { service: account.service } : {}),
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
    const before = await deps.leads.getQuote(id);
    const updated = await deps.leads.updateQuoteStatus(id, status);
    if (!updated) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    log(`[admin] offerte ${id} is nu ${status}`);
    // De klant heeft betaald: hij krijgt een factuur en een mail. Een
    // mislukte mail maakt de betaling niet ongedaan.
    let mailed: string | undefined;
    if (status === 'paid' && before?.status !== 'paid') {
      try {
        mailed = await sendPaidNotice(updated, {
          ...(deps.sendMail ? { sendMail: deps.sendMail } : {}),
          ...(deps.invoice ? { invoice: deps.invoice } : {}),
          ...(deps.payment ? { payment: deps.payment } : {}),
          ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
          log,
        });
      } catch (error) {
        mailed = 'mislukt';
        log(`[admin] factuur voor offerte ${id} mislukt: ${String(error)}`);
      }
    }
    return { status: 200, body: { ok: true, ...(mailed ? { mailStatus: mailed } : {}) } };
  }

  if (action === 'extend-quote') {
    // Een verlopen offerte verlengen: de prijs is nog dezelfde, dus de
    // klant mag hem nog accepteren.
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return { status: 400, body: { ok: false, error: 'Onbekende offerte.' } };
    }
    const record = await deps.leads.getQuote(id);
    if (!record) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    if (record.status === 'paid' || record.status === 'cancelled') {
      return { status: 400, body: { ok: false, error: 'Deze offerte is al betaald of geannuleerd.' } };
    }
    const now = deps.now ? deps.now() : Date.now();
    const validUntil = addDaysIso(new Date(now).toISOString(), QUOTE_VALID_DAYS);
    const updated = await deps.leads.extendQuote(id, validUntil);
    if (!updated) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    log(`[admin] offerte ${id} is verlengd tot ${validUntil}`);
    return { status: 200, body: { ok: true, validUntil } };
  }

  if (action === 'remind-quote') {
    // Klusbaas volgt een openstaande offerte op: de klant krijgt een
    // herinnering met de link naar de offerte.
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return { status: 400, body: { ok: false, error: 'Onbekende offerte.' } };
    }
    const record = await deps.leads.getQuote(id);
    if (!record) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    const result = await remindQuote(record, {
      ...(deps.sendMail ? { sendMail: deps.sendMail } : {}),
      ...(deps.payment ? { payment: deps.payment } : {}),
      ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
      log,
    });
    if (!result.ok) {
      return { status: 400, body: { ok: false, error: result.error } };
    }
    return { status: 200, body: { ok: true, reminderStatus: result.mailStatus } };
  }

  if (action === 'remind-payment') {
    // De klant heeft ja gezegd maar nog niet betaald: de klant krijgt een
    // herinnering met het bedrag en de IBAN.
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return { status: 400, body: { ok: false, error: 'Onbekende offerte.' } };
    }
    const record = await deps.leads.getQuote(id);
    if (!record) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    const result = await remindPayment(record, {
      ...(deps.sendMail ? { sendMail: deps.sendMail } : {}),
      ...(deps.payment ? { payment: deps.payment } : {}),
      ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
      log,
    });
    if (!result.ok) {
      return { status: 400, body: { ok: false, error: result.error } };
    }
    return { status: 200, body: { ok: true, paymentReminderStatus: result.mailStatus } };
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

  if (action === 'create-quote') {
    // Klusbaas schrijft zelf een offerte: voor een klant die geen aanvraag
    // deed, maar wél een account en een site. Het wordt een echte offerte
    // met PDF, in het account van de klant, en per mail verstuurd.
    const result = await createOfferForCustomer(body, {
      leads: deps.leads,
      sites: deps.sites,
      ...(deps.accounts ? { accounts: deps.accounts } : {}),
      ...(deps.sendMail ? { sendMail: deps.sendMail } : {}),
      ...(deps.payment ? { payment: deps.payment } : {}),
      ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
      ...(deps.now ? { now: deps.now } : {}),
      log,
    });
    if (!result.ok) {
      return {
        status: 400,
        body: { ok: false, error: result.error, ...(result.field ? { field: result.field } : {}) },
      };
    }
    return { status: 200, body: { ok: true, quote: result.quote } };
  }

  if (action === 'delivery') {
    // Klusbaas vinkt af wat hij voor de site van de klant heeft gedaan. De
    // klant ziet dezelfde lijst in zijn account.
    const id = typeof body.id === 'string' ? body.id : '';
    const itemId = typeof body.itemId === 'string' ? body.itemId : '';
    if (!id || !itemId) {
      return { status: 400, body: { ok: false, error: 'Onbekende offerte of stap.' } };
    }
    const record = await deps.leads.getQuote(id);
    if (!record) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    const done = body.done === true;
    const now = deps.now ? deps.now() : Date.now();
    const delivery = (record.delivery ?? []).map((item) =>
      item.id === itemId
        ? {
            ...item,
            done,
            ...(done ? { doneAt: new Date(now).toISOString() } : { doneAt: undefined }),
          }
        : item
    );
    const updated = await deps.leads.updateQuoteDelivery(id, delivery);
    if (!updated) {
      return { status: 404, body: { ok: false, error: 'Deze offerte bestaat niet (meer).' } };
    }
    log(`[admin] oplevering van offerte ${id} bijgewerkt`);
    return { status: 200, body: { ok: true, delivery } };
  }

  if (action === 'service-activate' || action === 'service-stop' || action === 'service-invoice') {
    // De maandelijkse service van een klant: aanzetten, stoppen of de
    // maandfactuur sturen. De klant vraagt de service zelf aan in zijn
    // account; Klusbaas zet hem aan en stuurt elke maand de factuur.
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id || !deps.accounts) {
      return { status: 400, body: { ok: false, error: 'Onbekend account.' } };
    }
    const amountCents =
      typeof body.amountCents === 'number' && body.amountCents >= 0 ? body.amountCents : undefined;
    const serviceDeps = {
      accounts: deps.accounts,
      sites: deps.sites,
      ...(deps.sendMail ? { sendMail: deps.sendMail } : {}),
      ...(deps.payment ? { payment: deps.payment } : {}),
      ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
      ...(deps.now ? { now: deps.now } : {}),
      log,
    };
    const result =
      action === 'service-activate'
        ? await activateService(id, amountCents, serviceDeps)
        : action === 'service-stop'
          ? await stopService(id, serviceDeps)
          : await sendServiceInvoice(id, serviceDeps);
    if (!result.ok) {
      return { status: 400, body: { ok: false, error: result.error } };
    }
    return {
      status: 200,
      body: { ok: true, ...(result.mailStatus ? { serviceMailStatus: result.mailStatus } : {}) },
    };
  }

  if (action === 'overview') {
    return { status: 200, body: { ok: true, overview: await buildOverview(deps) } };
  }

  return { status: 400, body: { ok: false, error: 'Onbekende actie.' } };
}
