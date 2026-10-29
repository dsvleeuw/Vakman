import type { AdminOverview, AdminQuote, AdminSite, StoredLead } from '../types';
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
  error?: string;
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

/** Confirm an e-mail address by hand, when the mail did not arrive. */
export function verifyAccount(id: string): Promise<AdminResult> {
  return post({ action: 'verify-account', id });
}

export type { AdminOverview, AdminQuote, AdminSite, StoredLead };
