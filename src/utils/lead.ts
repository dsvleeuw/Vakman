import { SECTORS } from '../data/tradesData';
import type { SectorId } from '../types';
import { isValidEmail, normalizeDutchPhone } from './contact';
import { parseQuoteRequest, type QuoteRequest } from './quote';

/**
 * One lead endpoint (`POST /api/lead`) serves every form in the app. This
 * module validates the untrusted body per form kind and holds the spam rules,
 * so the Netlify Function and the Vite dev middleware behave identically.
 */

export type LeadKind = 'offerte' | 'contact' | 'storing' | 'oppervlak' | 'afspraak';

export const LEAD_KIND_LABELS: Record<LeadKind, string> = {
  offerte: 'Offerte-aanvraag (wizard)',
  contact: 'Contactformulier',
  storing: 'Storingsmelding',
  oppervlak: 'm²-offerte',
  afspraak: 'Afspraakverzoek',
};

/** Real people need a few seconds to fill in a form; bots post instantly. */
export const MIN_FILL_TIME_MS = 3000;

/** Which (demo) website a form was sent from. */
export interface LeadSite {
  biz: string;
  sector?: SectorId;
  /** Path the visitor was on, e.g. /voorbeeld/schilder/modern. */
  path?: string;
}

interface LeadPerson {
  name: string;
  phone: string;
  /** Optional: only where the form asks for it, used for a confirmation mail. */
  email?: string;
}

export type Lead =
  | { kind: 'offerte'; request: QuoteRequest }
  | ({ kind: 'contact'; site: LeadSite; message: string } & LeadPerson)
  | ({
      kind: 'storing';
      site: LeadSite;
      address: string;
      faultType: string;
      since: string;
      urgency: string;
      details: string;
    } & LeadPerson)
  | ({
      kind: 'oppervlak';
      site: LeadSite;
      serviceName: string;
      pricePerM2: number;
      surfaceM2: number;
      totalPrice: number;
      wallCount: number;
      openings: number;
    } & LeadPerson)
  | ({
      kind: 'afspraak';
      site: LeadSite;
      address: string;
      service: string;
      date: string;
      slot: string;
      notes: string;
    } & LeadPerson);

export type SpamVerdict = 'ok' | 'honeypot' | 'too-fast';

/**
 * Honeypot + time check. `website` is a hidden field only bots fill in;
 * `startedAt` is when the form was first shown (ms since epoch). A missing
 * or future timestamp counts as too fast.
 */
export function checkSpam(body: unknown, now: number): SpamVerdict {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof raw.website === 'string' && raw.website.trim()) return 'honeypot';
  const startedAt = Number(raw.startedAt);
  if (!Number.isFinite(startedAt) || startedAt > now || now - startedAt < MIN_FILL_TIME_MS) {
    return 'too-fast';
  }
  return 'ok';
}

const clip = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Like `clip` but keeps line breaks, for free-text messages. */
const clipText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim().slice(0, max) : '';

const toNumber = (value: unknown, max: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};

type Parsed = { ok: true; lead: Lead } | { ok: false; error: string };

function parseSite(raw: unknown): LeadSite | null {
  const site = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const biz = clip(site.biz, 120);
  if (!biz) return null;
  const sector = typeof site.sector === 'string' && site.sector in SECTORS ? (site.sector as SectorId) : undefined;
  const path = clip(site.path, 200);
  return { biz, ...(sector ? { sector } : {}), ...(path.startsWith('/') ? { path } : {}) };
}

function parsePerson(raw: Record<string, unknown>): LeadPerson | string {
  const name = clip(raw.name, 120);
  const phone = clip(raw.phone, 40);
  const email = clip(raw.email, 160);
  if (!name) return 'Vul je naam in.';
  if (!normalizeDutchPhone(phone)) return 'Ongeldig telefoonnummer.';
  if (email && !isValidEmail(email)) return 'Ongeldig e-mailadres.';
  return { name, phone, ...(email ? { email } : {}) };
}

/**
 * Validate an untrusted `/api/lead` body. The browser checks the same rules
 * for instant feedback, but the server never trusts it.
 */
export function parseLeadRequest(body: unknown): Parsed {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Ongeldige aanvraag.' };
  const raw = body as Record<string, unknown>;

  if (raw.kind === 'offerte') {
    const parsed = parseQuoteRequest(raw);
    return parsed.ok ? { ok: true, lead: { kind: 'offerte', request: parsed.request } } : parsed;
  }

  if (!['contact', 'storing', 'oppervlak', 'afspraak'].includes(raw.kind as string)) {
    return { ok: false, error: 'Onbekend formulier.' };
  }
  const site = parseSite(raw.site);
  if (!site) return { ok: false, error: 'Onbekende website.' };
  const person = parsePerson(raw);
  if (typeof person === 'string') return { ok: false, error: person };

  switch (raw.kind) {
    case 'contact': {
      const message = clipText(raw.message, 2000);
      if (message.length < 10) return { ok: false, error: 'Omschrijf je klus in minimaal 10 tekens.' };
      return { ok: true, lead: { kind: 'contact', site, ...person, message } };
    }
    case 'storing': {
      const address = clip(raw.address, 200);
      if (!address) return { ok: false, error: 'Vul het adres van de storing in.' };
      return {
        ok: true,
        lead: {
          kind: 'storing',
          site,
          ...person,
          address,
          faultType: clip(raw.faultType, 80),
          since: clip(raw.since, 80),
          urgency: clip(raw.urgency, 80),
          details: clipText(raw.details, 2000),
        },
      };
    }
    case 'oppervlak': {
      const serviceName = clip(raw.serviceName, 120);
      if (!serviceName) return { ok: false, error: 'Kies een dienst.' };
      return {
        ok: true,
        lead: {
          kind: 'oppervlak',
          site,
          ...person,
          serviceName,
          pricePerM2: toNumber(raw.pricePerM2, 10_000),
          surfaceM2: toNumber(raw.surfaceM2, 100_000),
          totalPrice: toNumber(raw.totalPrice, 10_000_000),
          wallCount: Math.round(toNumber(raw.wallCount, 100)),
          openings: Math.round(toNumber(raw.openings, 100)),
        },
      };
    }
    default: {
      const address = clip(raw.address, 200);
      const date = clip(raw.date, 60);
      if (!address) return { ok: false, error: 'Vul je adres in.' };
      if (!date) return { ok: false, error: 'Kies een datum.' };
      return {
        ok: true,
        lead: {
          kind: 'afspraak',
          site,
          ...person,
          address,
          date,
          slot: clip(raw.slot, 60),
          service: clip(raw.service, 120),
          notes: clipText(raw.notes, 2000),
        },
      };
    }
  }
}

/** Short, human-friendly reference such as L-7Q4M2X for non-quote leads. */
export function createLeadReference(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `L-${code}`;
}

/** Contact details of whoever sent the lead, whatever the form. */
export function leadContact(lead: Lead): LeadPerson {
  if (lead.kind === 'offerte') {
    const { owner, phone, email } = lead.request.form;
    return { name: owner, phone, ...(email ? { email } : {}) };
  }
  return { name: lead.name, phone: lead.phone, ...(lead.email ? { email: lead.email } : {}) };
}
