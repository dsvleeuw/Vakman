import { isValidEmail } from './contact';
export { NEWSLETTER_CONSENT_TEXT, isNewsletterPageStatus, isNewsletterToken, NEWSLETTER_PAGE_STATUSES, type NewsletterPageStatus } from './newsletterStatus';
import { emailTextFooter, escapeHtml, renderEmailLayout, type LeadEmail } from './leadEmail';

/**
 * Newsletter with double opt-in. Pure rules shared by the server handler
 * (`src/server/newsletterHandler.ts`) and the signup forms.
 *
 *   POST /api/newsletter                    → status `pending` + confirmation mail
 *   GET  /api/newsletter/confirm?token=…    → `subscribed`, redirect to /nieuwsbrief
 *   POST /api/newsletter/unsubscribe        → `unsubscribed` (from /afmelden?token=…)
 */

export type SubscriberStatus = 'pending' | 'subscribed' | 'unsubscribed';

export interface SubscriberRecord {
  email: string;
  status: SubscriberStatus;
  /** Unguessable; used in the confirmation and unsubscribe links. */
  token: string;
  createdAt: string;
  /** When the confirmation mail was last sent. */
  requestedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  /** Where the visitor signed up, e.g. `footer` or `nieuwsbrief`. */
  source: string;
  /** The exact consent text shown next to the field (proof of consent). */
  consentText: string;
}


export const NEWSLETTER_SOURCES = ['footer', 'nieuwsbrief'] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

export type ParsedSignup =
  | { kind: 'ok'; email: string; source: NewsletterSource }
  | { kind: 'spam' }
  | { kind: 'invalid'; error: string };

/** Lower-case and trim so one inbox has one subscription. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Validate a signup body: `{ email, source?, website? }`. `website` is a
 * honeypot field that people never see; bots fill it in.
 */
export function parseNewsletterSignup(body: unknown): ParsedSignup {
  if (!body || typeof body !== 'object') return { kind: 'invalid', error: 'Ongeldige aanvraag.' };
  const data = body as Record<string, unknown>;
  if (typeof data.website === 'string' && data.website.trim() !== '') return { kind: 'spam' };
  const raw = typeof data.email === 'string' ? data.email : '';
  const email = normalizeEmail(raw);
  if (!email) return { kind: 'invalid', error: 'Vul je e-mailadres in.' };
  if (email.length > 160 || !isValidEmail(email)) {
    return { kind: 'invalid', error: 'Dit e-mailadres klopt niet. Controleer het en probeer het opnieuw.' };
  }
  const source = NEWSLETTER_SOURCES.find((s) => s === data.source) ?? 'nieuwsbrief';
  return { kind: 'ok', email, source };
}

const origin = (siteUrl: string) => siteUrl.replace(/\/$/, '');
export const confirmUrl = (siteUrl: string, token: string) =>
  `${origin(siteUrl)}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
export const unsubscribeUrl = (siteUrl: string, token: string) =>
  `${origin(siteUrl)}/afmelden?token=${encodeURIComponent(token)}`;

/** The mail that asks the visitor to confirm (the second opt-in). */
export function buildNewsletterConfirmEmail(siteUrl: string, token: string): LeadEmail {
  const confirm = confirmUrl(siteUrl, token);
  const unsubscribe = unsubscribeUrl(siteUrl, token);
  const subject = 'Bevestig je aanmelding voor de Klusbaas-nieuwsbrief';
  const intro =
    'Bijna klaar! Klik op de knop om je aanmelding voor de Klusbaas-nieuwsbrief te bevestigen. Pas daarna sturen we je iets.';
  const outro =
    'Heb je je niet aangemeld? Dan hoef je niets te doen: zonder bevestiging krijg je geen nieuwsbrief en vervalt de aanmelding na 30 dagen.';
  const note = 'Je krijgt deze mail omdat dit adres is ingevuld op klusbaas.nl.';
  const text = [
    intro,
    '',
    `Bevestigen: ${confirm}`,
    '',
    outro,
    '',
    emailTextFooter(siteUrl, note, unsubscribe),
  ].join('\n');
  const html = renderEmailLayout({
    intro,
    sections: `<p style="margin:16px 0 0;font-size:13px;color:#57534e;">Werkt de knop niet? Kopieer deze link: <a href="${escapeHtml(confirm)}" style="color:#b45309;word-break:break-all;">${escapeHtml(confirm)}</a></p>`,
    outro,
    button: { href: confirm, label: 'Ja, meld me aan' },
    siteUrl,
    footerNote: note,
    unsubscribeUrl: unsubscribe,
  });
  return { subject, text, html };
}

/** Days after which an unconfirmed signup is no longer valid. */
export const PENDING_EXPIRY_DAYS = 30;

export function isPendingExpired(record: SubscriberRecord, now: Date): boolean {
  return (
    record.status === 'pending' &&
    now.getTime() - new Date(record.requestedAt).getTime() > PENDING_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
}
