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
 * Chase an offer that nobody accepted: the customer gets a reminder with
 * the link to the offer.
 */
export function remindQuote(id: string): Promise<AdminResult> {
  return post({ action: 'remind-quote', id });
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

export type { AdminCreatedQuote, AdminOverview, AdminQuote, AdminSite, StoredLead };
