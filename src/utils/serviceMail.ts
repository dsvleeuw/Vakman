import { PLATFORM_CONTACT } from '../data/platform';
import type { PaymentDetails, ServiceState } from '../types';
import {
  emailSection,
  emailTable,
  emailTextFooter,
  renderEmailLayout,
  TRANSACTIONAL_NOTE,
  type Row,
} from './leadEmail';
import {
  serviceAmountWithVat,
  servicePriceText,
  serviceReference,
} from './service';
import { formatEuroCents } from './quote';

/**
 * The mails of the monthly service (phase 7.15).
 *
 * The customer asks for the service in his own account; Klusbaas sees it in
 * his overview, switches it on and sends a monthly invoice. Every mail says
 * the same thing as the page it comes from: what the service costs, that it
 * can be stopped every month and that the site and the code stay the
 * customer's.
 */

export interface ServiceMail {
  subject: string;
  text: string;
  html: string;
}

/** Who the service is about. */
export interface ServiceSubject {
  /** The name of the customer. */
  name: string;
  /** The name of his business. */
  biz: string;
  /** Where he works. */
  city: string;
  /** The site the service is about. */
  siteSlug: string;
}

const textRows = (rows: Row[]) =>
  rows.map((row) => `${row.label}: ${row.value}${row.href && row.href !== row.value ? ` (${row.href})` : ''}`);

const firstName = (name: string) => name.trim().split(' ')[0] || name.trim();

/**
 * The mail to Klusbaas: a customer asks for the service.
 *
 * The customer gets a confirmation on the page itself; Klusbaas has to know
 * about it, because the service only runs when he confirms it.
 */
export function buildServiceRequestedEmail(subject: ServiceSubject): ServiceMail {
  const siteUrl = 'https://klusbaas.nl';
  const intro = `${subject.biz} vraagt de maandelijkse service aan.`;
  const details: Row[] = [
    { label: 'Bedrijf', value: subject.biz },
    { label: 'Naam', value: subject.name },
    { label: 'Plaats', value: subject.city },
    { label: 'Site', value: `/site/${subject.siteSlug}` },
    { label: 'Service', value: servicePriceText() },
  ];
  const text = [
    intro,
    '',
    ...textRows(details),
    '',
    'Zet de service aan in /klusbaas. De klant betaalt de eerste maand per',
    'bankoverschrijving; de maandfactuur daarna stuur je zelf.',
    '',
    emailTextFooter(siteUrl),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    sections: emailSection('Gegevens', emailTable(details)),
    outro:
      'Zet de service aan in /klusbaas. De klant betaalt de eerste maand per bankoverschrijving; de maandfactuur daarna stuur je zelf.',
    siteUrl,
  });
  return { subject: `${subject.biz} vraagt de maandelijkse service aan`, text, html };
}

/** The mail to Klusbaas: a customer stops the service. */
export function buildServiceCancelNoticeEmail(subject: ServiceSubject): ServiceMail {
  const siteUrl = 'https://klusbaas.nl';
  const intro = `${subject.biz} stopt de maandelijkse service.`;
  const details: Row[] = [
    { label: 'Bedrijf', value: subject.biz },
    { label: 'Naam', value: subject.name },
    { label: 'Site', value: `/site/${subject.siteSlug}` },
  ];
  const text = [
    intro,
    '',
    ...textRows(details),
    '',
    'Lever de site en de code aan de klant terug, zoals in de voorwaarden staat.',
    '',
    emailTextFooter(siteUrl),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    sections: emailSection('Gegevens', emailTable(details)),
    outro: 'Lever de site en de code aan de klant terug, zoals in de voorwaarden staat.',
    siteUrl,
  });
  return { subject: `${subject.biz} stopt de maandelijkse service`, text, html };
}

/**
 * The mail to the customer: Klusbaas switched the service on.
 *
 * The customer sees what it costs, how he pays and that he can stop it
 * every month. Without a payment address the mail says so, instead of
 * showing an empty bank account.
 */
