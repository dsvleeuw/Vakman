import type { AdminAccount, AdminQuote, AdminSite, StoredLead } from '../types';
import { REQUEST_STATUS_LABELS } from './lead';
import { formatEuroCents } from './quote';

/**
 * Zoeken en exporteren in het overzicht van Klusbaas.
 *
 * Zodra er tientallen aanvragen en offertes zijn, is een lijst op volgorde
 * van datum niet meer genoeg: Klusbaas moet één klant kunnen terugvinden.
 * Het zoeken gebeurt in de browser, op de data die het overzicht al heeft.
 */

/** True when the text contains the search term (ongeacht de spelling). */
export function matchesSearch(text: string | undefined | null, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (text ?? '').toLowerCase().includes(needle);
}

/** The requests that match the search term. */
export function filterLeads(leads: StoredLead[], query: string): StoredLead[] {
  if (!query.trim()) return leads;
  return leads.filter((lead) =>
    [
      lead.reference,
      lead.fields?.name,
      lead.fields?.phone,
      lead.fields?.email,
      lead.fields?.message,
      lead.fields?.details,
      lead.site?.biz,
      lead.site?.slug,
      lead.type,
    ].some((value) => matchesSearch(value, query))
  );
}

/** The offers that match the search term. */
export function filterQuotes(quotes: AdminQuote[], query: string): AdminQuote[] {
  if (!query.trim()) return quotes;
  return quotes.filter((quote) =>
    [
      quote.id,
      quote.customerName,
      quote.customerEmail,
      quote.customerPhone,
      quote.customerBiz,
      quote.city,
      quote.planName,
      quote.status,
    ].some((value) => matchesSearch(value, query))
  );
}

/** The sites that match the search term. */
export function filterSites(sites: AdminSite[], query: string): AdminSite[] {
  if (!query.trim()) return sites;
  return sites.filter((site) =>
    [site.slug, site.biz, site.owner, site.phone, site.city, site.email, site.sector].some((value) =>
      matchesSearch(value, query)
    )
  );
}

/** The accounts that match the search term. */
export function filterAccounts(accounts: AdminAccount[], query: string): AdminAccount[] {
  if (!query.trim()) return accounts;
  return accounts.filter((account) => matchesSearch(account.email, query));
}

/** The requests as rows for a CSV file. */
export function leadsToCsv(leads: StoredLead[]): (string | number | undefined)[][] {
  const rows: (string | number | undefined)[][] = [
    ['Referentie', 'Datum', 'Soort', 'Status', 'Naam', 'Telefoon', 'E-mail', 'Bedrijf', 'Bericht'],
  ];
  for (const lead of leads) {
    const message = lead.fields?.message ?? lead.fields?.details ?? lead.fields?.notes ?? '';
    rows.push([
      lead.reference,
      lead.createdAt ? new Date(lead.createdAt).toLocaleString('nl-NL') : '',
      lead.type,
      REQUEST_STATUS_LABELS[lead.status ?? 'new'] ?? lead.status ?? 'Nieuw',
      lead.fields?.name ?? '',
      lead.fields?.phone ?? '',
      lead.fields?.email ?? '',
      lead.site?.biz ?? '',
      message,
    ]);
  }
  return rows;
}

/** The offers as rows for a CSV file. */
export function quotesToCsv(quotes: AdminQuote[]): (string | number | undefined)[][] {
  const rows: (string | number | undefined)[][] = [
    ['Offertenummer', 'Datum', 'Status', 'Naam', 'Bedrijf', 'E-mail', 'Telefoon', 'Plaats', 'Pakket', 'Bedrag', 'Geldig tot'],
  ];
  for (const quote of quotes) {
    rows.push([
      quote.id,
      quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('nl-NL') : '',
      quote.status,
      quote.customerName,
      quote.customerBiz ?? '',
      quote.customerEmail ?? '',
      quote.customerPhone,
      quote.city,
      quote.planName,
      formatEuroCents(quote.totalCents),
      quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('nl-NL') : '',
    ]);
  }
  return rows;
}
