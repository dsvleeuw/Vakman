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
