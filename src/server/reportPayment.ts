import { reportPayment, type PaymentNoticeDeps } from './paymentNotice';
import { isQuoteExpired, isQuoteNumber, type QuoteRecord } from '../utils/quote';
import type { LeadStorage } from './storage';
import { tokensMatch } from './tokens';

/**
 * The customer says he transferred the money.
 *
 * The token from the offer link proves it is his offer. The offer keeps its
 * status `accepted`: only Klusbaas marks an offer as paid, after he checked
 * his bank statement. This endpoint only tells him that there is something to
 * check.
 */

export interface ReportPaymentRequest {
  /** The offer number, e.g. `KB-2026-0001`. */
  id?: string;
  /** The token from the offer link: it proves the offer is the customer's. */
  token?: string;
}

export interface ReportPaymentDeps
  extends Omit<PaymentNoticeDeps, 'markPaymentReported'> {
  storage: LeadStorage;
  now?: () => Date;
}

export interface ReportPaymentResult {
  status: number;
  body: {
    ok: boolean;
    /** The offer after the report, so the page can show what happened. */
    quote?: { id: string; status: string; paymentReportedAt?: string };
    error?: string;
    field?: string;
  };
}

export async function handleReportPayment(
  body: unknown,
  deps: ReportPaymentDeps
): Promise<ReportPaymentResult> {
  const raw = (body && typeof body === 'object' ? body : {}) as ReportPaymentRequest;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const token = typeof raw.token === 'string' ? raw.token : '';
  const now = deps.now ? deps.now() : new Date();

  if (!isQuoteNumber(id)) {
    return { status: 400, body: { ok: false, error: 'Ongeldige offertenummer.', field: 'id' } };
  }
  if (!token) {
    return { status: 400, body: { ok: false, error: 'Ongeldige offertelink.', field: 'token' } };
  }

  const record = await deps.storage.getQuote(id);
  if (!record) {
    return { status: 404, body: { ok: false, error: 'Offerte niet gevonden.' } };
  }
  if (!tokensMatch(record.token, token)) {
    return { status: 403, body: { ok: false, error: 'Deze offertelink is niet geldig.' } };
  }
  // Een verlopen offerte is geen belofte meer, dus daarover wordt niet
  // gecommunicceerd als er een betaling te melden zou zijn.
  if (isQuoteExpired(record, now) && record.status === 'open') {
    return {
      status: 409,
      body: {
        ok: false,
        error: 'Deze offerte is verlopen. Neig contact op met Klusbaas voor een actuele offerte.',
      },
    };
  }

  const result = await reportPayment(record, {
    ...deps,
    markPaymentReported: (quoteId, reportedAt) => deps.storage.markPaymentReported(quoteId, reportedAt),
  });
  if (!result.ok) {
    return { status: 400, body: { ok: false, error: result.error } };
  }
  const updated = await deps.storage.getQuote(id);
  return {
    status: 200,
    body: {
      ok: true,
      quote: {
        id,
        status: updated?.status ?? record.status,
        ...(updated?.paymentReportedAt ? { paymentReportedAt: updated.paymentReportedAt } : {}),
      },
    },
  };
}

export type { QuoteRecord };