export function buildServiceActivatedEmail(
  subject: ServiceSubject,
  service: ServiceState,
  links: { payment?: PaymentDetails; siteUrl?: string }
): ServiceMail {
  const siteUrl = links.siteUrl ?? 'https://klusbaas.nl';
  const reference = serviceReference(service.siteSlug ?? subject.siteSlug);
  const details: Row[] = [
    { label: 'Bedrijf', value: subject.biz },
    { label: 'Site', value: `/site/${subject.siteSlug}` },
    { label: 'Prijs', value: service.amountCents > 0 ? servicePriceText(service.amountCents) : 'gratis' },
  ];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
        { label: 'Omschrijving', value: reference },
      ]
    : [];
  const intro =
    service.amountCents > 0
      ? `Hoi ${firstName(subject.name)}, je service staat aan. Vanaf nu komt er elke maand een factuur van ${formatEuroCents(serviceAmountWithVat(service.amountCents))}.`
      : `Hoi ${firstName(subject.name)}, je service staat aan. De maanden die bij je pakket horen zijn gratis; daarna betaal je ${servicePriceText()}.`;
  const text = [
    intro,
    '',
    ...textRows(details),
    '',
    ...(paymentRows.length
      ? ['BETALEN', ...textRows(paymentRows), '']
      : ['Klusbaas stuurt je de betaalgegevens apart.', '']),
    'Wat er in zit:',
    '- hosting en SSL',
    '- doorontwikkeling en beveiligingsupdates',
    '- één aanpassing per maand',
    '- support binnen één werkdag',
    '',
    'Je site en de code blijven van jou. Je kunt de service elk moment stoppen;',
    'dan leveren wij de site en de code aan je terug.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    reference,
    sections:
      emailSection('Gegevens', emailTable(details)) +
      (paymentRows.length ? emailSection('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Je site en de code blijven van jou. Je kunt de service elk moment stoppen; dan leveren wij de site en de code aan je terug.',
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });
  return { subject: `Je service staat aan`, text, html };
}

/** The mail to the customer: the monthly invoice of the service. */
export function buildServiceInvoiceEmail(
  subject: ServiceSubject,
  service: ServiceState,
  links: { payment?: PaymentDetails; siteUrl?: string }
): ServiceMail {
  const siteUrl = links.siteUrl ?? 'https://klusbaas.nl';
  const reference = serviceReference(service.siteSlug ?? subject.siteSlug);
  const amount = serviceAmountWithVat(service.amountCents);
  const details: Row[] = [
    { label: 'Bedrijf', value: subject.biz },
    { label: 'Site', value: `/site/${subject.siteSlug}` },
    { label: 'Maandbedrag incl. btw', value: formatEuroCents(amount) },
    { label: 'Omschrijving', value: reference },
  ];
  const payment = links.payment;
  const paymentRows: Row[] = payment
    ? [
        { label: 'Bankrekening (IBAN)', value: payment.iban },
        { label: 'Ten name van', value: payment.name },
        ...(payment.email ? [{ label: 'E-mail', value: payment.email }] : []),
      ]
    : [];
  const intro = `Hoi ${firstName(subject.name)}, hier is de maandfactuur voor je service: ${formatEuroCents(amount)}.`;
  const text = [
    intro,
    '',
    ...textRows(details),
    '',
    ...(paymentRows.length
      ? ['BETALEN', ...textRows(paymentRows), '']
      : ['Klusbaas stuurt je de betaalgegevens apart.', '']),
    'Zet de omschrijving erbij, dan weet ik van wie de betaling is.',
    'Je site blijft online, ook als de betaling nog niet binnen is.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    reference,
    sections:
      emailSection('Gegevens', emailTable(details)) +
      (paymentRows.length ? emailSection('Betalen', emailTable(paymentRows)) : ''),
    outro:
      'Zet de omschrijving erbij, dan weet ik van wie de betaling is. Je site blijft online, ook als de betaling nog niet binnen is.',
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });
  return { subject: `Je maandfactuur voor de service: ${formatEuroCents(amount)}`, text, html };
}

/** The mail to the customer: the service has been stopped. */
export function buildServiceStoppedEmail(
  subject: ServiceSubject,
  links: { siteUrl?: string }
): ServiceMail {
  const siteUrl = links.siteUrl ?? 'https://klusbaas.nl';
  const intro = `Hoi ${firstName(subject.name)}, je service is gestopt.`;
  const text = [
    intro,
    '',
    'Je site blijft online. Klusbaas levert de site en de code aan je terug,',
    'zodat je hem altijd mee kunt nemen naar een andere partij.',
    '',
    'Vragen? Antwoord gewoon op deze mail.',
    '',
    emailTextFooter(siteUrl, TRANSACTIONAL_NOTE),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    outro:
      'Je site blijft online. Klusbaas levert de site en de code aan je terug, zodat je hem altijd mee kunt nemen naar een andere partij. Vragen? Antwoord gewoon op deze mail.',
    siteUrl,
    footerNote: TRANSACTIONAL_NOTE,
  });
  return { subject: 'Je service is gestopt', text, html };
}

/** The address Klusbaas gets the service mails on. */
export const SERVICE_TEAM_EMAIL = PLATFORM_CONTACT.email;
