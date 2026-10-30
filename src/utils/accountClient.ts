import type {
  AccountExport,
  AccountQuote,
  PaymentDetails,
  PublicPublishedSite,
  RequestStatus,
  ServiceState,
  StoredLead,
} from '../types';

/**
 * Talking to `/api/account`: register, log in, log out and the sites of
 * the logged-in customer.
 *
 * The session lives in an httpOnly cookie, so there is no token to store in
 * the browser and nothing to keep in sync.
 */

export interface AccountInfo {
  id: string;
  email: string;
  /** True when the customer confirmed his e-mail address. */
  verified: boolean;
  /** The monthly service, when the customer asked for it. */
  service?: ServiceState;
}

export interface AccountResult {
  ok: boolean;
  account?: AccountInfo;
  sites?: PublicPublishedSite[];
  /** The requests that came in through the sites of this customer. */
  leads?: StoredLead[];
  /** The offers this customer requested. */
  quotes?: AccountQuote[];
  /** How the customer can pay. */
  payment?: PaymentDetails;
  /** Everything we hold about this customer, in one file. */
  export?: AccountExport;
  site?: PublicPublishedSite;
  error?: string;
  field?: string;
  /** A message for the customer, e.g. after a reset request. */
  message?: string;
}

async function post(body: unknown): Promise<AccountResult> {
  try {
    const response = await fetch('/api/account', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as AccountResult;
    if (typeof data?.ok !== 'boolean') {
      return { ok: false, error: 'De server gaf een onverwacht antwoord.' };
    }
    return data;
  } catch {
    return {
      ok: false,
      error: 'We konden de server niet bereiken. Controleer je verbinding en probeer het opnieuw.',
    };
  }
}

export function registerAccount(email: string, password: string): Promise<AccountResult> {
  return post({ action: 'register', email, password });
}

export function loginAccount(email: string, password: string): Promise<AccountResult> {
  return post({ action: 'login', email, password });
}

export function logoutAccount(): Promise<AccountResult> {
  return post({ action: 'logout' });
}

/** Who is logged in? Null when nobody is. */
export async function fetchAccount(): Promise<AccountInfo | null> {
  const result = await post({ action: 'me' });
  return result.ok && result.account ? result.account : null;
}

/** The sites the logged-in customer owns. */
export async function fetchAccountSites(): Promise<PublicPublishedSite[]> {
  const result = await post({ action: 'sites' });
  return result.ok && Array.isArray(result.sites) ? result.sites : [];
}

/**
 * The requests that came in through the sites of the logged-in customer.
 * Klusbaas keeps them on his behalf, so he sees them even when the mail
 * did not arrive.
 */
export async function fetchAccountLeads(): Promise<StoredLead[]> {
  const result = await post({ action: 'leads' });
  return result.ok && Array.isArray(result.leads) ? result.leads : [];
}

/**
 * The offers of the logged-in customer, newest first, with the way to pay
 * when Klusbaas filled in the payment details.
 */
export async function fetchAccountQuotes(): Promise<{
  quotes: AccountQuote[];
  payment?: PaymentDetails;
}> {
  const result = await post({ action: 'quotes' });
  return {
    quotes: result.ok && Array.isArray(result.quotes) ? result.quotes : [],
    ...(result.payment ? { payment: result.payment } : {}),
  };
}

/**
 * Everything we hold about the logged-in customer: his account, his sites,
 * his requests, his offers and his service.
 *
 * The AVG (art. 15) says he may ask for this. Today he does it himself,
 * without a mail to Klusbaas.
 */
export function fetchAccountExport(): Promise<AccountResult> {
  return post({ action: 'export' });
}

/**
 * Save the export as a file the customer can keep. Returns the file name.
 */
export function downloadAccountExport(data: AccountExport): string {
  const name = `klusbaas-gegevens-${data.exportedAt.slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return name;
}

/**
 * Ask for a link to set a new password. The answer is the same whether or
 * not the address is known, so nobody can find out who has an account.
 */
export function requestPasswordReset(email: string): Promise<AccountResult> {
  return post({ action: 'reset-request', email });
}

/** Set a new password with the token from the reset mail. */
export function resetPassword(token: string, password: string): Promise<AccountResult> {
  return post({ action: 'reset', token, password });
}

/** Confirm the e-mail address with the token from the verification mail. */
export function verifyEmail(token: string): Promise<AccountResult> {
  return post({ action: 'verify', token });
}

/** Ask for a new verification mail. */
export function resendVerification(): Promise<AccountResult> {
  return post({ action: 'verify-request' });
}

/**
 * Link a site that was published with a management link to the account, so
 * the customer can manage it from now on without that link.
 */
export function claimSite(slug: string, token: string): Promise<AccountResult> {
  return post({ action: 'claim', slug, token });
}

/**
 * Ask for the monthly service: hosting, SSL, updates, support and one
 * change a month. Klusbaas sees the request in his overview and switches
 * the service on.
 */
export function requestService(): Promise<AccountResult> {
  return post({ action: 'service-request' });
}

/**
 * Stop the monthly service. The site stays online; Klusbaas hands over the
 * site and the code.
 */
export function cancelService(): Promise<AccountResult> {
  return post({ action: 'service-cancel' });
}

/**
 * Link an offer the customer received by mail to his account, so he sees the
 * price and the way to pay there.
 */
export function claimQuote(id: string, token: string): Promise<AccountResult> {
  return post({ action: 'claim-quote', id, token });
}

/**
 * Read the slug and the token out of a management link
 * (`/mijn-site/<slug>?token=…`). Returns null when the text is not such a
 * link, so the customer gets a clear message instead of a silent failure.
 */
/**
 * Say where a request on the craftsman's own site stands. Only the requests
 * of his own sites can be changed.
 */
export function setLeadStatus(reference: string, status: RequestStatus): Promise<AccountResult> {
  return post({ action: 'lead-status', reference, leadStatus: status });
}

export function parseManageLink(value: string): { slug: string; token: string } | null {
  const text = value.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text, 'https://klusbaas.nl');
  } catch {
    return null;
  }
  const token = url.searchParams.get('token');
  const segments = url.pathname.split('/').filter(Boolean);
  const slug = segments[0] === 'mijn-site' ? segments[1] : undefined;
  if (!slug || !token) return null;
  return { slug, token };
}

/**
 * Read the number and the token out of an offer link
 * (`/offerte/KB-2026-0001?token=…`). Returns null when the text is not such
 * a link.
 */
export function parseQuoteLink(value: string): { id: string; token: string } | null {
  const text = value.trim();
  if (!text) return null;
  let url: URL;
  try {
    url = new URL(text, 'https://klusbaas.nl');
  } catch {
    return null;
  }
  const token = url.searchParams.get('token');
  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments[0] === 'offerte' ? segments[1] : undefined;
  if (!id || !token) return null;
  return { id: decodeURIComponent(id), token };
}
