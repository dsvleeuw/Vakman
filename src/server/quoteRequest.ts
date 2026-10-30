import { isPlanId } from '../data/plans';
import { SECTORS, STYLES } from '../data/tradesData';
import type { PaymentDetails, SectorId, StoredLead } from '../types';
import { createRateLimiter } from '../utils/lead';
import { buildOfferRequestEmail, createLeadReference } from '../utils/leadEmail';
import {
  buildQuotePath,
  buildQuoteRecord,
  formatQuoteNumber,
  sanitizeAddonIds,
  toPublicQuote,
  type PublicQuote,
} from '../utils/quote';
import { accountFromSession } from './accountHandler';
import type { AccountMail } from './accountMailer';
import { renderQuotePdf } from './quotePdf';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import { createToken } from './tokens';

/**
 * The customer asks for an offer himself, in his own site editor (phase 7.13).
 *
 * Until now an offer only came into existence in the wizard or when Klusbaas
 * wrote one by hand. A craftsman who built his own site had no way to ask
 * for a price, while `/mijn-account` promised him one. This module closes
 * that gap: the customer asks, the request is stored, and he gets a real
 * offer (number, PDF, price, status, way to pay) in his own account.
 *
 * Nothing is written by hand and nothing is invented: the price comes from
 * `data/plans.ts` and `data/addons.ts`, and the details come from the
 * customer's own site and account.
 */

export const OFFER_REQUEST_TYPE = 'offerte-aanvraag';

export const DEFAULT_NOTIFY_EMAIL = 'thomascliphero@gmail.com';

/** Five offers per hour per customer: enough to compare, not enough to spam. */
const defaultLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

export interface QuoteRequestDeps {
  /** The customer accounts, to find out who is logged in. */
  accounts: AccountStorage;
  /** Where the offers and the requests are stored. */
  leads: LeadStorage;
  /** The published sites, for the details of the customer. */
  sites?: SiteStorage;
  /** Sends the mail. Without it the offer is still made. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, shown in the mail. */
  payment?: PaymentDetails;
  /** The origin for the links in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  /** Where the request goes. */
  notifyEmail?: string;
  log?: (message: string) => void;
  now?: () => Date;
  createToken?: () => string;
  allowRequest?: (key: string, now: number) => boolean;
}

