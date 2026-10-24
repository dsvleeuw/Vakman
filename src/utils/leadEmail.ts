import { SECTORS } from '../data/tradesData';
import { LEAD_KIND_LABELS, type Lead } from './lead';
import { escapeHtml, formatEuro, type QuoteEmail } from './quoteEmail';

/**
 * E-mails for the non-quote forms (contact, storing, m²-offerte, afspraak).
 * The wizard quote has its own, richer mail in `quoteEmail.ts`.
 */

type NonQuoteLead = Exclude<Lead, { kind: 'offerte' }>;

interface Row {
  label: string;
  value: string;
}

function leadRows(lead: NonQuoteLead): Row[] {
  const rows: Row[] = [
    { label: 'Naam', value: lead.name },
    { label: 'Telefoon', value: lead.phone },
  ];
  if (lead.email) rows.push({ label: 'E-mail', value: lead.email });
  switch (lead.kind) {
    case 'contact':
      break;
    case 'storing':
      rows.push(
        { label: 'Adres', value: lead.address },
        { label: 'Soort storing', value: lead.faultType },
        { label: 'Speelt sinds', value: lead.since },
        { label: 'Urgentie', value: lead.urgency }
      );
      break;
    case 'oppervlak':
      rows.push(
        { label: 'Werk', value: lead.serviceName },
        { label: 'Oppervlakte', value: `${lead.surfaceM2.toLocaleString('nl-NL')} m²` },
        { label: 'Wanden / correcties', value: `${lead.wallCount} wand(en), ${lead.openings} deur/raam` },
        { label: 'Prijs per m²', value: formatEuro(lead.pricePerM2) },
        { label: 'Richtprijs', value: formatEuro(lead.totalPrice) }
      );
      break;
    case 'afspraak':
      rows.push(
        { label: 'Adres', value: lead.address },
        { label: 'Dienst', value: lead.service },
        { label: 'Voorkeur', value: `${lead.date}${lead.slot ? `, ${lead.slot}` : ''}` }
      );
      break;
  }
  return rows;
}

function freeText(lead: NonQuoteLead): string {
  if (lead.kind === 'contact') return lead.message;
  if (lead.kind === 'storing') return lead.details;
  if (lead.kind === 'afspraak') return lead.notes;
  return '';
}

function siteRows(lead: NonQuoteLead): Row[] {
  const rows: Row[] = [{ label: 'Website', value: lead.site.biz }];
  if (lead.site.sector) rows.push({ label: 'Vak', value: SECTORS[lead.site.sector].name });
  if (lead.site.path) rows.push({ label: 'Pagina', value: lead.site.path });
  return rows;
}

const table = (rows: Row[]) =>
  `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:14px;">${rows
    .map(
      (row) =>
        `<tr><td style="padding:6px 0;color:#57534e;vertical-align:top;">${escapeHtml(row.label)}</td><td style="padding:6px 0;text-align:right;color:#1c1917;font-weight:700;">${escapeHtml(row.value)}</td></tr>`
    )
    .join('')}</table>`;

function layout(intro: string, reference: string, body: string, outro: string): string {
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif;color:#1c1917;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
<div style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;padding:28px;">
<div style="font-weight:900;font-size:20px;margin-bottom:16px;">Klusbaas</div>
<p style="margin:0 0 8px;font-size:15px;line-height:1.5;">${escapeHtml(intro)}</p>
<p style="margin:0;font-size:12px;color:#78716c;">Referentie: <strong>${escapeHtml(reference)}</strong></p>
${body}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#57534e;">${escapeHtml(outro)}</p>
</div></div></body></html>`;
}

const heading = (title: string) =>
  `<h2 style="margin:24px 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#78716c;">${escapeHtml(title)}</h2>`;

/** Lead notification for the Klusbaas inbox. Reply-to is the visitor. */
export function buildLeadTeamEmail(lead: NonQuoteLead, reference: string): QuoteEmail {
  const label = LEAD_KIND_LABELS[lead.kind];
  const subject = `Nieuwe lead: ${label} · ${lead.name} via ${lead.site.biz} · ${reference}`;
  const intro = `${lead.name} heeft het ${label.toLowerCase()} ingevuld op de website van ${lead.site.biz}.`;
  const details = leadRows(lead);
  const site = siteRows(lead);
  const message = freeText(lead);
  const outro = lead.email
    ? `Antwoorden op deze mail gaat rechtstreeks naar ${lead.email}.`
    : `Bel of app ${lead.name} op ${lead.phone}.`;

  const text = [
    intro,
    '',
    `Referentie: ${reference}`,
    '',
    'GEGEVENS',
    ...details.map((row) => `${row.label}: ${row.value}`),
    ...(message ? ['', 'BERICHT', message] : []),
    '',
    'BRON',
    ...site.map((row) => `${row.label}: ${row.value}`),
    '',
    outro,
  ].join('\n');

  const html = layout(
    intro,
    reference,
    `${heading('Gegevens')}${table(details)}${
      message
        ? `${heading('Bericht')}<p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHtml(message)}</p>`
        : ''
    }${heading('Bron')}${table(site)}`,
    outro
  );
  return { subject, text, html };
}

/** Confirmation for the visitor, only sent when they left an e-mail address. */
export function buildLeadCustomerEmail(lead: NonQuoteLead, reference: string): QuoteEmail {
  const firstName = lead.name.split(' ')[0] || lead.name;
  const subject = `We hebben je aanvraag ontvangen · ${reference}`;
  const intro = `Hoi ${firstName}, bedankt voor je bericht aan ${lead.site.biz}. We nemen zo snel mogelijk contact met je op.`;
  const details = leadRows(lead);
  const message = freeText(lead);
  const outro = 'Iets vergeten of wijzigen? Antwoord gewoon op deze mail.';
  const text = [
    intro,
    '',
    `Referentie: ${reference}`,
    '',
    ...details.map((row) => `${row.label}: ${row.value}`),
    ...(message ? ['', message] : []),
    '',
    outro,
  ].join('\n');
  const html = layout(
    intro,
    reference,
    `${heading('Je aanvraag')}${table(details)}${
      message ? `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHtml(message)}</p>` : ''
    }`,
    outro
  );
  return { subject, text, html };
}
