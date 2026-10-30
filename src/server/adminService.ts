import type { Account, PaymentDetails, ServiceState } from '../types';
import type { AccountStorage, SiteStorage } from './storage';
import { SERVICE_AMOUNT_CENTS } from '../utils/service';
import {
  buildServiceActivatedEmail,
  buildServiceInvoiceEmail,
  buildServiceStoppedEmail,
  type ServiceSubject,
} from '../utils/serviceMail';
import type { AccountMail } from './accountMailer';

/**
 * The monthly service, seen from the overview of Klusbaas (phase 7.15).
 *
 * The customer asks for the service in his own account; Klusbaas switches
 * it on here and sends the monthly invoice. Everything the customer was
 * promised on the price list is here too: the price, the reference for the
 * transfer, and the fact that the site and the code stay his.
 */

export interface AdminServiceDeps {
  accounts: AccountStorage;
  sites: SiteStorage;
  /** Sends the mail to the customer. Without it the service still changes. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, shown in the mail. */
  payment?: PaymentDetails;
  /** The origin for the links in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  now?: () => number;
  log?: (message: string) => void;
}

export interface AdminServiceResult {
  ok: boolean;
  /** The service after the change. */
  service?: ServiceState;
  /** What happened with the mail to the customer. */
  mailStatus?: string;
  error?: string;
}

/** Who the service is about: the customer and his site. */
function subjectFor(
  account: Account,
  site: { slug: string; form: { biz: string; owner: string; city: string } } | undefined
): ServiceSubject {
  const owner = site?.form.owner?.trim() ?? '';
  const biz = site?.form.biz?.trim() ?? '';
  return {
    name: owner || account.email,
    biz: biz || owner || account.email,
    city: site?.form.city ?? '',
    siteSlug: site?.slug ?? '',
  };
}

/** The site of the account the service belongs to. */
async function siteFor(
  account: Account,
  service: ServiceState | undefined,
  deps: AdminServiceDeps
) {
  const sites = await deps.sites.listSites();
  const owned = sites.filter((site) => site.ownerId === account.id);
  if (service?.siteSlug) {
    const found = owned.find((site) => site.slug === service.siteSlug);
    if (found) return found;
  }
  return owned[0];
}

async function sendToCustomer(
  deps: AdminServiceDeps,
  account: Account,
  mail: { subject: string; text: string; html: string }
): Promise<string> {
  if (!deps.sendMail) return 'geen mailer';
  try {
    return await deps.sendMail({ to: account.email, ...mail });
  } catch (error) {
    deps.log?.(
      `[admin] service-mail mislukt: ${error instanceof Error ? error.message : String(error)}`
    );
    return 'mislukt';
  }
}

/**
 * Switch the service on for a customer.
 *
 * The amount is what the customer pays per month; `0` is used for the
 * months that come with a package. Klusbaas can also switch the service on
 * for a customer who never asked for it: the Pro package comes with three
 * months of service.
 */
export async function activateService(
  accountId: string,
  amountCents: number | undefined,
  deps: AdminServiceDeps
): Promise<AdminServiceResult> {
  const account = await deps.accounts.getAccount(accountId);
  if (!account) {
    return { ok: false, error: 'Dit account bestaat niet (meer).' };
  }
  const site = await siteFor(account, account.service, deps);
  if (!site) {
    return { ok: false, error: 'Deze klant heeft nog geen site. De service draait om zijn eigen site.' };
  }
  const now = deps.now ? deps.now() : Date.now();
  const service: ServiceState = {
    status: 'active',
    requestedAt: account.service?.requestedAt ?? new Date(now).toISOString(),
    activeSince: new Date(now).toISOString(),
    amountCents: typeof amountCents === 'number' && amountCents >= 0 ? amountCents : SERVICE_AMOUNT_CENTS,
    siteSlug: site.slug,
  };
  await deps.accounts.saveAccount({ ...account, service, updatedAt: now });
  const mail = buildServiceActivatedEmail(subjectFor(account, site), service, {
    ...(deps.payment ? { payment: deps.payment } : {}),
    ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
  });
  const mailStatus = await sendToCustomer(deps, account, mail);
  deps.log?.(`[admin] service aangezet voor ${account.email}: ${mailStatus}`);
  return { ok: true, service, mailStatus };
}

/** Stop the service of a customer: the site and the code go back to him. */
export async function stopService(
  accountId: string,
  deps: AdminServiceDeps
): Promise<AdminServiceResult> {
  const account = await deps.accounts.getAccount(accountId);
  if (!account) {
    return { ok: false, error: 'Dit account bestaat niet (meer).' };
  }
  if (!account.service || account.service.status === 'stopped') {
    return { ok: false, error: 'Deze klant heeft geen lopende service.' };
  }
  const now = deps.now ? deps.now() : Date.now();
  const service: ServiceState = {
    ...account.service,
    status: 'stopped',
    stoppedAt: new Date(now).toISOString(),
  };
  await deps.accounts.saveAccount({ ...account, service, updatedAt: now });
  const site = await siteFor(account, service, deps);
  const mail = buildServiceStoppedEmail(subjectFor(account, site), {
    ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
  });
  const mailStatus = await sendToCustomer(deps, account, mail);
  deps.log?.(`[admin] service gestopt voor ${account.email}: ${mailStatus}`);
  return { ok: true, service, mailStatus };
}

/**
 * Send the monthly invoice of the service.
 *
 * The invoice is a mail with the amount, the IBAN and the reference: the
 * same way the customer pays for a site. Klusbaas sends it every month
 * himself; the code does not send anything on its own.
 */
export async function sendServiceInvoice(
  accountId: string,
  deps: AdminServiceDeps
): Promise<AdminServiceResult> {
  const account = await deps.accounts.getAccount(accountId);
  if (!account) {
    return { ok: false, error: 'Dit account bestaat niet (meer).' };
  }
  const service = account.service;
  if (!service || service.status !== 'active') {
    return { ok: false, error: 'Deze klant heeft geen lopende service.' };
  }
  const site = await siteFor(account, service, deps);
  const mail = buildServiceInvoiceEmail(subjectFor(account, site), service, {
    ...(deps.payment ? { payment: deps.payment } : {}),
    ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
  });
  const mailStatus = await sendToCustomer(deps, account, mail);
  deps.log?.(`[admin] maandfactuur service voor ${account.email}: ${mailStatus}`);
  return { ok: true, service, mailStatus };
}
