import type { ServiceItem, ServiceOffer, SiteContent } from '../types';
import { SECTORS } from '../data/tradesData';

/**
 * The services on a craftsman's page: his own words and his own prices.
 *
 * The trade preset carries example prices ("v.a. € 650 per stuk"). Those
 * belong to nobody, so they never go on a public page. The craftsman writes
 * his own services in the editor; this module turns those into the items
 * the page shows and into the numbers the calculator works with.
 */

/**
 * Read a price like "v.a. € 2.400 per stuk" or "€ 28 per m²" as a number
 * plus an optional unit. Dutch notation is the rule: a dot is a thousands
 * separator, a comma a decimal separator.
 */
export function parseServicePrice(text: string): { amount: number; unit?: string } {
  const value = (text ?? '').trim();
  if (!value) return { amount: 0 };

  const match = value.match(/(\d[\d.,]*)/);
  if (!match) return { amount: 0 };

  const amount = parseDutchNumber(match[1]);
  const rest = value.slice((match.index ?? 0) + match[1].length).trim();
  // Only a unit like "per m²" or "per uur" is kept; the rest is prose.
  const unit = /^per\b/i.test(rest) ? rest : undefined;
  return unit ? { amount, unit } : { amount };
}

/**
 * A Dutch number as a number: "2.400" is 2400, "1.250,50" is 1250.5 and
 * "28" is 28.
 */
export function parseDutchNumber(text: string): number {
  const cleaned = (text ?? '').replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized: string;
  if (lastComma > -1 && lastDot > -1) {
    // The last separator is the decimal one.
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (lastComma > -1) {
    // "650,50" is a decimal, "1,250" is not a number we write, but the
    // three digits behind it say it is a thousands separator.
    normalized = /,\d{3}$/.test(cleaned) ? cleaned.replace(/,/g, '') : cleaned.replace(',', '.');
  } else if (lastDot > -1) {
    // "2.400" is thousands, "28.5" is a decimal.
    normalized = /\.\d{3}$/.test(cleaned) ? cleaned.replace(/\./g, '') : cleaned;
  } else {
    normalized = cleaned;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** The price as it appears on the page: "v.a. € 650" or "€ 28 per m²". */
export function formatServicePrice(offer: ServiceOffer): string {
  if (!offer.amount || offer.amount <= 0) return '';
  const amount = Math.round(offer.amount).toLocaleString('nl-NL');
  const unit = offer.unit?.trim();
  return unit ? `€ ${amount} ${unit}` : `v.a. € ${amount}`;
}

/** The trade preset as a list of services: names, texts and example prices. */
export function presetOffers(sectorId: SiteContent['sector']): ServiceOffer[] {
  const sector = SECTORS[sectorId];
  return sector.services.map((service) => {
    const { amount, unit } = parseServicePrice(service.p);
    return { n: service.n, d: service.d, amount, ...(unit ? { unit } : {}) };
  });
}

/**
 * The services that are really on the page: the craftsman's own when he
 * wrote them, the preset's otherwise.
 */
export function offersOf(content: SiteContent): ServiceOffer[] {
  const own = (content.services ?? []).filter((offer) => offer.n.trim());
  return own.length ? own : presetOffers(content.sector);
}

/** The services as the page shows them, with a number for every service. */
export function serviceItems(offers: ServiceOffer[]): ServiceItem[] {
  return offers.map((offer, index) => ({
    n: offer.n,
    d: offer.d,
    p: formatServicePrice(offer),
    nr: String(index + 1).padStart(2, '0'),
  }));
}

/** The services with a price: the ones the calculator can show. */
export function pricedOffers(offers: ServiceOffer[]): ServiceOffer[] {
  return offers.filter((offer) => offer.amount > 0 && offer.n.trim());
}

/** A row in the editor: the price is typed as text. */
export interface ServiceRow {
  n: string;
  d: string;
  amount: string;
  unit: string;
}

/**
 * The services as the editor shows them. The trade preset is the starting
 * point: its names and texts are there, its prices are not. A price the
 * craftsman never typed is not his, so it never reaches his page.
 */
export function serviceRows(content: SiteContent): ServiceRow[] {
  const own = content.services ?? [];
  if (own.length) {
    return own.map((offer) => ({
      n: offer.n,
      d: offer.d,
      amount: offer.amount ? String(offer.amount) : '',
      unit: offer.unit ?? '',
    }));
  }
  return presetOffers(content.sector)
    .filter((_, index) => !content.disabledServices[index])
    .map((offer) => ({
      n: offer.n,
      d: offer.d,
      amount: '',
      unit: offer.unit ?? '',
    }));
}

/** The rows the editor wrote, as the services of the site. */
export function rowsToOffers(rows: ServiceRow[]): ServiceOffer[] {
  return rows
    .filter((row) => row.n.trim())
    .map((row) => {
      const amount = parseDutchNumber(row.amount);
      const unit = row.unit.trim();
      return {
        n: row.n.trim(),
        d: row.d.trim(),
        amount: amount > 0 ? Math.round(amount) : 0,
        ...(unit ? { unit } : {}),
      };
    });
}
