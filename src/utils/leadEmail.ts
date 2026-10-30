import { PLATFORM_CONTACT } from '../data/platform';
import { SECTORS } from '../data/tradesData';
import { LEAD_TYPE_LABELS, leadFieldRows, type SiteLead } from './lead';
import type { PaymentDetails } from '../types';
import { formatDutchDate, formatEuroCents, quoteDelivery, type QuoteRecord } from './quote';

/**
 * E-mail content for `POST /api/lead`. Plain text and HTML carry the same
 * content so every mail client shows everything. Pure and tested.
 */

export interface LeadEmail {
  subject: string;
  text: string;
  html: string;
}

export interface Row {
  label: string;
  value: string;
  href?: string;
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Short, human-friendly lead reference such as `L-7Q4M2X`. */
export function createLeadReference(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `L-${code}`;
}

const table = (rows: Row[], strongLast = false) =>
  `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${rows
    .map((row, index) => {
      const strong = strongLast && index === rows.length - 1;
      const weight = strong ? 'font-weight:800;font-size:16px;' : '';
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}" style="color:#b45309;">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value).replace(/\n/g, '<br>');
      return `<tr><td style="padding:6px 12px 6px 0;color:#57534e;vertical-align:top;${weight}">${escapeHtml(row.label)}</td><td style="padding:6px 0;text-align:right;color:#1c1917;font-weight:700;${weight}">${value}</td></tr>`;
    })
    .join('')}</table>`;

const section = (title: string, body: string) =>
  `<h2 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;">${escapeHtml(title)}</h2>${body}`;

/** A two-column table of label/value pairs, shared by every Klusbaas mail. */
export const emailTable = table;

/** A titled block in a mail, shared by every Klusbaas mail. */
export const emailSection = section;

export interface EmailLayout {
  intro: string;
  /** Lead or quote reference shown under the intro. */
  reference?: string;
  /** Pre-rendered HTML sections (escape user content first). */
  sections?: string;
  outro: string;
  button?: { href: string; label: string };
  /** Site origin for the logo image and the privacy link. */
  siteUrl: string;
  /** Why the recipient gets this mail; shown in the footer. */
  footerNote?: string;
  /** Unsubscribe link for newsletter mails. */
  unsubscribeUrl?: string;
}

export const DEFAULT_SITE_URL = 'https://klusbaas.nl';

const origin = (siteUrl: string) => (siteUrl || DEFAULT_SITE_URL).replace(/\/$/, '');

/** Logo for e-mail: a PNG, because many mail clients block SVG images. */
export const emailLogoUrl = (siteUrl: string) => `${origin(siteUrl)}/brand/klusbaas-logo-email.png`;
export const privacyUrl = (siteUrl: string) => `${origin(siteUrl)}/privacy`;

/**
 * Shared HTML shell for every Klusbaas mail: logo header, white card and a
 * footer with the privacy link (plus an unsubscribe link for newsletter mail).
 */
export function renderEmailLayout(layout: EmailLayout): string {
  const { intro, reference, sections = '', outro, button, siteUrl, footerNote, unsubscribeUrl } = layout;
  const cta = button
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 20px;border-radius:999px;">${escapeHtml(button.label)}</a></p>`
    : '';
  const link = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="color:#78716c;text-decoration:underline;">${escapeHtml(label)}</a>`;
  const footerLinks = [
    link(privacyUrl(siteUrl), 'Privacyverklaring'),
    ...(unsubscribeUrl ? [link(unsubscribeUrl, 'Afmelden')] : []),
  ].join(' &nbsp;|&nbsp; ');
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
<div style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;padding:28px;">
<img src="${escapeHtml(emailLogoUrl(siteUrl))}" width="160" height="25" alt="Klusbaas" style="display:block;border:0;outline:none;height:25px;width:160px;margin:0 0 20px;">
<p style="margin:0 0 8px;font-size:15px;line-height:1.5;">${escapeHtml(intro)}</p>
${reference ? `<p style="margin:0;font-size:12px;color:#78716c;">Referentie: <strong>${escapeHtml(reference)}</strong></p>` : ''}
${sections}${cta}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#57534e;">${escapeHtml(outro)}</p>
</div>
<p style="text-align:center;font-size:11px;line-height:1.6;color:#78716c;margin:16px 0 0;">Klusbaas · ${escapeHtml(PLATFORM_CONTACT.email)}${footerNote ? `<br>${escapeHtml(footerNote)}` : ''}<br>${footerLinks}</p>
</div></body></html>`;
}

/** Plain-text footer that mirrors the HTML footer. */
export function emailTextFooter(siteUrl: string, footerNote?: string, unsubscribeUrl?: string): string {
  return [
    '--',
    `Klusbaas · ${PLATFORM_CONTACT.email}`,
    ...(footerNote ? [footerNote] : []),
    `Privacyverklaring: ${privacyUrl(siteUrl)}`,
    ...(unsubscribeUrl ? [`Afmelden: ${unsubscribeUrl}`] : []),
  ].join('\n');
}

export const TRANSACTIONAL_NOTE =
  'Je krijgt deze mail omdat je via Klusbaas een aanvraag deed. Je staat hiermee niet op een nieuwsbrief.';

const textRows = (rows: Row[]) => rows.map((row) => `${row.label}: ${row.value}${row.href && row.href !== row.value ? ` (${row.href})` : ''}`);

export function quotePriceRows(record: QuoteRecord): Row[] {
  return record.lines.map((line) => ({
    label: line.label,
    value: line.included ? 'inbegrepen' : formatEuroCents(line.amountCents),
  }));
}

export function quoteTotalRows(record: QuoteRecord): Row[] {
  return [
    { label: 'Subtotaal (excl. btw)', value: formatEuroCents(record.subtotalCents) },
    { label: 'Btw 21%', value: formatEuroCents(record.vatCents) },
    { label: 'Totaal (incl. btw)', value: formatEuroCents(record.totalCents) },
  ];
}

/**
 * The quote mail for the Klusbaas team (a lead to follow up) or for the
 * customer (their quote, PDF attached). `whatsappUrl` is the ready-made
 * wa.me link the team uses when the customer picked WhatsApp.
 */
export function buildQuoteEmail(
  record: QuoteRecord,
  audience: 'team' | 'customer',
  links: { quoteUrl: string; whatsappUrl?: string }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const delivery = quoteDelivery(record.channel);
  const subject =
    audience === 'team'
      ? `Nieuwe offerte ${record.id}: ${customer.biz} (${record.planName}, ${formatEuroCents(record.subtotalCents)} excl. btw)`
      : `Je offerte ${record.id} van Klusbaas`;
  const intro =
    audience === 'team'
      ? `${customer.owner} van ${customer.biz} heeft via de wizard offerte ${record.id} aangevraagd. De PDF zit in de bijlage.`
      : `Hoi ${firstName}, bedankt voor je aanvraag! In de bijlage vind je offerte ${record.id} als PDF. We nemen binnen één werkdag contact met je op.`;

  const details: Row[] = [
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Contactpersoon', value: customer.owner },
    { label: 'Telefoon', value: customer.phone },
    ...(customer.email ? [{ label: 'E-mail', value: customer.email }] : []),
    { label: 'Plaats', value: customer.city },
    { label: 'Vak', value: record.sectorName },
    { label: 'Stijl', value: record.styleName },
    { label: 'Offerte via', value: record.channel },
    ...(record.appointment
      ? [{ label: 'Voorkeursmoment', value: `${record.appointment.date}${record.appointment.slot ? `, ${record.appointment.slot}` : ''}` }]
      : []),
    { label: 'Geldig tot', value: formatDutchDate(record.validUntil) },
  ];
  const services = record.services.length ? record.services : ['Geen diensten gekozen'];

  const actions: Row[] = [{ label: 'Offerte online', value: 'Bekijk offerte', href: links.quoteUrl }];
  if (audience === 'team' && delivery.whatsapp && links.whatsappUrl) {
    actions.push({ label: 'Stuur via WhatsApp', value: 'Open WhatsApp-bericht aan klant', href: links.whatsappUrl });
  }
  const outro =
    audience === 'team'
      ? delivery.email
        ? `De klant krijgt deze offerte ook per e-mail. Antwoorden op deze mail gaat naar ${customer.email}.`
        : 'De klant koos alleen WhatsApp: stuur de offerte met de WhatsApp-link hierboven.'
      : 'Akkoord of iets wijzigen? Antwoord gewoon op deze mail. Deze offerte is 30 dagen geldig.';

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    'GEGEVENS',
    ...textRows(details),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    'OFFERTE',
    ...textRows(quotePriceRows(record)),
    '',
    ...textRows(quoteTotalRows(record)),
    '',
    ...textRows(actions),
    '',
    outro,
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', table(details)) +
      section('Diensten op de website', `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`) +
      section('Offerte', `${table(quotePriceRows(record))}<hr style="border:0;border-top:1px solid #e7e5e4;margin:12px 0;">${table(quoteTotalRows(record), true)}`) +
      (actions.length > 1 ? section('Acties', table(actions)) : ''),
    outro,
    button: { href: links.quoteUrl, label: 'Bekijk offerte online' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

/**
 * The mail for an offer Klusbaas made by hand for a customer (phase 7.2).
 *
 * The customer did not ask for it, so the text says what happened: Klusbaas
 * wrote an offer, it is in the PDF and the same offer is in his account.
 */
export function buildOfferEmail(
  record: QuoteRecord,
  links: { quoteUrl: string; payment?: PaymentDetails }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const subject = `Je offerte ${record.id} van Klusbaas`;
  const intro = `Hoi ${firstName}, Klusbaas heeft een offerte voor je klaargesteld. In de bijlage vind je offerte ${record.id} als PDF; hieronder staat dezelfde offerte.`;

  const details: Row[] = [
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Contactpersoon', value: customer.owner },
    { label: 'Telefoon', value: customer.phone },
    ...(customer.email ? [{ label: 'E-mail', value: customer.email }] : []),
    { label: 'Plaats', value: customer.city },
    { label: 'Vak', value: record.sectorName },
    { label: 'Stijl', value: record.styleName },
    { label: 'Pakket', value: record.planName },
    { label: 'Geldig tot', value: formatDutchDate(record.validUntil) },
  ];
  const services = record.services.length ? record.services : ['Geen diensten gekozen'];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
      ]
    : [];
  const outro = payment
    ? 'Akkoord of iets wijzigen? Antwoord gewoon op deze mail. Je betaalt daarna via bankoverschrijving; je site blijft online, ook als je nog niet betaald hebt.'
    : 'Akkoord of iets wijzigen? Antwoord gewoon op deze mail. De exacte betaalgegevens staan in je account.';

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    'GEGEVENS',
    ...textRows(details),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    'OFFERTE',
    ...textRows(quotePriceRows(record)),
    '',
    ...textRows(quoteTotalRows(record)),
    '',
    ...(paymentRows.length ? ['BETALEN', ...textRows(paymentRows), ''] : []),
    'Bekijk de offerte online:',
    links.quoteUrl,
    '',
    outro,
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      section('Diensten op de website', `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`) +
      section('Offerte', `${emailTable(quotePriceRows(record))}<hr style="border:0;border-top:1px solid #e7e5e4;margin:12px 0;">${emailTable(quoteTotalRows(record), true)}`) +
      (paymentRows.length ? section('Betalen', emailTable(paymentRows)) : ''),
    outro,
    button: { href: links.quoteUrl, label: 'Bekijk offerte online' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

/**
 * The mail to Klusbaas when a customer accepts an offer on the offer page.
 *
 * The customer said yes: that is the moment the sale is real. The mail has
 * the name he typed, the offer and what he has to transfer.
 */
/**
 * The mail of an offer the customer asked for himself, in his own site
 * editor (phase 7.13).
 *
 * The team mail carries the customer's own words: what he wants Klusbaas to
 * do. The customer mail carries the offer, the price and the way to pay.
 */
export function buildOfferRequestEmail(
  record: QuoteRecord,
  audience: 'team' | 'customer',
  links: {
    quoteUrl: string;
    accountUrl?: string;
    /** What the customer wrote: what he wants Klusbaas to do. */
    message?: string;
    payment?: PaymentDetails;
  }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const message = (links.message ?? '').trim();
  const subject =
    audience === 'team'
      ? `Offerte-aanvraag ${record.id}: ${customer.biz} (${record.planName})`
      : `Je offerte ${record.id} van Klusbaas`;
  const intro =
    audience === 'team'
      ? `${customer.owner} van ${customer.biz} heeft zelf een offerte aangevraagd in zijn site-editor: pakket ${record.planName}, ${formatEuroCents(record.totalCents)} incl. btw.`
      : `Hoi ${firstName}, je offerte ${record.id} staat klaar. In de bijlage vind je hem als PDF; hieronder staat dezelfde offerte. In je account staat hij ook, met de status en hoe je betaalt.`;

  const details: Row[] = [
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Contactpersoon', value: customer.owner },
    { label: 'Telefoon', value: customer.phone },
    ...(customer.email ? [{ label: 'E-mail', value: customer.email }] : []),
    { label: 'Plaats', value: customer.city },
    { label: 'Vak', value: record.sectorName },
    { label: 'Stijl', value: record.styleName },
    { label: 'Pakket', value: record.planName },
    { label: 'Geldig tot', value: formatDutchDate(record.validUntil) },
    ...(message ? [{ label: 'Wat hij wil', value: message }] : []),
  ];
  const services = record.services.length ? record.services : ['Geen diensten gekozen'];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
      ]
    : [];
  const actions: Row[] = [{ label: 'Offerte online', value: 'Bekijk offerte', href: links.quoteUrl }];
  if (links.accountUrl) {
    actions.push({ label: 'Mijn account', value: 'Open je account', href: links.accountUrl });
  }
  const outro =
    audience === 'team'
      ? 'De klant vraagt deze offerte zelf aan. Hij vindt hem in zijn account en kan hem daar accepteren en betalen.'
      : payment
        ? 'Akkoord of iets wijzigen? Antwoord gewoon op deze mail, of neem hem aan in je account. Je betaalt daarna via bankoverschrijving; je site blijft online, ook als je nog niet betaald hebt.'
        : 'Akkoord of iets wijzigen? Antwoord gewoon op deze mail, of neem hem aan in je account.';

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    'GEGEVENS',
    ...textRows(details),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    'OFFERTE',
    ...textRows(quotePriceRows(record)),
    '',
    ...textRows(quoteTotalRows(record)),
    '',
    ...(paymentRows.length ? ['BETALEN', ...textRows(paymentRows), ''] : []),
    ...textRows(actions),
    '',
    outro,
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', table(details)) +
      section('Diensten op de website', `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')}</ul>`) +
      section('Offerte', `${table(quotePriceRows(record))}<hr style="border:0;border-top:1px solid #e7e5e4;margin:12px 0;">${table(quoteTotalRows(record), true)}`) +
      (paymentRows.length ? section('Betalen', table(paymentRows)) : '') +
      section('Acties', table(actions)),
    outro,
    button: { href: links.quoteUrl, label: 'Bekijk offerte online' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

export function buildAcceptEmail(
  record: QuoteRecord,
  links: { siteUrl?: string } = {}
): LeadEmail {
  const siteUrl = links.siteUrl ?? DEFAULT_SITE_URL;
  const { customer } = record;
  const subject = `Offerte ${record.id} is geaccepteerd door ${customer.owner}`;
  const intro = `${customer.owner} van ${customer.biz} heeft offerte ${record.id} geaccepteerd.`;
  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Contactpersoon', value: customer.owner },
    { label: 'Telefoon', value: customer.phone },
    ...(customer.email ? [{ label: 'E-mail', value: customer.email }] : []),
    { label: 'Plaats', value: customer.city },
    { label: 'Pakket', value: record.planName },
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
  ];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    'De klant heeft nog niet betaald. Zodra het bedrag binnen is, markeer je de',
    'offerte als betaald in het overzicht.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections: section('Gegevens', emailTable(details)),
    outro:
      'De klant heeft nog niet betaald. Zodra het bedrag binnen is, markeer je de offerte als betaald in het overzicht.',
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}


/**
 * The mail to the customer right after he accepts an offer.
 *
 * The banner on the offer page disappears when he closes his browser. This
 * mail is the durable proof of his "ja": what he agreed to, what it costs
 * and where he has to transfer the money to. It is the same moment the
 * customer can show to his bookkeeper.
 */
export function buildAcceptConfirmationEmail(
  record: QuoteRecord,
  links: { quoteUrl: string; payment?: PaymentDetails }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const subject = `Je akkoord voor offerte ${record.id} is binnen`;
  const intro = `Hoi ${firstName}, bedankt voor je akkoord op offerte ${record.id}. Hieronder staat je aanvraag op een rij.`;

  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Pakket', value: record.planName },
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
  ];
  const services = record.services.length ? record.services : ['Geen diensten gekozen'];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
        { label: 'Omschrijving', value: record.id },
      ]
    : [];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    ...(paymentRows.length
      ? [
          'BETALEN',
          ...textRows(paymentRows),
          'Je site blijft online, ook als je nog niet betaald hebt.',
          '',
        ]
      : []),
    'Bekijk je offerte online:',
    links.quoteUrl,
    '',
    'Vragen? Antwoord gewoon op deze mail. We plannen de bouw in en nemen contact',
    'met je op.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      section(
        'Diensten op de website',
        `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')}</ul>`
      ) +
      (paymentRows.length ? section('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Je site blijft online, ook als je nog niet betaald hebt. We plannen de bouw in en nemen contact met je op. Vragen? Antwoord gewoon op deze mail.',
    button: { href: links.quoteUrl, label: 'Bekijk je offerte' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

/**
 * The mail to the customer when Klusbaas sends a reminder about an offer.
 *
 * An offer that stays open is an offer nobody said yes to. Klusbaas chases
 * it by hand: this mail is the nudge, with the link to the offer and the
 * amount again, so the customer does not have to dig for it.
 */
export function buildReminderEmail(
  record: QuoteRecord,
  links: { quoteUrl: string; payment?: PaymentDetails }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const subject = `Herinnering: je offerte ${record.id} staat nog open`;
  const intro = `Hoi ${firstName}, even een herinnering: je offerte ${record.id} staat nog open. Wil je de website laten bouwen?`;

  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Pakket', value: record.planName },
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
    { label: 'Geldig tot', value: formatDutchDate(record.validUntil) },
  ];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
      ]
    : [];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    ...(paymentRows.length ? ['BETALEN', ...textRows(paymentRows), ''] : []),
    'Bekijk de offerte online:',
    links.quoteUrl,
    '',
    'Wil je niets? Laat het weten, dan sluiten we de offerte. Vragen? Antwoord',
    'gewoon op deze mail.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      (paymentRows.length ? section('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Wil je niets? Laat het weten, dan sluiten we de offerte. Vragen? Antwoord gewoon op deze mail.',
    button: { href: links.quoteUrl, label: 'Bekijk offerte online' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}


/**
 * The mail to the customer who said yes but has not paid yet.
 *
 * The customer accepted the offer, so the sale is real; the money is not in
 * yet. This mail reminds him of the amount and the IBAN, so he does not have
 * to dig for the first mail. It is a nudge, never a scolding: the site stays
 * online whether he pays today or next week.
 */
export function buildPaymentReminderEmail(
  record: QuoteRecord,
  links: { quoteUrl: string; payment?: PaymentDetails }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const subject = `Je betaling voor offerte ${record.id} is nog niet binnen`;
  const intro = `Hoi ${firstName}, je hebt offerte ${record.id} geaccepteerd, maar het bedrag is nog niet binnen. Hieronder staat hoe je het overmaakt.`;

  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Pakket', value: record.planName },
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
  ];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
        { label: 'Omschrijving', value: record.id },
      ]
    : [];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    ...(paymentRows.length
      ? ['BETALEN', ...textRows(paymentRows), 'Je site blijft online, ook als je nog niet betaald hebt.', '']
      : ['Klusbaas stuurt je de betaalgegevens apart.', '']),
    'Bekijk je offerte online:',
    links.quoteUrl,
    '',
    'Al betaald? Dan klopt het bedrag misschien nog niet helemaal. Laat het weten,',
    'dan kijken we ernaar. Vragen? Antwoord gewoon op deze mail.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      (paymentRows.length ? section('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Je site blijft online, ook als je nog niet betaald hebt. Al betaald? Laat het weten, dan kijken we ernaar. Vragen? Antwoord gewoon op deze mail.',
    button: { href: links.quoteUrl, label: 'Bekijk je offerte' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}


/**
 * The mail to Klusbaas when the customer says he transferred the money.
 *
 * The customer cannot mark his own offer as paid: only Klusbaas checks the
 * bank statement and decides. This mail is the signal that there is money to
 * check, so an order that looks forgotten stops looking like a sale.
 */
export function buildPaymentReportedEmail(
  record: QuoteRecord,
  links: { quoteUrl: string; payment?: PaymentDetails }
): LeadEmail {
  const siteUrl = new URL(links.quoteUrl).origin;
  const { customer } = record;
  const subject = `Klant meldt betaling voor offerte ${record.id}`;
  const intro = `${customer.owner} van ${customer.biz} zegt dat het bedrag voor offerte ${record.id} is overgemaakt.`;

  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Contactpersoon', value: customer.owner },
    { label: 'Telefoon', value: customer.phone },
    ...(customer.email ? [{ label: 'E-mail', value: customer.email }] : []),
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
    { label: 'Gemeld op', value: formatDutchDate(record.paymentReportedAt ?? record.createdAt) },
  ];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
      ]
    : [];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    ...(paymentRows.length ? ['BETALEN', ...textRows(paymentRows), ''] : []),
    'Controleer je bankrekening. Pas als het bedrag binnen is, markeer je de offerte',
    'als betaald in het overzicht; dan gaat er een factuur naar de klant.',
    '',
    'Bekijk de offerte online:',
    links.quoteUrl,
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      (paymentRows.length ? section('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Controleer je bankrekening. Pas als het bedrag binnen is, markeer je de offerte als betaald in het overzicht; dan gaat er een factuur naar de klant.',
    button: { href: links.quoteUrl, label: 'Bekijk de offerte' },
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

/**
 * The mail to the customer when Klusbaas marks his offer as paid.
 *
 * The customer transferred the money and waits for a reply. This mail says
 * that the money arrived, what he paid for and what happens next. The
 * invoice is attached as a PDF.
 */
export function buildPaidEmail(
  record: QuoteRecord,
  links: { siteUrl?: string; paidAt?: string } = {}
): LeadEmail {
  const siteUrl = links.siteUrl ?? DEFAULT_SITE_URL;
  const { customer } = record;
  const paidAt = links.paidAt ?? record.paidAt ?? record.createdAt;
  const firstName = customer.owner.split(' ')[0] || customer.owner;
  const subject = `Je betaling voor offerte ${record.id} is binnen`;
  const intro = `Hoi ${firstName}, je betaling voor offerte ${record.id} is binnen. De factuur staat als PDF bij deze mail.`;

  const details: Row[] = [
    { label: 'Offerte', value: record.id },
    { label: 'Bedrijf', value: customer.biz },
    { label: 'Betaald op', value: formatDutchDate(paidAt) },
    { label: 'Pakket', value: record.planName },
    { label: 'Bedrag incl. btw', value: formatEuroCents(record.totalCents) },
  ];
  const services = record.services.length ? record.services : ['Geen diensten gekozen'];

  const text = [
    intro,
    '',
    `Referentie: ${record.id}`,
    '',
    ...textRows(details),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    'Wat nu?',
    'Je site blijft online. We plannen de bouw in en nemen contact met je op voor',
    'de oplevering. Vragen? Antwoord gewoon op deze mail.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');

  const html = renderEmailLayout({
    intro,
    reference: record.id,
    sections:
      section('Gegevens', emailTable(details)) +
      section(
        'Diensten op de website',
        `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
      ),
    outro:
      'Je site blijft online. We plannen de bouw in en nemen contact met je op voor de oplevering. Vragen? Antwoord gewoon op deze mail.',
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });

  return { subject, text, html };
}

/** Mail for a lead from one of the site forms (afspraak, contact, storing, m²). */
/**
 * The mail for a lead from a site.
 *
 * - `team`: the notification for Klusbaas about a lead on a Klusbaas demo.
 * - `customer`: the confirmation for the visitor who filled in the form.
 * - `owner`: the lead for the craftsman whose published site it is. The
 *   visitor's details go to him, because his site asked for them.
 */
export function buildSiteLeadEmail(
  lead: SiteLead,
  audience: 'team' | 'customer' | 'owner',
  reference: string,
  siteUrl: string = DEFAULT_SITE_URL,
  options: { ownerFirstName?: string } = {}
): LeadEmail {
  const label = LEAD_TYPE_LABELS[lead.type];
  const who = lead.fields.name || 'Een bezoeker';
  const sectorName = SECTORS[lead.site.sector]?.name ?? lead.site.sector;
  const ownerFirstName = options.ownerFirstName ?? '';
  const subject =
    audience === 'team'
      ? `${label}: ${who} via ${lead.site.biz} · ${reference}`
      : audience === 'owner'
        ? `Nieuwe aanvraag via je website · ${reference}`
        : `We hebben je ${label.toLowerCase()} ontvangen · ${reference}`;
  const intro =
    audience === 'team'
      ? `Nieuwe ${label.toLowerCase()} via de site van ${lead.site.biz} (${sectorName}).`
      : audience === 'owner'
        ? `Hoi ${ownerFirstName || ''}, iemand heeft contact opgenomen via jouw website (${lead.site.biz}).`.replace(
            'Hoi ,',
            'Hoi,'
          )
        : `Hoi ${lead.fields.name || ''}, bedankt! We hebben je ${label.toLowerCase()} voor ${lead.site.biz} ontvangen en nemen snel contact met je op.`.replace('Hoi ,', 'Hoi,');
  const rows: Row[] = [
    ...leadFieldRows(lead),
    { label: 'Website', value: `${lead.site.biz}${lead.site.style ? ` (${lead.site.style})` : ''}` },
  ];
  const outro =
    audience === 'team'
      ? lead.fields.email
        ? `Antwoorden op deze mail gaat naar ${lead.fields.email}.`
        : `Neem contact op via ${lead.fields.phone}.`
      : audience === 'owner'
        ? `Bel of mail ${who} terug: ${lead.fields.phone}${lead.fields.email ? ` · ${lead.fields.email}` : ''}.`
        : 'Klopt er iets niet? Antwoord gewoon op deze mail.';
  const text = [intro, '', `Referentie: ${reference}`, '', ...textRows(rows), '', outro, '', emailTextFooter(siteUrl, TRANSACTIONAL_NOTE)].join('\n');
  const html = renderEmailLayout({
    intro,
    reference,
    sections: section('Gegevens', table(rows)),
    outro,
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });
  return { subject, text, html };
}
