import { randomBytes, timingSafeEqual } from 'node:crypto';
import { SECTORS, STYLES } from '../data/tradesData';
import { buildWhatsAppUrl } from '../utils/contact';
import { createRateLimiter, parseLead, type QuoteLeadRequest, type SiteLead } from '../utils/lead';
import { buildQuoteEmail, buildSiteLeadEmail, createLeadReference } from '../utils/leadEmail';
import {
  buildQuotePath,
  buildQuoteRecord,
  formatQuoteNumber,
  isQuoteNumber,
  quoteDelivery,
  toPublicQuote,
  type PublicQuote,
} from '../utils/quote';
import { redirectForTest, sendViaResend, type DeliveryResult, type FetchLike, type OutgoingMail } from './mailer';
import { renderQuotePdf } from './quotePdf';
import type { LeadStorage } from './storage';

/**
 * `POST /api/lead` and `GET /api/quote`, shared by the Netlify Functions
 * (`netlify/functions/*.mts`) and the Vite dev middleware so local
 * development and production run the same code.
 */

export interface LeadEnv {
  /** Resend API key. Without it nothing is sent: preview mode logs the mails. */
  RESEND_API_KEY?: string;
  /** Sender; `onboarding@resend.dev` until klusbaas.nl is verified in Resend. */
  QUOTE_FROM_EMAIL?: string;
  /** Where every lead and quote is delivered. */
  QUOTE_NOTIFY_EMAIL?: string;
  /** Testing only: customer confirmations go here instead. Empty in production. */
  MAIL_TEST_RECIPIENT?: string;
}

export const DEFAULT_NOTIFY_EMAIL = 'thomascliphero@gmail.com';
export const DEFAULT_FROM_EMAIL = 'Klusbaas <onboarding@resend.dev>';

export interface LeadDeps {
  env: LeadEnv;
  storage: LeadStorage;
  /** Origin used in links inside e-mails, e.g. https://klusbaas.netlify.app */
  siteUrl: string;
  fetchImpl?: FetchLike;
  log?: (message: string) => void;
  now?: () => Date;
  createToken?: () => string;
  allowRequest?: (key: string, now: number) => boolean;
}

type PublicDelivery = Pick<DeliveryResult, 'to' | 'status'>;

export interface LeadResponseBody {
  ok: boolean;
  type?: string;
  mode?: 'sent' | 'preview';
  reference?: string;
  delivery?: { team: PublicDelivery; customer: PublicDelivery };
  quote?: PublicQuote & { path: string };
  error?: string;
  field?: string;
}

export interface HandlerResult<T> {
  status: number;
  body: T;
}

const defaultLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

/** 24 random bytes, URL-safe: unguessable link token for a quote. */
export function createQuoteToken(): string {
  return randomBytes(24).toString('base64url');
}

