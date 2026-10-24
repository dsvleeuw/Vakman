/**
 * Browser side of the newsletter API. Never throws: network errors become
 * `{ ok: false }` with a Dutch message the form can show.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface NewsletterClientResult {
  ok: boolean;
  status: number;
  message?: string;
  error?: string;
  /** For unsubscribe: `afgemeld`, `al-afgemeld` or `ongeldig`. */
  result?: string;
}

export const NEWSLETTER_NETWORK_ERROR = 'Geen verbinding met de server. Controleer je internet en probeer het opnieuw.';

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

async function post(url: string, payload: unknown, fetchImpl: FetchLike): Promise<NewsletterClientResult> {
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let body: { ok?: boolean; message?: string; error?: string; status?: string } = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    const ok = response.ok && body.ok === true;
    return {
      ok,
      status: response.status,
      ...(body.message ? { message: body.message } : {}),
      ...(body.status ? { result: body.status } : {}),
      ...(ok ? {} : { error: body.error || NEWSLETTER_NETWORK_ERROR }),
    };
  } catch {
    return { ok: false, status: 0, error: NEWSLETTER_NETWORK_ERROR };
  }
}

export function subscribeNewsletter(
  payload: { email: string; source: 'footer' | 'nieuwsbrief'; website?: string },
  fetchImpl: FetchLike = defaultFetch
): Promise<NewsletterClientResult> {
  return post('/api/newsletter', payload, fetchImpl);
}

export function unsubscribeNewsletter(token: string, fetchImpl: FetchLike = defaultFetch): Promise<NewsletterClientResult> {
  return post('/api/newsletter/unsubscribe', { token }, fetchImpl);
}
