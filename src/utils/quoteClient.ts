/**
 * Browser side of `POST /api/quote/accept`: the customer says yes.
 *
 * Never throws: a network error or a non-JSON reply becomes
 * `{ ok: false }` with a Dutch message, so every place that shows the
 * button can show a real error instead of a silent nothing.
 */

export interface AcceptQuoteResponse {
  ok: boolean;
  /** The offer after the acceptance, so the page can show the new status. */
  quote?: { id: string; status: string; acceptedAt?: string };
  error?: string;
  field?: string;
}

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface ReportPaymentResponse {
  ok: boolean;
  quote?: { id: string; status: string; paymentReportedAt?: string };
  error?: string;
  field?: string;
}

/**
 * The customer says he transferred the money. Klusbaas checks his bank
 * statement; only he marks the offer as paid.
 */
export async function reportPayment(
  id: string,
  token: string,
  fetchImpl: FetchLike = fetch
): Promise<ReportPaymentResponse> {
  try {
    const response = await fetchImpl('/api/quote/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token }),
    });
    const body = (await response.json().catch(() => ({}))) as ReportPaymentResponse;
    if (typeof body?.ok !== 'boolean') {
      return { ok: false, error: 'De server gaf een onverwacht antwoord.' };
    }
    return body;
  } catch {
    return {
      ok: false,
      error: 'Geen verbinding met de server. Mail ons gerust even.',
    };
  }
}

export async function acceptQuote(
  id: string,
  token: string,
  name: string,
  fetchImpl: FetchLike = fetch
): Promise<AcceptQuoteResponse> {
  try {
    const response = await fetchImpl('/api/quote/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token, name }),
    });
    const body = (await response.json().catch(() => ({}))) as AcceptQuoteResponse;
    if (typeof body?.ok !== 'boolean') {
      return { ok: false, error: 'De server gaf een onverwacht antwoord.' };
    }
    return body;
  } catch {
    return {
      ok: false,
      error: 'Geen verbinding met de server. Mail ons gerust even.',
    };
  }
}
