import { SERVICE_LABEL, SERVICE_PRICE } from '../data/plans';
import type { ServiceState, ServiceStatus } from '../types';
import { formatDutchDate, formatEuroCents, vatForCents } from './quote';

/**
 * The monthly service, in one place.
 *
 * The service is the part of Klusbaas that keeps running after the site is
 * delivered: hosting, SSL, updates, support and one change a month. It is
 * opt-in (the customer switches it on in his own account), it costs € 25
 * per month without VAT and it can be stopped every month.
 *
 * Everything here is pure: the same input gives the same price, the same
 * reference and the same wording, in the mail, in the account and in the
 * overview of Klusbaas.
 */

/** What the customer pays per month for the service, in cents (excl. VAT). */
export const SERVICE_AMOUNT_CENTS = SERVICE_PRICE * 100;

/** The name of the service, in the words of the customer. */
export { SERVICE_LABEL };

/** The amount incl. VAT: what the customer transfers every month. */
export function serviceAmountWithVat(cents: number = SERVICE_AMOUNT_CENTS): number {
  return cents + vatForCents(cents);
}

/** `€ 25,00 per maand (excl. btw)` */
export function servicePriceText(cents: number = SERVICE_AMOUNT_CENTS): string {
  return `${formatEuroCents(cents)} per maand (excl. btw)`;
}

/** `€ 30,25 per maand (incl. btw)` */
export function serviceAmountText(cents: number = SERVICE_AMOUNT_CENTS): string {
  return `${formatEuroCents(serviceAmountWithVat(cents))} per maand (incl. btw)`;
}

/**
 * The reference the customer puts on his monthly transfer, so Klusbaas can
 * recognise the money: `SERVICE-jansen-schilderwerken`.
 */
export function serviceReference(siteSlug: string | undefined): string {
  const slug = (siteSlug ?? '').trim().toLowerCase();
  return slug ? `SERVICE-${slug}` : 'SERVICE';
}

/** True when the customer can ask for the service (he has none, or stopped it). */
export function canRequestService(service: ServiceState | undefined): boolean {
  return !service || service.status === 'stopped';
}

/** The status in the words of the customer. */
export function serviceStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'requested':
      return 'Aangevraagd';
    case 'active':
      return 'Actief';
    default:
      return 'Gestopt';
  }
}

/** `Actief sinds 1 november 2026` */
export function serviceSinceText(service: ServiceState): string {
  if (!service.activeSince) return '';
  return `sinds ${formatDutchDate(service.activeSince)}`;
}

/**
 * What the customer pays: nothing while the months that come with the
 * package run, the catalogue price after that.
 */
export function serviceAmountLabel(service: ServiceState): string {
  if (service.amountCents <= 0) return 'gratis (de maanden die bij je pakket horen)';
  return servicePriceText(service.amountCents);
}
