import { ADDONS, getAddon, isAddonIncluded } from '../data/addons';
import { getPlan, isPlanId } from '../data/plans';
import { SECTORS, STYLES } from '../data/tradesData';
import type { PlanId, QuoteChannel, SectorId } from '../types';
import { isValidEmail, normalizeDutchPhone } from './contact';

export { isValidEmail };

export const VAT_RATE = 0.21;
export const DEFAULT_PLAN: PlanId = 'pro';

export interface QuoteLine {
  id: string;
  label: string;
  /** Price actually charged on this quote (0 when the package includes it). */
  price: number;
  included: boolean;
}

export interface Quote {
  planId: PlanId;
  planName: string;
  planPrice: number;
  addons: QuoteLine[];
  subtotal: number;
  vat: number;
  total: number;
}

/** Everything the wizard sends to the quote endpoint. */
export interface QuoteRequest {
  sector: SectorId;
  styleIndex: number;
  plan: PlanId;
  addons: string[];
  services: string[];
  form: {
    biz: string;
    owner: string;
    phone: string;
    city: string;
    email: string;
  };
  channel: QuoteChannel;
  appointment?: { date: string; slot: string };
  /** Honeypot: real visitors never fill this in. */
  website?: string;
}

const roundCents = (amount: number) => Math.round(amount * 100) / 100;

/** Keep only known add-on ids, once each, in catalogue order. */
export function sanitizeAddonIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const wanted = new Set(ids.filter((id): id is string => typeof id === 'string'));
  return ADDONS.filter((addon) => wanted.has(addon.id)).map((addon) => addon.id);
}

/**
 * Price a package plus add-ons. Components the package already contains are
 * listed as included at € 0, so the customer sees them but pays once.
 */
export function buildQuote(planId: PlanId | undefined, addonIds: string[]): Quote {
  const plan = getPlan(planId) ?? getPlan(DEFAULT_PLAN)!;
  const addons = sanitizeAddonIds(addonIds).map((id) => {
    const addon = getAddon(id)!;
    const included = isAddonIncluded(addon, plan.id);
    return { id, label: addon.label, price: included ? 0 : addon.price, included };
  });
  const subtotal = roundCents(plan.price + addons.reduce((sum, line) => sum + line.price, 0));
  const vat = roundCents(subtotal * VAT_RATE);
  return {
    planId: plan.id,
    planName: plan.name,
    planPrice: plan.price,
    addons,
    subtotal,
    vat,
    total: roundCents(subtotal + vat),
  };
}

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/**
 * Validate an untrusted request body (the server never trusts the browser).
 * Returns a cleaned request or a Dutch error message.
 */
export function parseQuoteRequest(
  body: unknown
): { ok: true; request: QuoteRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Ongeldige aanvraag.' };
  const raw = body as Record<string, unknown>;
  const form = (raw.form ?? {}) as Record<string, unknown>;

  const sector = raw.sector;
  if (typeof sector !== 'string' || !(sector in SECTORS)) {
    return { ok: false, error: 'Onbekend vak.' };
  }
  const styleIndex = Number(raw.styleIndex);
  if (!Number.isInteger(styleIndex) || styleIndex < 0 || styleIndex >= STYLES.length) {
    return { ok: false, error: 'Onbekende stijl.' };
  }
  const plan = isPlanId(raw.plan as string) ? (raw.plan as PlanId) : DEFAULT_PLAN;

  const cleanForm = {
    biz: clip(form.biz, 120),
    owner: clip(form.owner, 120),
    phone: clip(form.phone, 40),
    city: clip(form.city, 80),
    email: clip(form.email, 160),
  };
  if (!cleanForm.biz || !cleanForm.owner || !cleanForm.city) {
    return { ok: false, error: 'Vul bedrijfsnaam, naam en plaats in.' };
  }
  if (!normalizeDutchPhone(cleanForm.phone)) {
    return { ok: false, error: 'Ongeldig telefoonnummer.' };
  }
  const channel: QuoteChannel =
    raw.channel === 'E-mail' || raw.channel === 'Allebei' ? raw.channel : 'WhatsApp';
  // The address is only required when the quote is mailed to the customer.
  if ((cleanForm.email || channel !== 'WhatsApp') && !isValidEmail(cleanForm.email)) {
    return { ok: false, error: 'Ongeldig e-mailadres.' };
  }
  const services = Array.isArray(raw.services)
    ? raw.services.map((s) => clip(s, 120)).filter(Boolean).slice(0, 30)
    : [];
  const appointmentRaw = raw.appointment as Record<string, unknown> | undefined;
  const appointment =
    appointmentRaw && clip(appointmentRaw.date, 60)
      ? { date: clip(appointmentRaw.date, 60), slot: clip(appointmentRaw.slot, 60) }
      : undefined;

  return {
    ok: true,
    request: {
      sector: sector as SectorId,
      styleIndex,
      plan,
      addons: sanitizeAddonIds(raw.addons),
      services,
      form: cleanForm,
      channel,
      appointment,
      website: clip(raw.website, 200),
    },
  };
}