export function tokensMatch(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

const publicDelivery = (result: DeliveryResult): PublicDelivery => ({ to: result.to, status: result.status });

async function deliver(
  mail: OutgoingMail,
  env: LeadEnv,
  fetchImpl: FetchLike | undefined,
  log: (message: string) => void,
  tag: string
): Promise<DeliveryResult> {
  if (!env.RESEND_API_KEY) {
    log(
      `[lead] PREVIEW ${tag} -> ${mail.to}\nOnderwerp: ${mail.subject}` +
        (mail.attachments?.length ? `\nBijlage: ${mail.attachments.map((a) => a.filename).join(', ')}` : '') +
        `\n${mail.text}\n`
    );
    return { to: mail.to, status: 'preview' };
  }
  const result = await sendViaResend(env.RESEND_API_KEY, mail, fetchImpl);
  if (result.status === 'failed') log(`[lead] mail ${tag} -> ${mail.to} mislukt: ${result.detail}`);
  return result;
}

async function handleQuote(
  request: QuoteLeadRequest,
  deps: LeadDeps,
  from: string,
  notify: string,
  log: (message: string) => void
): Promise<HandlerResult<LeadResponseBody>> {
  const now = (deps.now ?? (() => new Date()))();
  const year = now.getUTCFullYear();
  const sequence = await deps.storage.nextQuoteSequence(year);
  const record = buildQuoteRecord({
    id: formatQuoteNumber(year, sequence),
    token: (deps.createToken ?? createQuoteToken)(),
    now: now.toISOString(),
    planId: request.plan,
    addons: request.addons,
    customer: {
      biz: request.form.biz,
      owner: request.form.owner,
      phone: request.form.phone,
      city: request.form.city,
      ...(request.form.email ? { email: request.form.email } : {}),
    },
    sector: request.sector,
    sectorName: SECTORS[request.sector].name,
    styleName: STYLES[request.styleIndex].name,
    services: request.services,
    channel: request.channel,
    ...(request.appointment ? { appointment: request.appointment } : {}),
  });

  const pdf = await renderQuotePdf(record, { siteUrl: deps.siteUrl });
  const saved = await deps.storage.saveQuote(record, pdf);
  log(`[lead] offerte ${record.id} opgeslagen: ${saved.json} + ${saved.pdf}`);

  const path = buildQuotePath(record.id, record.token);
  const quoteUrl = `${deps.siteUrl.replace(/\/$/, '')}${path}`;
  const delivery = quoteDelivery(record.channel);
  const whatsappUrl = delivery.whatsapp
    ? buildWhatsAppUrl(
        record.customer.phone,
        `Hoi ${record.customer.owner.split(' ')[0]}, hier is je offerte ${record.id} van Klusbaas: ${quoteUrl}`
      )
    : undefined;
  const attachment = { filename: `Offerte-${record.id}.pdf`, content: pdf, contentType: 'application/pdf' };

  const teamMail = buildQuoteEmail(record, 'team', { quoteUrl, whatsappUrl });
  const team = await deliver(
    { from, to: notify, replyTo: record.customer.email, ...teamMail, attachments: [attachment] },
    deps.env,
    deps.fetchImpl,
    log,
    `team ${record.id}`
  );

  let customer: DeliveryResult = { to: record.customer.email ?? record.customer.phone, status: 'skipped' };
  if (delivery.email && record.customer.email) {
    const customerMail = buildQuoteEmail(record, 'customer', { quoteUrl });
    customer = await deliver(
      redirectForTest(
        { from, to: record.customer.email, replyTo: notify, ...customerMail, attachments: [attachment] },
        deps.env.MAIL_TEST_RECIPIENT
      ),
      deps.env,
      deps.fetchImpl,
      log,
      `klant ${record.id}`
    );
  }

  const body: LeadResponseBody = {
    ok: team.status !== 'failed',
    type: 'quote',
    mode: deps.env.RESEND_API_KEY ? 'sent' : 'preview',
    reference: record.id,
    delivery: { team: publicDelivery(team), customer: publicDelivery(customer) },
    quote: { ...toPublicQuote(record), path },
  };
  if (team.status === 'failed') {
    return {
      status: 502,
      body: { ...body, error: 'Je offerte is opgeslagen, maar de melding aan ons is niet verstuurd. Stuur ons een WhatsApp, dan pakken we hem direct op.' },
    };
  }
  return { status: 200, body };
}

async function handleSiteLead(
  lead: SiteLead,
  deps: LeadDeps,
  from: string,
  notify: string,
  log: (message: string) => void
): Promise<HandlerResult<LeadResponseBody>> {
  const reference = createLeadReference();
  const createdAt = (deps.now ?? (() => new Date()))().toISOString();
  const saved = await deps.storage.saveLead(reference, { reference, createdAt, ...lead });
  log(`[lead] ${lead.type} ${reference} opgeslagen: ${saved}`);

  const team = await deliver(
    { from, to: notify, replyTo: lead.fields.email, ...buildSiteLeadEmail(lead, 'team', reference, deps.siteUrl) },
    deps.env,
    deps.fetchImpl,
    log,
    `team ${reference}`
  );
  let customer: DeliveryResult = { to: lead.fields.email ?? lead.fields.phone ?? '', status: 'skipped' };
  if (lead.fields.email) {
    customer = await deliver(
      redirectForTest(
        { from, to: lead.fields.email, replyTo: notify, ...buildSiteLeadEmail(lead, 'customer', reference, deps.siteUrl) },
        deps.env.MAIL_TEST_RECIPIENT
      ),
      deps.env,
      deps.fetchImpl,
      log,
      `klant ${reference}`
    );
  }
  const body: LeadResponseBody = {
    ok: team.status !== 'failed',
    type: lead.type,
    mode: deps.env.RESEND_API_KEY ? 'sent' : 'preview',
    reference,
    delivery: { team: publicDelivery(team), customer: publicDelivery(customer) },
  };
  if (team.status === 'failed') {
    return { status: 502, body: { ...body, error: 'Versturen is niet gelukt. Stuur je bericht via WhatsApp.' } };
  }
  return { status: 200, body };
}

export async function handleLead(
  body: unknown,
  clientKey: string,
  deps: LeadDeps
): Promise<HandlerResult<LeadResponseBody>> {
  const log = deps.log ?? console.log;
  const nowMs = (deps.now ?? (() => new Date()))().getTime();
  const allow = deps.allowRequest ?? defaultLimiter;
  if (!allow(clientKey || 'onbekend', nowMs)) {
    return { status: 429, body: { ok: false, error: 'Te veel aanvragen achter elkaar. Probeer het over een paar minuten opnieuw.' } };
  }

  const parsed = parseLead(body, nowMs);
  if (parsed.kind === 'invalid') {
    return { status: 400, body: { ok: false, error: parsed.error, ...(parsed.field ? { field: parsed.field } : {}) } };
  }
  if (parsed.kind === 'spam') {
    log(`[lead] genegeerd (${parsed.reason}) van ${clientKey}`);
    // Pretend success so bots learn nothing; nothing is stored or mailed.
    return { status: 200, body: { ok: true, mode: 'sent', reference: createLeadReference() } };
  }

  const notify = deps.env.QUOTE_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;
  const from = deps.env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  try {
    return parsed.kind === 'quote'
      ? await handleQuote(parsed.request, deps, from, notify, log)
      : await handleSiteLead(parsed.lead, deps, from, notify, log);
  } catch (error) {
    log(`[lead] fout: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    return { status: 500, body: { ok: false, error: 'Er ging iets mis aan onze kant. Stuur je aanvraag via WhatsApp.' } };
  }
}

export type QuoteLookup =
  | { status: 200; kind: 'json'; body: PublicQuote }
  | { status: 200; kind: 'pdf'; filename: string; pdf: Uint8Array }
  | { status: 400 | 403 | 404; kind: 'json'; body: { ok: false; error: string } };

/** `GET /api/quote?id=KB-2026-0001&token=…[&format=pdf]` */
export async function handleGetQuote(
  params: URLSearchParams,
  storage: LeadStorage
): Promise<QuoteLookup> {
  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';
  if (!isQuoteNumber(id) || !token) {
    return { status: 400, kind: 'json', body: { ok: false, error: 'Ongeldige offertelink.' } };
  }
  const record = await storage.getQuote(id);
  if (!record) return { status: 404, kind: 'json', body: { ok: false, error: 'Offerte niet gevonden.' } };
  if (!tokensMatch(record.token, token)) {
    return { status: 403, kind: 'json', body: { ok: false, error: 'Deze offertelink is niet geldig.' } };
  }
  if (params.get('format') === 'pdf') {
    const pdf = (await storage.getQuotePdf(id)) ?? (await renderQuotePdf(record));
    return { status: 200, kind: 'pdf', filename: `Offerte-${id}.pdf`, pdf };
  }
  return { status: 200, kind: 'json', body: toPublicQuote(record) };
}

/** Turn a `handleGetQuote` result into a Fetch API response. */
export function quoteLookupResponse(result: QuoteLookup): Response {
  if (result.kind === 'pdf') {
    return new Response(new Uint8Array(result.pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${result.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }
  return Response.json(result.body, {
    status: result.status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' },
  });
}
