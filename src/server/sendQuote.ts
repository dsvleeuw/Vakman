import { buildQuote, parseQuoteRequest, type Quote } from '../utils/quote';
import { buildQuoteEmail, createQuoteReference } from '../utils/quoteEmail';

/**
 * Server-side quote handler, shared by the Netlify Function
 * (`netlify/functions/send-quote.mts`) and the Vite dev middleware so local
 * development and production behave the same.
 */

export interface SendQuoteEnv {
  /** Resend API key. Without it the handler runs in preview mode and sends nothing. */
  RESEND_API_KEY?: string;
  /** Sender, e.g. "Klusbaas <offerte@klusbaas.nl>" (domain must be verified in Resend). */
  QUOTE_FROM_EMAIL?: string;
  /** Where new leads go. */
  QUOTE_NOTIFY_EMAIL?: string;
}

export interface SendQuoteResult {
  status: number;
  body: {
    ok: boolean;
    mode?: 'sent' | 'preview';
    reference?: string;
    quote?: Quote;
    customerEmailSent?: boolean;
    error?: string;
  };
}

export const DEFAULT_NOTIFY_EMAIL = 'thomascliphero@gmail.com';
/** Resend's shared test sender; only delivers to the Resend account's own address. */
export const DEFAULT_FROM_EMAIL = 'Klusbaas <onboarding@resend.dev>';

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

async function sendViaResend(
  apiKey: string,
  payload: Record<string, unknown>,
  fetchImpl: FetchLike
): Promise<{ ok: boolean; detail: string }> {
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: response.ok, detail: response.ok ? '' : await response.text() };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function handleSendQuote(
  body: unknown,
  env: SendQuoteEnv,
  fetchImpl: FetchLike = fetch,
  log: (message: string) => void = console.log
): Promise<SendQuoteResult> {
  const parsed = parseQuoteRequest(body);
  if (!parsed.ok) return { status: 400, body: { ok: false, error: parsed.error } };
  const { request } = parsed;

  const reference = createQuoteReference();
  // Bots fill the hidden field; pretend success so they learn nothing.
  if (request.website) return { status: 200, body: { ok: true, mode: 'sent', reference } };

  const quote = buildQuote(request.plan, request.addons);
  const teamMail = buildQuoteEmail(quote, request, 'team', reference);
  const customerMail = buildQuoteEmail(quote, request, 'customer', reference);
  const notify = env.QUOTE_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;
  const from = env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

  if (!env.RESEND_API_KEY) {
    log(
      `[send-quote] PREVIEW (geen RESEND_API_KEY) ${reference}\n` +
        `→ ${notify}: ${teamMail.subject}\n→ ${request.form.email}: ${customerMail.subject}\n\n${teamMail.text}`
    );
    return { status: 200, body: { ok: true, mode: 'preview', reference, quote, customerEmailSent: false } };
  }

  const team = await sendViaResend(
    env.RESEND_API_KEY,
    { from, to: [notify], reply_to: request.form.email, subject: teamMail.subject, html: teamMail.html, text: teamMail.text },
    fetchImpl
  );
  if (!team.ok) {
    log(`[send-quote] team mail failed ${reference}: ${team.detail}`);
    return {
      status: 502,
      body: { ok: false, reference, error: 'Versturen is niet gelukt. Probeer het opnieuw of stuur ons een WhatsApp.' },
    };
  }

  const customer = await sendViaResend(
    env.RESEND_API_KEY,
    { from, to: [request.form.email], reply_to: notify, subject: customerMail.subject, html: customerMail.html, text: customerMail.text },
    fetchImpl
  );
  if (!customer.ok) log(`[send-quote] customer mail failed ${reference}: ${customer.detail}`);

  return { status: 200, body: { ok: true, mode: 'sent', reference, quote, customerEmailSent: customer.ok } };
}
