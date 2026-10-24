import { checkSpam, createLeadReference, leadContact, parseLeadRequest, type Lead } from '../utils/lead';
import { buildLeadCustomerEmail, buildLeadTeamEmail } from '../utils/leadEmail';
import { quoteDelivery, quoteViewPath, type QuoteDelivery, type QuoteDocument } from '../utils/quote';
import { buildQuoteEmail } from '../utils/quoteEmail';
import { createRateLimiter, type RateLimiter } from '../utils/rateLimit';
import { notifyAddress, sendMail, type FetchLike, type MailAttachment, type MailEnv } from './mail';
import { createQuote } from './quotes';
import type { JsonStore } from './store';

/**
 * POST /api/lead, shared by the Netlify Function (`netlify/functions/lead.mts`)
 * and the Vite dev middleware so local development and production behave
 * the same. Order matters: validate, filter spam, save, mail us, then mail
 * the visitor. Only saving and our own mail can fail the request; a refused
 * customer mail (Resend test mode) is logged and reported, never fatal.
 */

export type LeadEnv = MailEnv;

export interface LeadDeps {
  env: LeadEnv;
  leads: JsonStore;
  /** Numbered quotes and their PDFs (Netlify Blobs store `quotes`). */
  quotes: JsonStore;
  /** Public origin for links in mails, e.g. https://klusbaas.netlify.app. */
  siteUrl?: string;
  fetchImpl?: FetchLike;
  log?: (message: string) => void;
  now?: () => number;
  /** Client identifier for the rate limit, usually the IP address. */
  clientKey?: string;
  rateLimiter?: RateLimiter;
}

export interface LeadResult {
  status: number;
  body: {
    ok: boolean;
    mode?: 'sent' | 'preview';
    reference?: string;
    quote?: QuoteDocument;
    /** Relative link to the online quote (/offerte/:id?token=…). */
    quoteUrl?: string;
    /** How the quote reaches the customer, from the wizard channel choice. */
    delivery?: QuoteDelivery;
    customerEmailSent?: boolean;
    error?: string;
  };
}

/** Five submissions per ten minutes per IP, per function instance. */
const defaultRateLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export interface StoredLead {
  reference: string;
  receivedAt: string;
  lead: Lead;
  teamEmailSent: boolean;
  customerEmailSent: boolean;
}

export async function handleLead(body: unknown, deps: LeadDeps): Promise<LeadResult> {
  const log = deps.log ?? console.log;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = (deps.now ?? Date.now)();

  const parsed = parseLeadRequest(body);
  if (!parsed.ok) return { status: 400, body: { ok: false, error: parsed.error } };
  const { lead } = parsed;

  const spam = checkSpam(body, now);
  if (spam !== 'ok') {
    // Pretend success so bots learn nothing; nothing is saved or sent.
    log(`[lead] spam genegeerd (${spam})`);
    return { status: 200, body: { ok: true, mode: 'sent', reference: createLeadReference() } };
  }

  if (!(deps.rateLimiter ?? defaultRateLimiter).allow(deps.clientKey ?? 'onbekend', now)) {
    return {
      status: 429,
      body: { ok: false, error: 'Te veel aanvragen achter elkaar. Probeer het over een paar minuten opnieuw of stuur ons een WhatsApp.' },
    };
  }

  let reference = createLeadReference();
  let quote: QuoteDocument | undefined;
  let quoteUrl: string | undefined;
  let attachments: MailAttachment[] | undefined;
  if (lead.kind === 'offerte') {
    try {
      const created = await createQuote(deps.quotes, lead.request, new Date(now));
      reference = created.record.number;
      quote = created.record.document;
      quoteUrl = quoteViewPath(created.record.number, created.record.token);
      attachments = [{ filename: created.filename, content: created.pdf }];
    } catch (error) {
      log(`[lead] offerte opslaan mislukt: ${error instanceof Error ? error.message : String(error)}`);
      return { status: 500, body: { ok: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw of stuur ons een WhatsApp.' } };
    }
  }

  const record: StoredLead = {
    reference,
    receivedAt: new Date(now).toISOString(),
    lead,
    teamEmailSent: false,
    customerEmailSent: false,
  };
  try {
    await deps.leads.set(reference, record, { onlyIfNew: true });
  } catch (error) {
    log(`[lead] opslaan mislukt ${reference}: ${error instanceof Error ? error.message : String(error)}`);
    return { status: 500, body: { ok: false, error: 'Opslaan is niet gelukt. Probeer het opnieuw of stuur ons een WhatsApp.' } };
  }

  const contact = leadContact(lead);
  const viewUrl = quoteUrl && deps.siteUrl ? `${deps.siteUrl.replace(/\/$/, '')}${quoteUrl}` : undefined;
  let teamMail;
  let customerMail;
  if (lead.kind === 'offerte' && quote) {
    teamMail = buildQuoteEmail(quote, lead.request, 'team', viewUrl);
    customerMail =
      contact.email && quoteDelivery(lead.request.channel).email
        ? buildQuoteEmail(quote, lead.request, 'customer', viewUrl)
        : null;
  } else if (lead.kind !== 'offerte') {
    teamMail = buildLeadTeamEmail(lead, reference);
    customerMail = contact.email ? buildLeadCustomerEmail(lead, reference) : null;
  } else {
    throw new Error('unreachable');
  }

  const notify = notifyAddress(deps.env);
  const team = await sendMail({ to: notify, replyTo: contact.email, attachments, ...teamMail }, deps.env, fetchImpl, log);
  record.teamEmailSent = team.ok;
  if (!team.ok) {
    await deps.leads.set(reference, record).catch(() => undefined);
    return {
      status: 502,
      body: { ok: false, reference, error: 'Versturen is niet gelukt. Probeer het opnieuw of stuur ons een WhatsApp.' },
    };
  }

  let customerEmailSent = false;
  if (customerMail && contact.email) {
    const customer = await sendMail(
      { to: contact.email, replyTo: notify, attachments, ...customerMail },
      deps.env,
      fetchImpl,
      log
    );
    customerEmailSent = customer.ok && !customer.preview;
  }
  record.customerEmailSent = customerEmailSent;
  await deps.leads.set(reference, record).catch(() => undefined);

  return {
    status: 200,
    body: {
      ok: true,
      mode: team.preview ? 'preview' : 'sent',
      reference,
      ...(quote && lead.kind === 'offerte' ? { quote, quoteUrl, delivery: quoteDelivery(lead.request.channel) } : {}),
      customerEmailSent,
    },
  };
}
