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

export interface QuoteRequestInput {
  /** The package: `basis`, `pro` or `premium`. */
  plan: string;
  /** The extra components he wants, by id. */
  addons: string[];
  /** What he wants Klusbaas to do, in his own words. */
  message?: string;
  /** The trade of his site. */
  sector?: string;
  /** The style of his site. */
  style?: string;
  /** His own services, by name. */
  services?: string[];
  /** His details, from the editor. */
  form: { biz: string; owner: string; phone: string; city: string };
  /** His published site, when he has one. */
  siteSlug?: string;
}

export interface QuoteRequestResponse {
  ok: boolean;
  /** The offer the customer asked for. */
  quote?: {
    id: string;
    path: string;
    planName: string;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
  };
  /** The reference of the stored request (`L-XXXXXX`). */
  reference?: string;
  error?: string;
  /** The field that needs attention, e.g. `plan` or `biz`. */
  field?: string;
  /** Something the customer should know, e.g. the mail to Klusbaas failed. */
  notice?: string;
}

/**
 * The customer asks for an offer in his own site editor.
 *
 * Never throws: a network error or an unexpected reply becomes
 * `{ ok: false }` with a Dutch message, so the editor can show a real error
 * instead of a silent nothing.
 */
export async function requestQuote(
  input: QuoteRequestInput,
  fetchImpl: FetchLike = fetch
): Promise<QuoteRequestResponse> {
  try {
    const response = await fetchImpl('/api/quote/request', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = (await response.json().catch(() => ({}))) as QuoteRequestResponse;
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
