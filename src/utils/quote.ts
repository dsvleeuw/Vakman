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