/* ------------------------------------------------------------------------ */
/* Quote documents: numbered, dated, stored and rendered as PDF.            */
/* ------------------------------------------------------------------------ */

export const QUOTE_VALIDITY_DAYS = 30;

/** KB-2026-0001: year plus a per-year sequence, at least four digits. */
export function formatQuoteNumber(year: number, sequence: number): string {
  return `KB-${year}-${String(sequence).padStart(4, '0')}`;
}

export function isQuoteNumber(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^KB-\d{4}-\d{4,}$/.test(value);
}

/** Tokens are 32 random bytes as hex; anything else is rejected before a lookup. */
export function isQuoteToken(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

/** Constant-time comparison so response timing does not leak the token. */
export function tokensMatch(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return diff === 0;
}

/** Relative link to the online quote; the token is what makes it private. */
export function quoteViewPath(number: string, token: string): string {
  return `/offerte/${encodeURIComponent(number)}?token=${token}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** € 1.250,00: always two decimals, for documents where columns must align. */
export function formatEuroCents(amount: number): string {
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${amount < 0 ? '- ' : ''}€ ${grouped},${cents}`;
}

const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

/** 24 oktober 2026, independent of the runtime's locale data. */
export function formatDutchDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${DUTCH_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export interface QuoteDocumentLine {
  label: string;
  /** Short explanation printed under the label. */
  note?: string;
  amount: number;
  included: boolean;
}

/** Everything needed to show or print a quote, without the access token. */
export interface QuoteDocument {
  number: string;
  issuedAt: string;
  validUntil: string;
  customer: QuoteRequest['form'];
  sectorName: string;
  styleName: string;
  services: string[];
  channel: QuoteChannel;
  appointment?: { date: string; slot: string };
  lines: QuoteDocumentLine[];
  subtotal: number;
  vat: number;
  vatRate: number;
  total: number;
}

/** Turn a validated request into a numbered quote, valid for 30 days. */
export function buildQuoteDocument(request: QuoteRequest, number: string, issuedAt: Date): QuoteDocument {
  const quote = buildQuote(request.plan, request.addons);
  const plan = getPlan(quote.planId)!;
  const lines: QuoteDocumentLine[] = [
    { label: `Pakket ${quote.planName}`, note: plan.blurb, amount: quote.planPrice, included: false },
    ...quote.addons.map((line) => ({
      label: line.label,
      note: line.included ? `Inbegrepen in pakket ${quote.planName}` : getAddon(line.id)?.description,
      amount: line.price,
      included: line.included,
    })),
  ];
  return {
    number,
    issuedAt: issuedAt.toISOString(),
    validUntil: addDays(issuedAt, QUOTE_VALIDITY_DAYS).toISOString(),
    customer: request.form,
    sectorName: SECTORS[request.sector].name,
    styleName: STYLES[request.styleIndex].name,
    services: request.services,
    channel: request.channel,
    ...(request.appointment ? { appointment: request.appointment } : {}),
    lines,
    subtotal: quote.subtotal,
    vat: quote.vat,
    vatRate: VAT_RATE,
    total: quote.total,
  };
}
