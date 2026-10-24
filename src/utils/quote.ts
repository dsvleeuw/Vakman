import { ADDONS, getAddon, isAddonIncluded } from '../data/addons';
import { getPlan } from '../data/plans';
import type { PlanId, QuoteChannel } from '../types';

/**
 * Pure quote maths for the offertebouwer. Amounts are integer euro cents so
 * 21 % btw never produces floating-point pennies. Prices come only from
 * `data/plans.ts` and `data/addons.ts`.
 */

export const VAT_RATE = 0.21;
export const QUOTE_VALID_DAYS = 30;
export const DEFAULT_PLAN: PlanId = 'pro';
export const QUOTE_NUMBER_PREFIX = 'KB';

export interface QuoteLine {
  id: string;
  label: string;
  /** Amount charged on this quote in cents (0 when the package includes it). */
  amountCents: number;
  /** `true` when the package already contains this component. */
  included: boolean;
  kind: 'plan' | 'addon';
}

export interface QuoteTotals {
  planId: PlanId;
  planName: string;
  lines: QuoteLine[];
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
}

/** Keep only known add-on ids, once each, in catalogue order. */
export function sanitizeAddonIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const wanted = new Set(ids.filter((id): id is string => typeof id === 'string'));
  return ADDONS.filter((addon) => wanted.has(addon.id)).map((addon) => addon.id);
}

/** 21 % btw over a cent amount, rounded half-up to whole cents. */
export function vatForCents(subtotalCents: number): number {
  return Math.round(subtotalCents * VAT_RATE);
}

/**
 * Price a package plus add-ons. Components the package already contains are
 * listed as "inbegrepen" at € 0 so the customer sees them but pays once.
 */
export function calculateQuote(planId: PlanId | string | undefined, addonIds: unknown): QuoteTotals {
  const plan = getPlan(planId) ?? getPlan(DEFAULT_PLAN)!;
  const lines: QuoteLine[] = [
    {
      id: `plan-${plan.id}`,
      label: `Website-pakket ${plan.name}`,
      amountCents: plan.price * 100,
      included: false,
      kind: 'plan',
    },
    ...sanitizeAddonIds(addonIds).map((id) => {
      const addon = getAddon(id)!;
      const included = isAddonIncluded(addon, plan.id);
      return {
        id,
        label: addon.label,
        amountCents: included ? 0 : addon.price * 100,
        included,
        kind: 'addon' as const,
      };
    }),
  ];
  const subtotalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const vatCents = vatForCents(subtotalCents);
  return {
    planId: plan.id,
    planName: plan.name,
    lines,
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents,
  };
}

/** Dutch euro notation with cents: `€ 1.250,00`, `-€ 5,00`. */
export function formatEuroCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  const euros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const rest = (abs % 100).toString().padStart(2, '0');
  return `${sign}€ ${euros},${rest}`;
}

/** `KB-2026-0001`: prefix, year, sequence padded to at least four digits. */
export function formatQuoteNumber(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('Ongeldig volgnummer');
  return `${QUOTE_NUMBER_PREFIX}-${year}-${String(sequence).padStart(4, '0')}`;
}

const QUOTE_NUMBER_RE = /^KB-(\d{4})-(\d{4,6})$/;

export function isQuoteNumber(value: unknown): value is string {
  return typeof value === 'string' && QUOTE_NUMBER_RE.test(value);
}

/** Add whole days to an ISO timestamp (UTC), returning ISO. */
export function addDaysIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

/** `24 oktober 2026` without relying on the runtime's ICU data. */
export function formatDutchDate(iso: string): string {
  const months = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ];
  const date = new Date(iso);
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * How the wizard's channel choice delivers the quote:
 * - E-mail: the customer gets the PDF by e-mail.
 * - WhatsApp: no customer e-mail; the team mail carries a ready wa.me link
 *   with the quote link, and the confirmation screen shows the quote.
 * - Allebei: both.
 * Klusbaas always receives the quote by e-mail.
 */
export function quoteDelivery(channel: QuoteChannel): { email: boolean; whatsapp: boolean } {
  return {
    email: channel === 'E-mail' || channel === 'Allebei',
    whatsapp: channel === 'WhatsApp' || channel === 'Allebei',
  };
}

export interface QuoteCustomer {
  biz: string;
  owner: string;
  phone: string;
  city: string;
  email?: string;
}

/** Everything stored for one quote (Netlify Blobs / `.data/quotes`). */
export interface QuoteRecord extends QuoteTotals {
  id: string;
  token: string;
  createdAt: string;
  validUntil: string;
  customer: QuoteCustomer;
  sector: string;
  sectorName: string;
  styleName: string;
  services: string[];
  channel: QuoteChannel;
  appointment?: { date: string; slot: string };
}

/** The record without its secret token: what `GET /api/quote` returns. */
export type PublicQuote = Omit<QuoteRecord, 'token'>;

export function toPublicQuote(record: QuoteRecord): PublicQuote {
  const { token: _token, ...rest } = record;
  return rest;
}

export function buildQuoteRecord(input: {
  id: string;
  token: string;
  now: string;
  planId: PlanId | string | undefined;
  addons: unknown;
  customer: QuoteCustomer;
  sector: string;
  sectorName: string;
  styleName: string;
  services: string[];
  channel: QuoteChannel;
  appointment?: { date: string; slot: string };
}): QuoteRecord {
  const totals = calculateQuote(input.planId, input.addons);
  return {
    id: input.id,
    token: input.token,
    createdAt: input.now,
    validUntil: addDaysIso(input.now, QUOTE_VALID_DAYS),
    customer: input.customer,
    sector: input.sector,
    sectorName: input.sectorName,
    styleName: input.styleName,
    services: input.services,
    channel: input.channel,
    ...(input.appointment ? { appointment: input.appointment } : {}),
    ...totals,
  };
}

/** Shareable path of a stored quote. */
export function buildQuotePath(id: string, token: string): string {
  return `/offerte/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`;
}

/** PDF download link for a quote path from `buildQuotePath`. */
export function quotePdfHref(quotePath: string): string {
  const [pathname, search = ''] = quotePath.split('?');
  const id = decodeURIComponent(pathname.split('/').filter(Boolean)[1] ?? '');
  const token = new URLSearchParams(search).get('token') ?? '';
  return `/api/quote?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&format=pdf`;
}
