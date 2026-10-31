/**
 * Contact helpers shared by the demo websites.
 *
 * Product strategy (market research, contact option D): WhatsApp is the
 * primary channel and a short form is the fallback. These pure helpers build
 * the deep links and prefilled message templates so every component composes
 * messages the same way and the behaviour can be unit tested without a DOM.
 */

export interface ContactFormInput {
  name: string;
  phone: string;
  message: string;
}

export interface FaultReportInput {
  name: string;
  phone: string;
  address: string;
  faultType: string;
  since: string;
  urgency: string;
  details?: string;
}

export interface RoofCheckInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  roofType: string;
  complaint: string;
  urgency: string;
  details?: string;
}

export interface GardenPlanInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  service: string;
  gardenSize: string;
  moment: string;
  details?: string;
}

export interface SurfaceQuoteInput {
  serviceName: string;
  pricePerM2: number;
  surfaceM2: number;
  totalPrice: number;
  wallCount: number;
  openings: number;
  name?: string;
}

/**
 * Convert a Dutch phone number to the wa.me E.164-style digit string.
 * "06 12 34 56 78" -> "31612345678"
 */
export function phoneToWaDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `31${digits.slice(1)}` : digits;
}

/**
 * Normalise a Dutch phone number to its local 10-digit shape so forms accept
 * the ways people actually write numbers: "06 12 34 56 78", "+31 6 12345678",
 * "0031 (0)6-12345678". Returns `null` when it cannot be a Dutch number.
 */
export function normalizeDutchPhone(phone: string): string | null {
  // Drop a written trunk note such as "+31 (0)6 …" before stripping digits.
  const digits = phone.replace(/\(\s*0\s*\)/g, '').replace(/\D/g, '');
  if (!digits) return null;

  let local = digits;
  if (local.startsWith('0031')) {
    local = `0${local.slice(4)}`;
  } else if (local.startsWith('31') && local.length >= 11) {
    local = `0${local.slice(2)}`;
  }

  // Tolerate a doubled trunk zero, e.g. "0031 06 …".
  if (local.length === 11 && local.startsWith('00')) {
    local = local.slice(1);
  }

  return /^0\d{9}$/.test(local) ? local : null;
}

/**
 * The number demo sites route every call and WhatsApp button to.
 *
 * The sector data ships made-up numbers ("06 12 34 56 78") that may belong to
 * real strangers, so a demo must never link to them. `VITE_DEMO_PHONE` holds
 * the Klusbaas number instead. It is read per call (not at import time) so
 * the build-time prerender, which runs outside Vite, sees the same value as
 * the browser bundle. Returns `null` when unset or not a Dutch number.
 */
export function getDemoPhone(): string | null {
  const fromVite: unknown = import.meta.env?.VITE_DEMO_PHONE;
  const fromNode: unknown =
    typeof process !== 'undefined' ? process.env?.VITE_DEMO_PHONE : undefined;
  const raw = typeof fromVite === 'string' && fromVite ? fromVite : fromNode;
  return typeof raw === 'string' ? normalizeDutchPhone(raw) : null;
}

/**
 * Decide which number a site's call/WhatsApp buttons may use: the owner's own
 * number when they entered one, otherwise the Klusbaas demo number. `null`
 * means there is no safe number and the buttons must show the demo notice.
 */
export function resolveContactPhone(
  ownPhone: string | undefined,
  demoPhone: string | null
): string | null {
  const own = ownPhone?.trim();
  return own ? own : demoPhone;
}

/**
 * May a site show a call or WhatsApp button?
 *
 * A demo site may: its buttons point to the Klusbaas number or open the
 * demo notice. A customer's site may only when the owner entered a number
 * of their own: the Klusbaas demo number and the sample number of the
 * trade do not belong on the site of a real craftsman.
 */
export function canShowContactButtons(site: {
  contactPhone: string | null;
  isCustomerSite: boolean;
}): boolean {
  return Boolean(site.contactPhone) || !site.isCustomerSite;
}

/**
 * Build a click-to-chat WhatsApp URL, optionally with a prefilled message.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${phoneToWaDigits(phone)}`;
  const trimmed = message?.trim();
  return trimmed ? `${base}?text=${encodeURIComponent(trimmed)}` : base;
}

/**
 * Build a tel: URL from a human-formatted phone number.
 */
