import { SECTORS, STYLES } from '../data/tradesData';
import { isPlanId } from '../data/plans';
import type { AdminCreatedQuote, PaymentDetails } from '../types';
import { isValidEmail } from '../utils/contact';
import { buildOfferEmail } from '../utils/leadEmail';
import {
  buildQuotePath,
  buildQuoteRecord,
  formatQuoteNumber,
  sanitizeAddonIds,
  type QuoteRecord,
} from '../utils/quote';
import type { AccountMail } from './accountMailer';
import { renderQuotePdf } from './quotePdf';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import { createToken } from './tokens';

/**
 * An offer Klusbaas makes by hand for a customer (phase 7.2).
 *
 * Until now an offer only came into existence when a customer asked for one
 * in the wizard. A craftsman who makes his own account and publishes his own
 * site never gets an offer, and therefore no order and no invoice. This
 * module lets Klusbaas write that offer: it becomes a real quote record with
 * a PDF, it lands in the customer's account, and the customer receives it by
 * mail.
 */

export interface OfferRequest {
  /** Where the offer goes. Required: an offer nobody receives is no offer. */
  email?: string;
  /** The customer account the offer belongs to, so he sees it in his account. */
  accountId?: string;
  /** The published site of the customer: his details come from it. */
  siteSlug?: string;
  /** The package: `basis`, `pro` or `premium`. */
  plan?: string;
  /** The extra components, e.g. `['trust-bar']`. */
  addons?: unknown;
  /** The trade, when there is no site to take it from. */
  sector?: string;
  /** The style, when there is no site to take it from. */
  style?: string;
  /** The services on the website, when there is no site to take them from. */
  services?: unknown;
  /** The customer details; filled from the site when it is left empty. */
  biz?: string;
  owner?: string;
  phone?: string;
  city?: string;
  /** Set to false to save the offer without mailing it. */
  send?: boolean;
}

export interface OfferDeps {
  /** Where the offers live. */
  leads: LeadStorage;
  /** The published sites, for the customer details. */
  sites: SiteStorage;
  /** The customer accounts, to link the offer to one. */
  accounts?: AccountStorage;
  /** Sends the mail with the offer. Without it the offer is still made. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, shown in the mail. */
  payment?: PaymentDetails;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  now?: () => number;
  createToken?: () => string;
  log?: (message: string) => void;
}

export interface OfferResult {
  ok: boolean;
  quote?: AdminCreatedQuote;
  error?: string;
  field?: string;
}

const clip = (value: unknown, max = 160): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const styleName = (styleId: string): string =>
  STYLES.find((style) => style.id === styleId)?.name ?? 'Vakwerk';

/** The trade of the offer: from the site when he has one, else what was chosen. */
const pickSector = (siteSector: string | undefined, chosen: string | undefined) => {
  if (siteSector && Object.prototype.hasOwnProperty.call(SECTORS, siteSector)) {
    return siteSector as keyof typeof SECTORS;
  }
  if (chosen && Object.prototype.hasOwnProperty.call(SECTORS, chosen)) {
    return chosen as keyof typeof SECTORS;
  }
  return null;
};

/**
 * Write the offer: a quote record with a PDF, linked to the customer's
 * account and mailed to him.
 */
export async function createOfferForCustomer(
  request: OfferRequest,
  deps: OfferDeps
): Promise<OfferResult> {
  const log = deps.log ?? (() => {});
  const email = clip(request.email).toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: 'Vul een geldig e-mailadres in.', field: 'email' };
  }
  if (!isPlanId(request.plan ?? null)) {
    return { ok: false, error: 'Kies een pakket.', field: 'plan' };
  }

  // The customer: from his published site when he has one, otherwise from
  // what the overview filled in.
  const sites = await deps.sites.listSites();
  const site = request.siteSlug
    ? sites.find((record) => record.slug === request.siteSlug)
    : undefined;
  // Het account komt van de klant zelf (als die er is) of van de site die
  // hij publishede: die site hoort aan zijn account.
  const accountId = request.accountId ?? site?.ownerId;
  const account = accountId && deps.accounts
    ? await deps.accounts.getAccount(accountId)
    : undefined;

  const accountEmail = account?.email?.trim().toLowerCase();
  if (accountEmail && accountEmail !== email) {
    return {
      ok: false,
      error: 'Dit e-mailadres hoort niet bij het gekozen account.',
      field: 'email',
    };
  }

  const biz = clip(request.biz) || clip(site?.form.biz);
  const owner = clip(request.owner) || clip(site?.form.owner);
  const phone = clip(request.phone, 40) || clip(site?.form.phone, 40);
  const city = clip(request.city, 80) || clip(site?.form.city, 80);
  if (!biz) {
    return { ok: false, error: 'Vul de bedrijfsnaam in.', field: 'biz' };
  }
  if (!owner) {
    return { ok: false, error: 'Vul de naam van de contactpersoon in.', field: 'owner' };
  }

  const sector = pickSector(site?.sector, request.sector);
  if (!sector) {
    return { ok: false, error: 'Kies een vak.', field: 'sector' };
  }
  const style = site
    ? styleName(site.styleId)
    : request.style && STYLES.some((entry) => entry.id === request.style)
      ? styleName(request.style)
      : styleName('klassiek');

  const services = Array.isArray(request.services)
    ? request.services
        .map((service) => clip(service, 120))
        .filter(Boolean)
        .slice(0, 30)
    : site?.services?.map((offer) => offer.n).filter(Boolean) ?? [];

  const now = deps.now ? deps.now() : Date.now();
  const year = new Date(now).getUTCFullYear();
  const sequence = await deps.leads.nextQuoteSequence(year);
  const token = (deps.createToken ?? createToken)();
  const record: QuoteRecord = buildQuoteRecord({
    id: formatQuoteNumber(year, sequence),
    token,
    now: new Date(now).toISOString(),
    planId: request.plan,
    addons: sanitizeAddonIds(request.addons),
    customer: { biz, owner, phone, city, email },
    sector,
    sectorName: SECTORS[sector].name,
    styleName: style,
    services,
    channel: 'E-mail',
    ...(account ? { accountId: account.id } : {}),
  });

  const siteUrl = deps.siteUrl ?? 'https://klusbaas.nl';
  const pdf = await renderQuotePdf(record, { siteUrl });
  await deps.leads.saveQuote(record, pdf);
  log(`[admin] offerte ${record.id} aangemaakt voor ${email}`);

  let mailStatus = 'geen mailer';
  if (request.send !== false && deps.sendMail) {
    const path = buildQuotePath(record.id, record.token);
    const quoteUrl = `${siteUrl.replace(/\/$/, '')}${path}`;
    const mail = buildOfferEmail(record, {
      quoteUrl,
      ...(deps.payment ? { payment: deps.payment } : {}),
    });
    mailStatus = await deps.sendMail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      attachments: [
        { filename: `Offerte-${record.id}.pdf`, content: pdf, contentType: 'application/pdf' },
      ],
    });
    log(`[admin] offerte ${record.id} verstuurd naar ${email} (${mailStatus})`);
  }

  return {
    ok: true,
    quote: {
      id: record.id,
      path: buildQuotePath(record.id, record.token),
      planName: record.planName,
      totalCents: record.totalCents,
      mailed: mailStatus === 'sent',
      mailStatus,
    },
  };
}
