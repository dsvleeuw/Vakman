import type { PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';
import type { MediaStorage } from './mediaHandler';

/**
 * Removing a customer account (AVG art. 17).
 *
 * The customer asks for it himself, from his own account. What goes:
 *
 * - the account and every session that belongs to it;
 * - his published sites, with their text and their photos. The public page
 *   disappears with them;
 * - the requests that came in on those sites;
 * - the offers that were never paid.
 *
 * What stays: the offers that were paid. The tax office can ask for those
 * for seven years, so the number, the amount and the dates stay. The
 * personal details of the customer (his name, his phone, his e-mail) do
 * not: they are removed, and the offer says so.
 */

/** The photos of one site, as keys in the media store. */
export function mediaKeysOf(site: PublishedSiteRecord): string[] {
  const keys: string[] = [];
  const add = (value: unknown) => {
    if (typeof value !== 'string') return;
    const match = value.match(/\/api\/media\?key=([a-z0-9-]{6,64}\.(?:jpg|png|webp))$/);
    if (match) keys.push(match[1]);
  };
  add(site.heroPhoto);
  for (const project of site.work ?? []) add(project.img);
  return [...new Set(keys)];
}

/** What goes when one account is removed. */
export interface DeletionPlan {
  /** The published sites that disappear; the public page goes with them. */
  sites: PublishedSiteRecord[];
  /** The requests that came in on those sites. */
  leads: StoredLead[];
  /** The offers that were never paid: they go. */
  quotes: QuoteRecord[];
  /** The offers that were paid: the fiscal record stays. */
  keptQuotes: QuoteRecord[];
  /** The photos of the sites that go. */
  mediaKeys: string[];
}

/** What was removed, so the customer can see it. */
export interface DeletionResult {
  sites: number;
  leads: number;
  quotes: number;
  keptQuotes: number;
  media: number;
}

/**
 * The plan for one customer, given everything that is stored. Pure, so it
 * can be tested without any storage.
 */
export function planAccountDeletion(input: {
  sites: PublishedSiteRecord[];
  leads: StoredLead[];
  quotes: QuoteRecord[];
}): DeletionPlan {
  const sites = input.sites;
  const slugs = new Set(sites.map((site) => site.slug));
  const leads = input.leads.filter((lead) => lead.site?.slug && slugs.has(lead.site.slug));
  const quotes = input.quotes;
  const paid = quotes.filter((quote) => quote.status === 'paid');
  const unpaid = quotes.filter((quote) => quote.status !== 'paid');
  const mediaKeys = sites.flatMap((site) => mediaKeysOf(site));
  return { sites, leads, quotes: unpaid, keptQuotes: paid, mediaKeys };
}

export interface DeleteAccountDeps {
  accounts: AccountStorage;
  sites: SiteStorage;
  leads: LeadStorage;
  media?: MediaStorage;
  log?: (message: string) => void;
}

/**
 * Carry out the plan: the sites, the requests, the unpaid offers and the
 * photos go; the paid offers lose their personal data; the account and its
 * sessions go last.
 */
export async function deleteAccountData(
  accountId: string,
  plan: DeletionPlan,
  deps: DeleteAccountDeps
): Promise<DeletionResult> {
  const log = deps.log ?? (() => {});
  let media = 0;

  for (const site of plan.sites) {
    await deps.sites.deleteSite(site.slug);
    log(`[account] site ${site.slug} verwijderd`);
  }
  for (const key of plan.mediaKeys) {
    if (!deps.media) break;
    await deps.media.deleteMedia(key);
    media += 1;
  }
  for (const lead of plan.leads) {
    await deps.leads.deleteLead(lead.reference);
  }
  for (const quote of plan.quotes) {
    await deps.leads.deleteQuote(quote.id);
  }
  for (const quote of plan.keptQuotes) {
    await deps.leads.anonymizeQuote(quote.id, new Date().toISOString());
    log(`[account] offerte ${quote.id} persoonsgegevens verwijderd (betaald, fiscus)`);
  }
  // The sessions of the customer go, so nobody stays logged in.
  for (const session of await deps.accounts.listSessionsOf(accountId)) {
    await deps.accounts.deleteSession(session.id);
  }
  await deps.accounts.deleteAccount(accountId);
  log(`[account] account verwijderd`);

  return {
    sites: plan.sites.length,
    leads: plan.leads.length,
    quotes: plan.quotes.length,
    keptQuotes: plan.keptQuotes.length,
    media,
  };
}
