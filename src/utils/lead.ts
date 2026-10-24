import { isPlanId } from '../data/plans';
import { SECTORS, STYLES } from '../data/tradesData';
import type { PlanId, QuoteChannel, SectorId } from '../types';
import { isValidEmail, normalizeDutchPhone } from './contact';
import { DEFAULT_PLAN, quoteDelivery, sanitizeAddonIds } from './quote';

/**
 * Validation for `POST /api/lead`. Pure so the browser and the server share
 * the same rules and both are unit-tested. The server never trusts the body.
 */

export const LEAD_TYPES = ['quote', 'appointment', 'contact', 'fault', 'surface'] as const;
export type LeadType = (typeof LEAD_TYPES)[number];
export type SiteLeadType = Exclude<LeadType, 'quote'>;

/** Forms filled in faster than this are treated as bots. */
export const MIN_FILL_MS = 800;

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  quote: 'Offerte-aanvraag website',
  appointment: 'Afspraakverzoek',
  contact: 'Contactformulier',
  fault: 'Storingsmelding',
  surface: 'm²-offerte',
};

interface FieldSpec {
  key: string;
  label: string;
  required?: boolean;
  max: number;
  min?: number;
  kind?: 'phone' | 'email';
}

const name: FieldSpec = { key: 'name', label: 'Naam', required: true, max: 120 };
const phone: FieldSpec = { key: 'phone', label: 'Telefoon', required: true, max: 40, kind: 'phone' };
const email: FieldSpec = { key: 'email', label: 'E-mail', max: 160, kind: 'email' };

/** Field rules per site form. Order is the order shown in the e-mail. */
export const LEAD_FIELDS: Record<SiteLeadType, FieldSpec[]> = {
  appointment: [
    name,
    phone,
    email,
    { key: 'address', label: 'Adres', required: true, max: 200 },
    { key: 'service', label: 'Dienst', required: true, max: 120 },
    { key: 'date', label: 'Datum', required: true, max: 60 },
    { key: 'slot', label: 'Dagdeel', required: true, max: 60 },
    { key: 'notes', label: 'Opmerkingen', max: 1000 },
  ],
  contact: [
    name,
    phone,
    email,
    { key: 'message', label: 'Bericht', required: true, min: 10, max: 2000 },
  ],
  fault: [
    name,
    phone,
    email,
    { key: 'address', label: 'Adres', required: true, max: 200 },
    { key: 'faultType', label: 'Soort storing', required: true, max: 120 },
    { key: 'since', label: 'Sinds', required: true, max: 120 },
    { key: 'urgency', label: 'Urgentie', required: true, max: 120 },
    { key: 'details', label: 'Toelichting', max: 1000 },
  ],
  surface: [
    { ...name, required: false },
    phone,
    email,
    { key: 'service', label: 'Dienst', required: true, max: 120 },
    { key: 'surfaceM2', label: 'Oppervlakte (m²)', required: true, max: 20 },
    { key: 'pricePerM2', label: 'Prijs per m²', max: 20 },
    { key: 'estimate', label: 'Indicatie', required: true, max: 40 },
    { key: 'walls', label: 'Aantal wanden', max: 10 },
    { key: 'openings', label: 'Deuren/ramen', max: 10 },
  ],
};

export interface SiteContext {
  /** Business name of the (demo) site the visitor used. */
  biz: string;
  sector: SectorId;
  style?: string;
}

export interface SiteLead {
  type: SiteLeadType;
  site: SiteContext;
  fields: Record<string, string>;
}

export interface QuoteLeadRequest {
  type: 'quote';
  sector: SectorId;
  styleIndex: number;
  plan: PlanId;
  addons: string[];
  services: string[];
  form: { biz: string; owner: string; phone: string; city: string; email: string };
  channel: QuoteChannel;
  appointment?: { date: string; slot: string };
}

export type ParsedLead =
  | { kind: 'site'; lead: SiteLead }
  | { kind: 'quote'; request: QuoteLeadRequest }
  | { kind: 'spam'; reason: 'honeypot' | 'too-fast' }
  | { kind: 'invalid'; error: string; field?: string };

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : typeof value === 'number' && Number.isFinite(value) ? String(value).slice(0, max) : '';

const isSectorId = (value: unknown): value is SectorId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(SECTORS, value);

/** Validate one site form's fields; returns cleaned values or the first error. */
export function validateLeadFields(
  type: SiteLeadType,
  raw: unknown
): { ok: true; fields: Record<string, string> } | { ok: false; field: string; error: string } {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fields: Record<string, string> = {};
  for (const spec of LEAD_FIELDS[type]) {
    const value = clip(source[spec.key], spec.max);
    if (!value) {
      if (spec.required) return { ok: false, field: spec.key, error: `Vul ${spec.label.toLowerCase()} in.` };
      continue;
    }
    if (spec.min && value.length < spec.min) {
      return { ok: false, field: spec.key, error: `${spec.label} is te kort (minimaal ${spec.min} tekens).` };
    }
    if (spec.kind === 'phone' && !normalizeDutchPhone(value)) {
      return { ok: false, field: spec.key, error: 'Ongeldig telefoonnummer.' };
    }
    if (spec.kind === 'email' && !isValidEmail(value)) {
      return { ok: false, field: spec.key, error: 'Ongeldig e-mailadres.' };
    }
    fields[spec.key] = value;
  }
  return { ok: true, fields };
}

