import type { PublicPublishedSite } from '../types';

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
}

export interface AccountResult {
  ok: boolean;
  account?: AccountInfo;
  sites?: PublicPublishedSite[];
  site?: PublicPublishedSite;
  error?: string;
  field?: string;
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
 * Link a site that was published with a management link to the account, so
 * the customer can manage it from now on without that link.
 */
export function claimSite(slug: string, token: string): Promise<AccountResult> {
  return post({ action: 'claim', slug, token });
}

/**
 * Read the slug and the token out of a management link
 * (`/mijn-site/<slug>?token=…`). Returns null when the text is not such a
 * link, so the customer gets a clear message instead of a silent failure.
 */
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
