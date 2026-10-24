import { checkSpam, createLeadReference, leadContact, parseLeadRequest, type Lead } from '../utils/lead';
import { buildLeadCustomerEmail, buildLeadTeamEmail } from '../utils/leadEmail';
import { buildQuote, type Quote } from '../utils/quote';
import { buildQuoteEmail, createQuoteReference } from '../utils/quoteEmail';
import { createRateLimiter, type RateLimiter } from '../utils/rateLimit';
import { notifyAddress, sendMail, type FetchLike, type MailEnv } from './mail';
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
    quote?: Quote;
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

  const reference = lead.kind === 'offerte' ? createQuoteReference() : createLeadReference();
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
  let quote: Quote | undefined;
  let teamMail;
  let customerMail;
  if (lead.kind === 'offerte') {
    quote = buildQuote(lead.request.plan, lead.request.addons);
    teamMail = buildQuoteEmail(quote, lead.request, 'team', reference);
    customerMail = contact.email ? buildQuoteEmail(quote, lead.request, 'customer', reference) : null;
  } else {
    teamMail = buildLeadTeamEmail(lead, reference);
    customerMail = contact.email ? buildLeadCustomerEmail(lead, reference) : null;
  }

  const notify = notifyAddress(deps.env);
  const team = await sendMail({ to: notify, replyTo: contact.email, ...teamMail }, deps.env, fetchImpl, log);
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
    const customer = await sendMail({ to: contact.email, replyTo: notify, ...customerMail }, deps.env, fetchImpl, log);
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
      ...(quote ? { quote } : {}),
      customerEmailSent,
    },
  };
}
