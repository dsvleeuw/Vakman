/**
 * Browser side of `POST /api/lead`: one place that turns every possible
 * outcome (success, validation error, server down, offline) into a result
 * the forms can show.
 */

export const LEAD_ENDPOINT = '/api/lead';

export interface LeadSubmitSuccess {
  ok: true;
  reference: string;
  /** True when the server ran without RESEND_API_KEY (nothing was mailed). */
  preview: boolean;
  customerEmailSent: boolean;
  /** Extra fields some kinds return (the wizard quote link, for example). */
  data: Record<string, unknown>;
}

export interface LeadSubmitFailure {
  ok: false;
  error: string;
}

export type LeadSubmitResult = LeadSubmitSuccess | LeadSubmitFailure;

export const LEAD_NETWORK_ERROR =
  'Geen verbinding met de server. Controleer je internet en probeer het opnieuw, of stuur een WhatsApp.';
const LEAD_GENERIC_ERROR = 'Versturen is niet gelukt. Probeer het opnieuw of stuur een WhatsApp.';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export async function postLead(
  payload: Record<string, unknown>,
  fetchImpl: FetchLike = (url, init) => fetch(url, init)
): Promise<LeadSubmitResult> {
  let response: Response;
  try {
    response = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, error: LEAD_NETWORK_ERROR };
  }
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !body || body.ok !== true) {
    const error = body && typeof body.error === 'string' && body.error ? body.error : LEAD_GENERIC_ERROR;
    return { ok: false, error };
  }
  return {
    ok: true,
    reference: typeof body.reference === 'string' ? body.reference : '',
    preview: body.mode === 'preview',
    customerEmailSent: body.customerEmailSent === true,
    data: body,
  };
}