export function buildTelUrl(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, '')}`;
}

/** Href of a demo button without a safe number; SiteView opens the notice. */
export const DEMO_CONTACT_HREF = '#klusbaas-demo';

/**
 * tel: link for a site's call buttons, or the demo-notice anchor when the site
 * has no safe number (see `resolveContactPhone`).
 */
export function buildSiteTelUrl(contactPhone: string | null): string {
  return contactPhone ? buildTelUrl(contactPhone) : DEMO_CONTACT_HREF;
}

/** WhatsApp link for a site's chat buttons, or the demo-notice anchor. */
export function buildSiteWhatsAppUrl(contactPhone: string | null, message?: string): string {
  return contactPhone ? buildWhatsAppUrl(contactPhone, message) : DEMO_CONTACT_HREF;
}

/**
 * Message template for the generic contact form (the form fallback channel).
 */
export function buildContactMessage(bizName: string, input: ContactFormInput): string {
  return [
    `Hallo ${bizName}!`,
    '',
    input.message.trim(),
    '',
    `Naam: ${input.name.trim()}`,
    `Telefoon: ${input.phone.trim()}`,
  ].join('\n');
}

/**
 * Message template for the plumber emergency button.
 */
export function buildEmergencyMessage(
  bizName: string,
  problem: string,
  name?: string
): string {
  const lines = [
    `Hallo ${bizName}, ik heb een SPOEDklus.`,
    '',
    `Probleem: ${problem}`,
  ];
  if (name?.trim()) {
    lines.push(`Naam: ${name.trim()}`);
  }
  lines.push('Kunnen jullie zo snel mogelijk contact opnemen?');
  return lines.join('\n');
}

/**
 * Message template for the electrician fault-report form.
 */
export function buildFaultReportMessage(bizName: string, input: FaultReportInput): string {
  const lines = [
    `Hallo ${bizName}, ik wil een storing melden.`,
    '',
    `Soort storing: ${input.faultType}`,
    `Speelt sinds: ${input.since}`,
    `Urgentie: ${input.urgency}`,
    `Adres: ${input.address.trim()}`,
    `Naam: ${input.name.trim()}`,
    `Telefoon: ${input.phone.trim()}`,
  ];
  if (input.details?.trim()) {
    lines.push('', `Aanvulling: ${input.details.trim()}`);
  }
  return lines.join('\n');
}

/**
 * Message template for the gardener's garden plan.
 */
export function buildGardenPlanMessage(bizName: string, input: GardenPlanInput): string {
  const lines = [
    `Hallo ${bizName}, ik wil graag een tuinplan.`,
    '',
    `Werk: ${input.service.trim()}`,
    `Grootte tuin: ${input.gardenSize.trim()} m²`,
    `Moment: ${input.moment.trim()}`,
    `Adres: ${input.address.trim()}`,
    `Naam: ${input.name.trim()}`,
    `Telefoon: ${input.phone.trim()}`,
  ];
  if (input.email?.trim()) {
    lines.push(`E-mail: ${input.email.trim()}`);
  }
  if (input.details?.trim()) {
    lines.push('', `Aanvulling: ${input.details.trim()}`);
  }
  return lines.join('\n');
}

/**
 * Message template for the roofer's free roof check.
 */
export function buildRoofCheckMessage(bizName: string, input: RoofCheckInput): string {
  const lines = [
    `Hallo ${bizName}, ik wil graag een gratis dakcheck.`,
    '',
    `Type dak: ${input.roofType}`,
    `Klacht: ${input.complaint}`,
    `Urgentie: ${input.urgency}`,
    `Adres: ${input.address.trim()}`,
    `Naam: ${input.name.trim()}`,
    `Telefoon: ${input.phone.trim()}`,
  ];
  if (input.email?.trim()) {
    lines.push(`E-mail: ${input.email.trim()}`);
  }
  if (input.details?.trim()) {
    lines.push('', `Aanvulling: ${input.details.trim()}`);
  }
  return lines.join('\n');
}

/**
 * Message template for the painter m² calculator quote request.
 */
export function buildSurfaceQuoteMessage(bizName: string, input: SurfaceQuoteInput): string {
  const lines = [
    `Hallo ${bizName}, ik wil graag een offerte aanvragen.`,
    '',
    `Werk: ${input.serviceName}`,
    `Oppervlakte: ${input.surfaceM2} m² (${input.wallCount} wand(en), ${input.openings} deur/raam correctie)`,
    `Richtprijs: € ${input.totalPrice.toLocaleString('nl-NL')}`,
  ];
  if (input.name?.trim()) {
    lines.push(`Naam: ${input.name.trim()}`);
  }
  lines.push('Kunnen jullie hiervoor een definitieve offerte maken?');
  return lines.join('\n');
}

export interface QuoteChannelInput {
  bizName: string;
  owner: string;
  phone: string;
  city: string;
  dateStr: string;
  timeSlot: string;
  channel: string;
  planName?: string;
  appointmentId?: string;
}

/**
 * Summary the visitor can send over the channel they picked. Used by the
 * wizard confirmation so choosing "E-mail" or "WhatsApp" actually produces a
 * ready-to-send message instead of a dead end.
 */
export function buildQuoteRequestMessage(input: QuoteChannelInput): string {
  const lines = [
    `Hallo Klusbaas, ik heb een afspraak aangevraagd voor ${input.bizName}.`,
    '',
    `Contactpersoon: ${input.owner}`,
    `Telefoon: ${input.phone}`,
    `Werkgebied: ${input.city}`,
    `Voorkeur: ${input.dateStr}, ${input.timeSlot}`,
    `Offertes via: ${input.channel}`,
  ];
  if (input.planName) {
    lines.push(`Pakket: ${input.planName}`);
  }
  if (input.appointmentId) {
    lines.push(`Afspraak-ID: ${input.appointmentId}`);
  }
  lines.push('', 'Ik hoor graag van jullie.');
  return lines.join('\n');
}

/** Pragmatic e-mail check: something@domain.tld, no spaces. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/**
 * Build a `mailto:` link with a subject and a prefilled body.
 */
export function buildMailtoUrl(email: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  if (subject.trim()) params.set('subject', subject.trim());
  if (body.trim()) params.set('body', body.trim());
  const query = params.toString();
  return `mailto:${email}${query ? `?${query}` : ''}`;
}
