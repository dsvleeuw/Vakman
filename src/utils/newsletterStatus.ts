/**
 * Tiny, dependency-free newsletter helpers for the router and pages, so the
 * client bundle does not pull in the e-mail templates.
 */

/** Tokens are 32 base64url characters (24 random bytes). */
export function isNewsletterToken(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{32}$/.test(value);
}

/** What `/nieuwsbrief?status=…` shows after the confirmation link. */
export const NEWSLETTER_PAGE_STATUSES = ['bevestigd', 'al-bevestigd', 'verlopen', 'ongeldig'] as const;
export type NewsletterPageStatus = (typeof NEWSLETTER_PAGE_STATUSES)[number];

export function isNewsletterPageStatus(value: string | null | undefined): value is NewsletterPageStatus {
  return NEWSLETTER_PAGE_STATUSES.some((status) => status === value);
}

/** Shown next to every signup field and stored with the subscriber as proof of consent. */
export const NEWSLETTER_CONSENT_TEXT =
  'Ja, stuur mij af en toe de Klusbaas-nieuwsbrief met tips voor je vakmanswebsite. Afmelden kan altijd.';
