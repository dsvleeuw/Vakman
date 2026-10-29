/**
 * The mails a customer account sends: a password reset and a confirmation
 * of the e-mail address.
 *
 * The mails are plain and short. They say what the customer has to do and
 * they never say anything about another customer.
 */

export interface AccountMail {
  subject: string;
  text: string;
  html: string;
}

const escape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function layout(heading: string, paragraphs: string[], action: { label: string; url: string }): string {
  const button = `<p><a href="${escape(action.url)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">${escape(
    action.label
  )}</a></p>`;
  const link = `<p style="font-size:13px;color:#57534e;word-break:break-all">Of plak deze link in je browser:<br><a href="${escape(
    action.url
  )}">${escape(action.url)}</a></p>`;
  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1c1917">',
    `<h1 style="font-size:22px;margin:0 0 16px">${escape(heading)}</h1>`,
    ...paragraphs.map((text) => `<p>${escape(text)}</p>`),
    button,
    link,
    '<p style="font-size:13px;color:#57534e">Klusbaas · je website, je eigen adres.</p>',
    '</div>',
  ].join('');
}

/** The mail with the link to set a new password. */
export function buildResetMail(input: { name?: string; url: string }): AccountMail {
  const greeting = input.name ? `Hoi ${input.name},` : 'Hoi,';
  const subject = 'Reset je wachtwoord voor je Klusbaas-account';
  const paragraphs = [
    `${greeting} je hebt een nieuw wachtwoord aangevraagd. Klik op de knop hieronder en kies een nieuw wachtwoord.`,
    'De link werkt een uur. Heb je dit niet aangevraagd? Dan is er niets aan de hand: je wachtwoord blijft hetzelfde en je hoeft niets te doen.',
  ];
  return {
    subject,
    text: [
      subject,
      '',
      ...paragraphs,
      '',
      `Link: ${input.url}`,
      '',
      'Klusbaas · je website, je eigen adres.',
    ].join('\n'),
    html: layout('Reset je wachtwoord', paragraphs, { label: 'Kies een nieuw wachtwoord', url: input.url }),
  };
}

/** The mail with the link to confirm the e-mail address. */
export function buildVerifyMail(input: { name?: string; url: string }): AccountMail {
  const greeting = input.name ? `Hoi ${input.name},` : 'Hoi,';
  const subject = 'Bevestig je e-mailadres voor je Klusbaas-account';
  const paragraphs = [
    `${greeting} je account staat klaar. Bevestig dit e-mailadres, dan is je account compleet en kun je je site publiceren.`,
    'De link werkt een dag. Heb je hem niet ontvangen? Vraag dan gewoon een nieuwe link aan in je account.',
  ];
  return {
    subject,
    text: [
      subject,
      '',
      ...paragraphs,
      '',
      `Link: ${input.url}`,
      '',
      'Klusbaas · je website, je eigen adres.',
    ].join('\n'),
    html: layout('Bevestig je e-mailadres', paragraphs, { label: 'Bevestig mijn e-mailadres', url: input.url }),
  };
}