export interface QuoteRequestBody {
  ok: boolean;
  /** The offer the customer asked for. */
  quote?: PublicQuote & { path: string };
  /** The reference of the stored request (`L-XXXXXX`). */
  reference?: string;
  error?: string;
  /** The field that needs attention, e.g. `plan` or `biz`. */
  field?: string;
  /** Something the customer should know, e.g. the mail to Klusbaas failed. */
  notice?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clip = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** The trade of the offer: from the customer's own site, else what he chose. */
const pickSector = (siteSector: string | undefined, chosen: unknown): SectorId | null => {
  if (siteSector && Object.prototype.hasOwnProperty.call(SECTORS, siteSector)) {
    return siteSector as SectorId;
  }
  if (typeof chosen === 'string' && Object.prototype.hasOwnProperty.call(SECTORS, chosen)) {
    return chosen as SectorId;
  }
  return null;
};

/** The style of the offer: the name, like on the offer. */
const pickStyle = (siteStyle: string | undefined, chosen: unknown): string => {
  const fromSite = STYLES.find((style) => style.id === siteStyle);
  if (fromSite) return fromSite.name;
  if (typeof chosen === 'string') {
    const match = STYLES.find((style) => style.id === chosen || style.name === chosen);
    if (match) return match.name;
  }
  return STYLES[0]?.name ?? 'Vakwerk';
};

/** The services on the offer: the customer's own, from his site or his editor. */
const pickServices = (
  site: { services?: { n: string }[] } | null | undefined,
  chosen: unknown
): string[] => {
  if (site?.services?.length) {
    return site.services.map((offer) => clip(offer.n, 120)).filter(Boolean).slice(0, 30);
  }
  if (Array.isArray(chosen)) {
    return chosen
      .map((service) => clip(service, 120))
      .filter(Boolean)
      .slice(0, 30);
  }
  return [];
};

/**
 * The published site of the customer, but only when it really is his. A slug
 * from the browser is never trusted for anything but the lookup.
 */
async function resolveOwnSite(
  slug: unknown,
  accountId: string,
  deps: QuoteRequestDeps
): Promise<Awaited<ReturnType<SiteStorage['getSite']>>> {
  const name = clip(slug, 80);
  if (!name || !deps.sites) return null;
  try {
    const site = await deps.sites.getSite(name);
    if (!site) return null;
    return site.ownerId === accountId ? site : null;
  } catch (error) {
    deps.log?.(
      `[offer-request] site ${name} niet op te zoeken: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

/**
 * `POST /api/quote/request`: the customer asks for an offer in his editor.
 *
 * The session cookie says who is asking; the body says what he wants. The
 * answer is a real offer with a number, a PDF and a price, plus the request
 * that Klusbaas sees in his overview.
 */
export async function handleQuoteRequest(
  raw: unknown,
  deps: QuoteRequestDeps,
  cookieHeader?: string | null
): Promise<{ status: number; body: QuoteRequestBody }> {
  const log = deps.log ?? (() => {});
  const now = deps.now ? deps.now() : new Date();
  const nowMs = now.getTime();

  try {
    const account = await accountFromSession(cookieHeader, {
      accounts: deps.accounts,
      now: () => nowMs,
    });
    if (!account) {
      return {
        status: 401,
        body: {
          ok: false,
          error: 'Log in om een offerte aan te vragen. Dan staat hij in je account.',
          field: 'login',
        },
      };
    }

    const allow = deps.allowRequest ?? defaultLimiter;
    if (!allow(`offer-request-${account.id}`, nowMs)) {
      return {
        status: 429,
        body: {
          ok: false,
          error: 'Je hebt al een paar offertes aangevraagd. Wacht even of mail ons even.',
        },
      };
    }

    const body = isRecord(raw) ? raw : {};
    const plan = clip(body.plan, 40);
    if (!isPlanId(plan)) {
      return { status: 400, body: { ok: false, error: 'Kies een pakket.', field: 'plan' } };
    }
    const addons = sanitizeAddonIds(body.addons);
    const message = clip(body.message, 1000);

    // The details of the customer: what he typed in the editor, and what his
    // own published site says.
    const site = await resolveOwnSite(body.siteSlug, account.id, deps);
    const form = isRecord(body.form) ? body.form : {};
    const biz = clip(form.biz, 120) || clip(site?.form.biz, 120);
    const owner = clip(form.owner, 120) || clip(site?.form.owner, 120);
    const phone = clip(form.phone, 40) || clip(site?.form.phone, 40);
    const city = clip(form.city, 80) || clip(site?.form.city, 80);
    if (!biz) {
      return {
        status: 400,
        body: { ok: false, error: 'Vul je bedrijfsnaam in bij Gegevens.', field: 'biz' },
      };
    }
    if (!owner) {
      return { status: 400, body: { ok: false, error: 'Vul je naam in bij Gegevens.', field: 'owner' } };
    }

    const sector = pickSector(site?.sector, body.sector);
    if (!sector) {
      return { status: 400, body: { ok: false, error: 'Kies een vak.', field: 'sector' } };
    }
    const styleName = pickStyle(site?.styleId, body.style);
    const services = pickServices(site, body.services);

    // The request is stored first: a request may never disappear, not even
    // when something goes wrong after it.
    const reference = createLeadReference();
    const request: StoredLead = {
      reference,
      createdAt: now.toISOString(),
      type: OFFER_REQUEST_TYPE,
      site: { biz, sector, style: styleName },
      fields: {
        name: owner,
        email: account.email,
        phone,
        city,
        biz,
        plan,
        addons: addons.join(','),
        ...(message ? { message } : {}),
        ...(site ? { siteSlug: site.slug } : {}),
      },
    };
    await deps.leads.saveLead(reference, request);
    log(`[offer-request] aanvraag ${reference} opgeslagen voor ${account.email}`);

    // The offer itself: a number, a price and a PDF, exactly like the wizard.
    const year = now.getUTCFullYear();
    const sequence = await deps.leads.nextQuoteSequence(year);
    const record = buildQuoteRecord({
      id: formatQuoteNumber(year, sequence),
      token: (deps.createToken ?? createToken)(),
      now: now.toISOString(),
      planId: plan,
      addons,
      customer: { biz, owner, phone, city, email: account.email },
      sector,
      sectorName: SECTORS[sector].name,
      styleName,
      services,
      channel: 'E-mail',
      accountId: account.id,
      leadReference: reference,
    });

    const siteUrl = (deps.siteUrl ?? 'https://klusbaas.nl').replace(/\/$/, '');
    const pdf = await renderQuotePdf(record, {
      siteUrl,
      ...(deps.payment ? { payment: deps.payment } : {}),
    });
    const saved = await deps.leads.saveQuote(record, pdf);
    log(`[offer-request] offerte ${record.id} opgeslagen: ${saved.json} + ${saved.pdf}`);

    const path = buildQuotePath(record.id, record.token);
    const quoteUrl = `${siteUrl}${path}`;
    const accountUrl = `${siteUrl}/mijn-account`;
    const notify = deps.notifyEmail?.trim() || DEFAULT_NOTIFY_EMAIL;
    const attachment = {
      filename: `Offerte-${record.id}.pdf`,
      content: pdf,
      contentType: 'application/pdf',
    };

    let teamStatus = 'geen mailer';
    let customerStatus = 'geen mailer';
    if (deps.sendMail) {
      const team = buildOfferRequestEmail(record, 'team', { quoteUrl, message });
      teamStatus = await deps.sendMail({
        to: notify,
        subject: team.subject,
        text: team.text,
        html: team.html,
        attachments: [attachment],
        replyTo: account.email,
      });
      log(`[offer-request] melding naar ${notify} (${teamStatus})`);

      const customer = buildOfferRequestEmail(record, 'customer', {
        quoteUrl,
        accountUrl,
        message,
        ...(deps.payment ? { payment: deps.payment } : {}),
      });
      customerStatus = await deps.sendMail({
        to: account.email,
        subject: customer.subject,
        text: customer.text,
        html: customer.html,
        attachments: [attachment],
        replyTo: notify,
      });
      log(`[offer-request] offerte naar de klant (${customerStatus})`);
    }

    // The offer is stored and the customer sees it in his account, also when
    // the mail to Klusbaas did not arrive.
    const notice =
      teamStatus === 'failed'
        ? 'Je offerte staat klaar in je account, maar onze melding is niet aangekomen. Je vindt hem hier terug.'
        : undefined;

    return {
      status: 200,
      body: {
        ok: true,
        quote: { ...toPublicQuote(record), path },
        reference,
        ...(notice ? { notice } : {}),
      },
    };
  } catch (error) {
    log(
      `[offer-request] fout: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
    );
    return {
      status: 500,
      body: {
        ok: false,
        error: 'Er ging iets mis aan onze kant. Probeer het nog eens, of mail ons even.',
      },
    };
  }
}
