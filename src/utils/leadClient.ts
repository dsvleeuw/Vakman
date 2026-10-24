import type { PublicQuote } from './quote';

/**
 * Browser side of `POST /api/lead`. Never throws: a network error or a non-JSON
 * reply becomes `{ ok: false }` with a Dutch message so every form can show a
 * real error plus its WhatsApp fallback.
 */

export type DeliveryStatus = 'sent' | 'preview' | 'failed' | 'skipped';

export interface LeadResponse {
  ok: boolean;
  status: number;
  type?: string;
  mode?: 'sent' | 'preview';
  reference?: string;
  delivery?: {
    team: { to: string; status: DeliveryStatus };
    customer: { to: string; status: DeliveryStatus };
  };
  quote?: PublicQuote & { path: string };
  error?: string;
  field?: string;
}

export const LEAD_ENDPOINT = '/api/lead';
export const NETWORK_ERROR = 'Geen verbinding met de server. Controleer je internet of stuur je aanvraag via WhatsApp.';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export async function submitLead(
  payload: Record<string, unknown>,
  fetchImpl: FetchLike = (url, init) => fetch(url, init)
): Promise<LeadResponse> {
  try {
    const response = await fetchImpl(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let body: Partial<LeadResponse> = {};
    try {
      body = (await response.json()) as Partial<LeadResponse>;
    } catch {
      body = {};
    }
    const ok = response.ok && body.ok === true;
    return {
      ...body,
      ok,
      status: response.status,
      ...(ok ? {} : { error: body.error || NETWORK_ERROR }),
    };
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
}

/** One-line Dutch summary of who received what, for the success screens. */
export function describeDelivery(response: LeadResponse): string {
  const customer = response.delivery?.customer;
  if (!customer) return 'We hebben je aanvraag ontvangen.';
  switch (customer.status) {
    case 'sent':
      return `Bevestiging gemaild naar ${customer.to}.`;
    case 'preview':
      return 'Testmodus: er is nog geen mail verstuurd, je aanvraag staat wel bij ons.';
    case 'failed':
      return 'Je aanvraag is binnen, maar de bevestigingsmail kon nog niet worden verstuurd. We nemen zelf contact op.';
    default:
      // No e-mail address given: the on-screen confirmation says it all.
      return '';
  }
}
