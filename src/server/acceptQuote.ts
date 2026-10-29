import { buildAcceptEmail } from '../utils/leadEmail';
import { isQuoteNumber, type QuoteRecord } from '../utils/quote';
import {
  redirectForTest,
  sendViaResend,
  type DeliveryResult,
  type FetchLike,
  type OutgoingMail,
} from './mailer';
import type { LeadStorage } from './storage';
import { tokensMatch } from './tokens';

/**
 * The customer says yes on the offer page.
 *
 * Until now the offer page only showed the price and the way to pay: to
 * accept, the customer had to write a mail or send a WhatsApp message. That
 * is where a sale is lost most easily — the customer has to do the work.
 *
 * This endpoint lets the customer accept with one click: the offer gets the
 * status `accepted`, Klusbaas gets a mail with the details, and the customer
 * gets a confirmation. The money still has to be transferred; Klusbaas marks
 * the offer as paid once it is.
 */

export interface AcceptQuoteRequest {
  /** The offer number, e.g. `KB-2026-0001`. */
  id?: string;
  /** The token from the offer link: it proves the offer is the customer's. */
  token?: string;
  /** The customer's name; he types it, so he really read the offer. */
  name?: string;
}

export interface AcceptQuoteDeps {
  storage: LeadStorage;
  /** Sends the mail to Klusbaas. Without it the acceptance is still saved. */
  sendMail?: (mail: OutgoingMail) => Promise<DeliveryResult>;
  /** Where Klusbaas gets the notification. */
  notifyEmail?: string;
  /** The address the mail comes from. */
  fromEmail?: string;
  /** The Resend key. Without it the mail is only logged. */
  resendApiKey?: string;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  fetchImpl?: FetchLike;
  now?: () => Date;
  log?: (message: string) => void;
}

export interface AcceptQuoteResult {
  status: number;
  body: {
    ok: boolean;
    /** The offer after the acceptance, so the page can show the new status. */
    quote?: { id: string; status: string; acceptedAt?: string };
    error?: string;
    field?: string;
  };
}

const DEFAULT_NOTIFY = 'thomascliphero@gmail.com';
const DEFAULT_FROM = 'Klusbaas <onboarding@resend.dev>';

/**
 * The mailer for the acceptance: a mail to Klusbaas. Without an API key
 * nothing is sent: the mail is only written to the log (preview mode).
 */
export function createAcceptMailer(
  env: { RESEND_API_KEY?: string; QUOTE_FROM_EMAIL?: string; MAIL_TEST_RECIPIENT?: string },
  log: (message: string) => void = () => {},
  fetchImpl?: FetchLike
): (mail: OutgoingMail) => Promise<DeliveryResult> {
  const from = env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM;
  return async (mail) => {
    if (!env.RESEND_API_KEY) {
      log(`[quote] PREVIEW mail: ${mail.subject}`);
      return { to: mail.to, status: 'preview' };
    }
    return sendViaResend(
      env.RESEND_API_KEY,
      redirectForTest(mail, env.MAIL_TEST_RECIPIENT),
      fetchImpl
    );
  };
}

/**
 * Accept an offer. The token must match: an offer is only accepted by
 * someone who has the link from the mail.
 */
export async function handleAcceptQuote(
  body: unknown,
  deps: AcceptQuoteDeps
): Promise<AcceptQuoteResult> {
  const log = deps.log ?? (() => {});
  const raw = (body && typeof body === 'object' ? body : {}) as AcceptQuoteRequest;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const token = typeof raw.token === 'string' ? raw.token : '';
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 120) : '';

  if (!isQuoteNumber(id)) {
    return { status: 400, body: { ok: false, error: 'Ongeldige offertenummer.', field: 'id' } };
  }
  if (!token) {
    return { status: 400, body: { ok: false, error: 'Ongeldige offertelink.', field: 'token' } };
  }
  if (!name) {
    return { status: 400, body: { ok: false, error: 'Vul je naam in.', field: 'name' } };
  }

  const record = await deps.storage.getQuote(id);
  if (!record) {
    return { status: 404, body: { ok: false, error: 'Offerte niet gevonden.' } };
  }
  if (!tokensMatch(record.token, token)) {
    return { status: 403, body: { ok: false, error: 'Deze offertelink is niet geldig.' } };
  }
  if (record.status === 'paid') {
    return { status: 200, body: { ok: true, quote: { id: record.id, status: record.status } } };
  }
  if (record.status === 'cancelled') {
    return { status: 409, body: { ok: false, error: 'Deze offerte is geannuleerd.' } };
  }

  const now = deps.now ? deps.now() : new Date();
  const updated = (await deps.storage.updateQuoteStatus(id, 'accepted')) ?? {
    ...record,
    status: 'accepted' as const,
    acceptedAt: now.toISOString(),
  };
  log(`[quote] offerte ${id} geaccepteerd door ${name}`);

  // Klusbaas moet het weten: dit is een klant die ja zegt.
  const siteUrl = deps.siteUrl ?? 'https://klusbaas.nl';
  const notify = deps.notifyEmail?.trim() || DEFAULT_NOTIFY;
  const from = deps.fromEmail?.trim() || DEFAULT_FROM;
  if (deps.sendMail) {
    const mail = buildAcceptEmail({ ...updated, customer: { ...updated.customer, owner: name } }, {
      siteUrl,
    });
    try {
      const result = await deps.sendMail({
        from,
        to: notify,
        ...(record.customer.email ? { replyTo: record.customer.email } : {}),
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      log(`[quote] acceptatie van ${id} gemeld aan ${notify} (${result.status})`);
    } catch (error) {
      // Een mislukte mail mag de acceptatie niet ongedaan maken: de klant
      // heeft ja gezegd en dat staat in de offerte.
      log(`[quote] acceptatiemail van ${id} mislukt: ${String(error)}`);
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      quote: {
        id: updated.id,
        status: updated.status,
        ...(updated.acceptedAt ? { acceptedAt: updated.acceptedAt } : {}),
      },
    },
  };
}

export type { QuoteRecord };
