import type {
  AdminCreatedQuote,
  AdminOverview,
  AdminQuote,
  AdminSite,
  StoredLead,
} from '../types';
import type { QuoteStatus } from './quote';

/**
 * The browser side of `/api/admin`: the Klusbaas overview.
 *
 * The overview is behind a password. The session lives in an httpOnly
 * cookie, so there is nothing to keep in the browser.
 */

export interface AdminResult {
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
  /** The new validity date of an extended offer. */
  validUntil?: string;
  error?: string;
  field?: string;
}

async function post(body: unknown): Promise<AdminResult> {
  try {
    const response = await fetch('/api/admin', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as AdminResult;
    if (typeof data?.ok !== 'boolean') {
      return { ok: false, error: 'De server gaf een onverwacht antwoord.' };
    }
    return data;
  } catch {
    return { ok: false, error: 'We konden de server niet bereiken.' };
  }
}

export function adminLogin(password: string): Promise<AdminResult> {
  return post({ action: 'login', password });
}

export function adminLogout(): Promise<AdminResult> {
  return post({ action: 'logout' });
}

/** Everything Klusbaas needs to see: the sites, the requests and the offers. */
export async function fetchAdminOverview(): Promise<AdminOverview | null> {
  const result = await post({ action: 'overview' });
  return result.ok && result.overview ? result.overview : null;
}

/** Mark an offer as paid, cancelled or open again. */
export function setQuoteStatus(id: string, status: QuoteStatus): Promise<AdminResult> {
  return post({ action: 'quote-status', id, status });
}

/**
 * Give an expired offer a new validity date, so the customer can still
 * accept it.
 */
export function extendQuote(id: string): Promise<AdminResult> {
  return post({ action: 'extend-quote', id });
}

/**
 * Chase an offer that nobody accepted: the customer gets a reminder with
 * the link to the offer.
 */
export function remindQuote(id: string): Promise<AdminResult> {
  return post({ action: 'remind-quote', id });
}

/**
 * Chase an offer the customer accepted but did not pay: he gets the amount
 * and the IBAN again.
 */
export function remindPayment(id: string): Promise<AdminResult> {
  return post({ action: 'remind-payment', id });
}

/** Confirm an e-mail address by hand, when the mail did not arrive. */
export function verifyAccount(id: string): Promise<AdminResult> {
  return post({ action: 'verify-account', id });
}

/**
 * The offer Klusbaas writes for a customer who did not ask for one: the
 * customer has an account and a site, but no order yet.
 */
export interface OfferInput {
  email: string;
  accountId?: string;
  siteSlug?: string;
  /** The request the customer sent (`L-XXXXXX`), when he only sent one. */
  leadReference?: string;
  plan: string;
  addons?: string[];
  sector?: string;
  style?: string;
  services?: string[];
  biz?: string;
  owner?: string;
  phone?: string;
  city?: string;
  /** Set to false to save the offer without mailing it. */
  send?: boolean;
}

export function createQuote(input: OfferInput): Promise<AdminResult> {
  return post({ action: 'create-quote', ...input });
}

/**
 * Switch the monthly service on for a customer. The amount is what he pays
 * per month; `0` is used for the months that come with a package.
 */
export function activateService(id: string, amountCents?: number): Promise<AdminResult> {
  return post({ action: 'service-activate', id, ...(amountCents === undefined ? {} : { amountCents }) });
}

/** Stop the monthly service of a customer: the site and the code go back to him. */
export function stopService(id: string): Promise<AdminResult> {
  return post({ action: 'service-stop', id });
}

/** Send the monthly invoice of the service to a customer. */
export function sendServiceInvoice(id: string): Promise<AdminResult> {
  return post({ action: 'service-invoice', id });
}

/**
 * Tick a step of the delivery checklist of an offer off (or back on). The
 * customer sees the same list in his account.
 */
export function setDeliveryStep(id: string, itemId: string, done: boolean): Promise<AdminResult> {
  return post({ action: 'delivery', id, itemId, done });
}

export type { AdminCreatedQuote, AdminOverview, AdminQuote, AdminSite, StoredLead };