/** Label/value rows for e-mails, in schema order. */
export function leadFieldRows(lead: SiteLead): { label: string; value: string }[] {
  return LEAD_FIELDS[lead.type]
    .filter((spec) => lead.fields[spec.key])
    .map((spec) => ({ label: spec.label, value: lead.fields[spec.key] }));
}

function parseQuoteLead(raw: Record<string, unknown>): ParsedLead {
  const form = (raw.form && typeof raw.form === 'object' ? raw.form : {}) as Record<string, unknown>;
  if (!isSectorId(raw.sector)) return { kind: 'invalid', field: 'sector', error: 'Onbekend vak.' };
  const styleIndex = Number(raw.styleIndex);
  if (!Number.isInteger(styleIndex) || styleIndex < 0 || styleIndex >= STYLES.length) {
    return { kind: 'invalid', field: 'styleIndex', error: 'Onbekende stijl.' };
  }
  const channel: QuoteChannel =
    raw.channel === 'E-mail' || raw.channel === 'Allebei' ? raw.channel : 'WhatsApp';
  const cleanForm = {
    biz: clip(form.biz, 120),
    owner: clip(form.owner, 120),
    phone: clip(form.phone, 40),
    city: clip(form.city, 80),
    email: clip(form.email, 160),
  };
  if (!cleanForm.biz) return { kind: 'invalid', field: 'biz', error: 'Vul je bedrijfsnaam in.' };
  if (!cleanForm.owner) return { kind: 'invalid', field: 'owner', error: 'Vul je naam in.' };
  if (!cleanForm.city) return { kind: 'invalid', field: 'city', error: 'Vul je plaats in.' };
  if (!normalizeDutchPhone(cleanForm.phone)) {
    return { kind: 'invalid', field: 'phone', error: 'Ongeldig telefoonnummer.' };
  }
  if (cleanForm.email && !isValidEmail(cleanForm.email)) {
    return { kind: 'invalid', field: 'email', error: 'Ongeldig e-mailadres.' };
  }
  if (quoteDelivery(channel).email && !cleanForm.email) {
    return { kind: 'invalid', field: 'email', error: 'Vul je e-mailadres in, daar sturen we de offerte heen.' };
  }
  const services = Array.isArray(raw.services)
    ? raw.services.map((s) => clip(s, 120)).filter(Boolean).slice(0, 30)
    : [];
  const appointmentRaw =
    raw.appointment && typeof raw.appointment === 'object'
      ? (raw.appointment as Record<string, unknown>)
      : undefined;
  const appointment =
    appointmentRaw && clip(appointmentRaw.date, 60)
      ? { date: clip(appointmentRaw.date, 60), slot: clip(appointmentRaw.slot, 60) }
      : undefined;
  return {
    kind: 'quote',
    request: {
      type: 'quote',
      sector: raw.sector,
      styleIndex,
      plan: isPlanId(raw.plan as string) ? (raw.plan as PlanId) : DEFAULT_PLAN,
      addons: sanitizeAddonIds(raw.addons),
      services,
      form: cleanForm,
      channel,
      ...(appointment ? { appointment } : {}),
    },
  };
}

/**
 * Parse an untrusted `POST /api/lead` body. Spam (filled honeypot or a form
 * submitted within `MIN_FILL_MS` of rendering) is reported separately so the
 * server can pretend success without storing or mailing anything.
 */
export function parseLead(body: unknown, now: number): ParsedLead {
  if (!body || typeof body !== 'object') return { kind: 'invalid', error: 'Ongeldige aanvraag.' };
  const raw = body as Record<string, unknown>;
  if (typeof raw.website === 'string' && raw.website.trim()) return { kind: 'spam', reason: 'honeypot' };
  const startedAt = Number(raw.startedAt);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return { kind: 'invalid', error: 'Ongeldige aanvraag.' };
  }
  if (now - startedAt < MIN_FILL_MS) return { kind: 'spam', reason: 'too-fast' };

  const type = raw.type;
  if (typeof type !== 'string' || !(LEAD_TYPES as readonly string[]).includes(type)) {
    return { kind: 'invalid', error: 'Onbekend formulier.' };
  }
  if (type === 'quote') return parseQuoteLead(raw);

  const siteRaw = (raw.site && typeof raw.site === 'object' ? raw.site : {}) as Record<string, unknown>;
  if (!isSectorId(siteRaw.sector)) return { kind: 'invalid', error: 'Onbekend vak.' };
  const site: SiteContext = {
    biz: clip(siteRaw.biz, 120) || SECTORS[siteRaw.sector].biz,
    sector: siteRaw.sector,
    ...(clip(siteRaw.style, 40) ? { style: clip(siteRaw.style, 40) } : {}),
  };
  const fields = validateLeadFields(type as SiteLeadType, raw.fields);
  if (!fields.ok) return { kind: 'invalid', field: fields.field, error: fields.error };
  return { kind: 'site', lead: { type: type as SiteLeadType, site, fields: fields.fields } };
}

/**
 * Small sliding-window rate limiter (per client key). In a serverless
 * function it lives per warm instance, which is enough to stop a single
 * script hammering the endpoint; it is not a distributed quota.
 */
export function createRateLimiter(options: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now: number): boolean {
    const recent = (hits.get(key) ?? []).filter((at) => now - at < options.windowMs);
    if (recent.length >= options.limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) {
      for (const [k, list] of hits) {
        if (list.every((at) => now - at >= options.windowMs)) hits.delete(k);
      }
    }
    return true;
  };
}
