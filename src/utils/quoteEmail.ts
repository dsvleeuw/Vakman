import { PLATFORM_CONTACT } from '../data/platform';
import { SECTORS, STYLES } from '../data/tradesData';
import { formatPrice } from './pricing';
import type { Quote, QuoteRequest } from './quote';

export type QuoteEmailAudience = 'team' | 'customer';

export interface QuoteEmail {
  subject: string;
  text: string;
  html: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Euro amount with cents only when there are cents (€ 1.243,95 / € 995). */
export function formatEuro(amount: number): string {
  if (Number.isInteger(amount)) return formatPrice(amount);
  return `€ ${amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface Row {
  label: string;
  value: string;
}

function detailRows(request: QuoteRequest): Row[] {
  const rows: Row[] = [
    { label: 'Bedrijf', value: request.form.biz },
    { label: 'Contactpersoon', value: request.form.owner },
    { label: 'Telefoon', value: request.form.phone },
    { label: 'E-mail', value: request.form.email },
    { label: 'Plaats', value: request.form.city },
    { label: 'Vak', value: SECTORS[request.sector].name },
    { label: 'Stijl', value: STYLES[request.styleIndex].name },
    { label: 'Contact via', value: request.channel },
  ];
  if (request.appointment) {
    rows.push({
      label: 'Voorkeursmoment',
      value: `${request.appointment.date}${request.appointment.slot ? `, ${request.appointment.slot}` : ''}`,
    });
  }
  return rows;
}

function priceRows(quote: Quote): Row[] {
  return [
    { label: `Pakket ${quote.planName}`, value: formatEuro(quote.planPrice) },
    ...quote.addons.map((line) => ({
      label: line.label,
      value: line.included ? 'inbegrepen' : formatEuro(line.price),
    })),
  ];
}

/**
 * Build the e-mail for either the Klusbaas team (a lead to follow up) or the
 * customer (a confirmation with the same quote). Plain text and HTML carry
 * identical content so every mail client shows the full quote.
 */
export function buildQuoteEmail(
  quote: Quote,
  request: QuoteRequest,
  audience: QuoteEmailAudience,
  reference: string
): QuoteEmail {
  const firstName = request.form.owner.split(' ')[0] || request.form.owner;
  const subject =
    audience === 'team'
      ? `Nieuwe offerte-aanvraag: ${request.form.biz} (${quote.planName}, ${formatEuro(quote.subtotal)} excl. btw) · ${reference}`
      : `Je offerte-aanvraag bij Klusbaas · ${reference}`;
  const intro =
    audience === 'team'
      ? `${request.form.owner} van ${request.form.biz} heeft via de wizard een offerte aangevraagd.`
      : `Hoi ${firstName}, bedankt voor je aanvraag! Hieronder staat je samenstelling. We nemen binnen één werkdag contact met je op om alles door te nemen.`;

  const details = detailRows(request);
  const prices = priceRows(quote);
  const totals: Row[] = [
    { label: 'Subtotaal (excl. btw)', value: formatEuro(quote.subtotal) },
    { label: 'Btw 21%', value: formatEuro(quote.vat) },
    { label: 'Totaal (incl. btw)', value: formatEuro(quote.total) },
  ];
  const services = request.services.length ? request.services : ['Geen diensten gekozen'];
  const outro =
    audience === 'team'
      ? `Antwoorden op deze mail gaat rechtstreeks naar ${request.form.email}.`
      : `Vragen of iets wijzigen? Antwoord gewoon op deze mail of app ons op ${PLATFORM_CONTACT.whatsapp}. Dit is een indicatie; de definitieve offerte volgt na ons gesprek.`;

  const text = [
    intro,
    '',
    `Referentie: ${reference}`,
    '',
    'GEGEVENS',
    ...details.map((row) => `${row.label}: ${row.value}`),
    '',
    'DIENSTEN OP DE WEBSITE',
    ...services.map((service) => `- ${service}`),
    '',
    'OFFERTE',
    ...prices.map((row) => `${row.label}: ${row.value}`),
    '',
    ...totals.map((row) => `${row.label}: ${row.value}`),
    '',
    outro,
  ].join('\n');

  const tableRows = (rows: Row[], strongLast = false) =>
    rows
      .map((row, index) => {
        const strong = strongLast && index === rows.length - 1;
        const weight = strong ? 'font-weight:800;font-size:16px;' : '';
        return `<tr><td style="padding:6px 0;color:#57534e;${weight}">${escapeHtml(row.label)}</td><td style="padding:6px 0;text-align:right;color:#1c1917;font-weight:700;${weight}">${escapeHtml(row.value)}</td></tr>`;
      })
      .join('');

  const section = (title: string, body: string) =>
    `<h2 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;">${escapeHtml(title)}</h2>${body}`;

  const html = `<!doctype html><html lang="nl"><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
<div style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;padding:28px;">
<div style="font-weight:900;font-size:20px;margin-bottom:16px;">Klusbaas</div>
<p style="margin:0 0 8px;font-size:15px;line-height:1.5;">${escapeHtml(intro)}</p>
<p style="margin:0;font-size:12px;color:#78716c;">Referentie: <strong>${escapeHtml(reference)}</strong></p>
${section('Gegevens', `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${tableRows(details)}</table>`)}
${section('Diensten op de website', `<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;">${services.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`)}
${section('Offerte', `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${tableRows(prices)}</table><hr style="border:0;border-top:1px solid #e7e5e4;margin:12px 0;"><table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${tableRows(totals, true)}</table>`)}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#57534e;">${escapeHtml(outro)}</p>
</div>
<p style="text-align:center;font-size:11px;color:#a8a29e;margin:16px 0 0;">Klusbaas · ${escapeHtml(PLATFORM_CONTACT.email)}</p>
</div></body></html>`;

  return { subject, text, html };
}

/** Short, human-friendly reference such as KB-7Q4M2X. */
export function createQuoteReference(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(random() * alphabet.length)];
  return `KB-${code}`;
}
