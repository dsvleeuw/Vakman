import { SECTORS, STYLES } from '../data/tradesData';
import { buildWhatsAppUrl, isValidEmail } from '../utils/contact';
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
import type { LeadStorage, SiteStorage } from './storage';

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
  /**
   * Where published customer sites live. With it, a lead from a published
   * site (`/site/<slug>`) goes to the owner of that site instead of to
   * Klusbaas. Without it every lead goes to Klusbaas.
   */
  sites?: SiteStorage;
  /**
   * The account of the visitor, when he was logged in. An offer requested
   * while logged in lands in his account, so he can pay it there.
   */
  accountId?: string;
  /** Origin used in links inside e-mails, e.g. https://klusbaas.netlify.app */
  siteUrl: string;
  fetchImpl?: FetchLike;
  log?: (message: string) => void;
  now?: () => Date;
  createToken?: () => string;
  allowRequest?: (key: string, now: number) => boolean;
}

type PublicDelivery = Pick<DeliveryResult, 'to' | 'status'>;
type DeliveryStatus = DeliveryResult['status'];

export interface LeadResponseBody {
  ok: boolean;
  type?: string;
  mode?: 'sent' | 'preview';
  reference?: string;
  delivery?: {
    team: PublicDelivery;
    customer: PublicDelivery;
    /**
     * The owner of the published site the lead was sent to. No address: the
     * visitor has no use for the craftsman's e-mail address.
     */
    owner?: { status: DeliveryStatus };
  };
  quote?: PublicQuote & { path: string };
  error?: string;
  field?: string;
}

export interface HandlerResult<T> {
  status: number;
  body: T;
}

const defaultLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

/**
 * 24 random bytes, URL-safe: unguessable link token for a quote.
 * The same pattern is used for published sites (`server/siteHandler.ts`).
 */
import { createToken as createQuoteToken, tokensMatch } from './tokens';

export { createQuoteToken, tokensMatch };

const publicDelivery = (result: DeliveryResult): PublicDelivery => ({ to: result.to, status: result.status });

const maskEmails = (value: string): string =>
  value.replace(/([A-Z0-9._%+-])[A-Z0-9._%+-]*@([A-Z0-9.-]+\.[A-Z]{2,})/gi, '$1***@$2');

const recipientDomain = (recipient: string): string => recipient.trim().split('@').at(-1) ?? 'onbekend';

async function deliver(
  mail: OutgoingMail,
  env: LeadEnv,
  fetchImpl: FetchLike | undefined,
  log: (message: string) => void,
  tag: string
): Promise<DeliveryResult> {
  if (!env.RESEND_API_KEY) {
    log(
      `[lead] PREVIEW ${tag}\nOntvanger-domein: ${recipientDomain(mail.to)}\nOnderwerp: ${maskEmails(mail.subject)}` +
        (mail.attachments?.length ? `\nBijlagen: ${mail.attachments.map((a) => a.filename).join(', ')}` : '')
    );
    return { to: mail.to, status: 'preview' };
  }
  const result = await sendViaResend(env.RESEND_API_KEY, mail, fetchImpl);
  if (result.status === 'failed') {
    log(`[lead] mail ${tag} naar domein ${recipientDomain(mail.to)} mislukt: ${maskEmails(result.detail ?? 'onbekende fout')}`);
  }
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
    ...(deps.accountId ? { accountId: deps.accountId } : {}),
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

/**
 * The owner of the published site the visitor is on. A lead from a published
 * site belongs to that craftsman: it goes to him, not to Klusbaas.
 *
 * The slug in the request is never trusted for anything but the lookup: the
 * address that receives the lead comes from the stored site, never from the
 * request itself.
 */
async function resolveSiteOwner(
  lead: SiteLead,
  deps: LeadDeps
): Promise<{ email: string; biz: string; ownerFirstName: string } | null> {
  const slug = lead.site.slug;
  if (!slug || !deps.sites) return null;
  let record: Awaited<ReturnType<SiteStorage['getSite']>> = null;
  try {
    record = await deps.sites.getSite(slug);
  } catch (error) {
    // Lukt het opzoeken niet, dan gaat de aanvraag naar Klusbaas in plaats
    // van verloren te gaan.
    deps.log?.(
      `[lead] site ${slug} niet op te zoeken: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
  if (!record) return null;
  const email = record.form.email?.trim() ?? '';
  if (!email || !isValidEmail(email)) return null;
  const owner = record.form.owner?.trim() ?? '';
  return {
    email,
    biz: record.form.biz?.trim() || lead.site.biz,
    ownerFirstName: owner ? (owner.split(' ')[0] ?? '') : '',
  };
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
  const owner = await resolveSiteOwner(lead, deps);

  // Aanvraag op een gepubliceerde klantsite: de vakman is de ontvanger.
  if (owner) {
    const ownerLead: SiteLead = { ...lead, site: { ...lead.site, biz: owner.biz } };
    const ownerMail = buildSiteLeadEmail(ownerLead, 'owner', reference, deps.siteUrl, {
      ownerFirstName: owner.ownerFirstName,
    });
    const delivered = await deliver(
      { from, to: owner.email, replyTo: lead.fields.email, ...ownerMail },
      deps.env,
      deps.fetchImpl,
      log,
      `eigenaar ${reference}`
    );
    // De aanvraag wordt altijd bewaard, in naam van de vakman: zo kan hij
    // hem in zijn account terugzien, ook als de mail niet aankomt.
    const saved = await deps.storage.saveLead(reference, { reference, createdAt, ...lead });
    log(`[lead] ${lead.type} ${reference} opgeslagen: ${saved}`);
    if (delivered.status === 'sent') {
      log(`[lead] ${lead.type} ${reference} naar de eigenaar van ${owner.biz}`);
      return {
        status: 200,
        body: {
          ok: true,
          type: lead.type,
          mode: 'sent',
          reference,
          delivery: {
            team: { to: notify, status: 'skipped' },
            customer: { to: '', status: 'skipped' },
            owner: { status: delivered.status },
          },
        },
      };
    }
    // De mail naar de vakman lukte niet (of draait in testmodus): het team
    // mailt hem, zodat de aanvraag niet verloren gaat.
    const teamMail = buildSiteLeadEmail(lead, 'team', reference, deps.siteUrl);
    const team = await deliver(
      { from, to: notify, replyTo: lead.fields.email, ...teamMail },
      deps.env,
      deps.fetchImpl,
      log,
      `team ${reference}`
    );
    return {
      status: 200,
      body: {
        ok: true,
        type: lead.type,
        mode: deps.env.RESEND_API_KEY ? 'sent' : 'preview',
        reference,
        delivery: {
          team: publicDelivery(team),
          customer: { to: '', status: 'skipped' },
          owner: { status: delivered.status },
        },
      },
    };
  }

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
