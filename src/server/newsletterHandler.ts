import { randomBytes } from 'node:crypto';
import { createRateLimiter } from '../utils/lead';
import {
  NEWSLETTER_CONSENT_TEXT,
  buildNewsletterConfirmEmail,
  isNewsletterToken,
  isPendingExpired,
  parseNewsletterSignup,
  type NewsletterPageStatus,
  type SubscriberRecord,
} from '../utils/newsletter';
import { sendViaResend, type DeliveryResult, type FetchLike, type OutgoingMail } from './mailer';
import { DEFAULT_FROM_EMAIL, type HandlerResult } from './leadHandler';
import type { NewsletterStorage } from './newsletterStorage';

/**
 * `POST /api/newsletter`, `GET /api/newsletter/confirm` and
 * `POST /api/newsletter/unsubscribe`, shared by the Netlify Function and the
 * Vite dev middleware. Storage, mailer and clock are injected for tests.
 */

export interface NewsletterEnv {
  RESEND_API_KEY?: string;
  QUOTE_FROM_EMAIL?: string;
  /** Optional Resend Audience: confirmed subscribers are added there. */
  RESEND_AUDIENCE_ID?: string;
}

export interface NewsletterDeps {
  env: NewsletterEnv;
  storage: NewsletterStorage;
  siteUrl: string;
  fetchImpl?: FetchLike;
  /** Replaces Resend for tests; receives every outgoing mail. */
  sendMail?: (mail: OutgoingMail) => Promise<DeliveryResult>;
  log?: (message: string) => void;
  now?: () => Date;
  createToken?: () => string;
  allowRequest?: (key: string, now: number) => boolean;
}

export interface NewsletterResponseBody {
  ok: boolean;
  mode?: 'sent' | 'preview';
  message?: string;
  error?: string;
}

/** Same answer for new, pending and existing subscribers: nothing leaks. */
export const SIGNUP_MESSAGE =
  'Bijna klaar! We hebben je een mail gestuurd. Klik op de link daarin om je aanmelding te bevestigen.';

const defaultLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export function createNewsletterToken(): string {
  return randomBytes(24).toString('base64url');
}

async function sendMail(mail: OutgoingMail, deps: NewsletterDeps, log: (m: string) => void): Promise<DeliveryResult> {
  if (deps.sendMail) return deps.sendMail(mail);
  if (!deps.env.RESEND_API_KEY) {
    log(`[nieuwsbrief] PREVIEW -> ${mail.to}\nOnderwerp: ${mail.subject}\n${mail.text}\n`);
    return { to: mail.to, status: 'preview' };
  }
  const result = await sendViaResend(deps.env.RESEND_API_KEY, mail, deps.fetchImpl);
  if (result.status === 'failed') log(`[nieuwsbrief] mail -> ${mail.to} mislukt: ${result.detail}`);
  return result;
}

/** Add or update the contact in the Resend Audience, when one is configured. */
async function syncResendContact(
  email: string,
  unsubscribed: boolean,
  deps: NewsletterDeps,
  log: (m: string) => void
): Promise<void> {
  const { RESEND_API_KEY: key, RESEND_AUDIENCE_ID: audience } = deps.env;
  if (!key || !audience) return;
  const fetchImpl = deps.fetchImpl ?? ((url: string, init: RequestInit) => fetch(url, init));
  const base = `https://api.resend.com/audiences/${encodeURIComponent(audience)}/contacts`;
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  try {
    const response = unsubscribed
      ? await fetchImpl(`${base}/${encodeURIComponent(email)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ unsubscribed: true }),
        })
      : await fetchImpl(base, { method: 'POST', headers, body: JSON.stringify({ email, unsubscribed: false }) });
    if (!response.ok) log(`[nieuwsbrief] Resend-contact ${email}: ${response.status} ${await response.text()}`);
  } catch (error) {
    log(`[nieuwsbrief] Resend-contact ${email} mislukt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleNewsletterSignup(
  body: unknown,
  clientKey: string,
  deps: NewsletterDeps
): Promise<HandlerResult<NewsletterResponseBody>> {
  const log = deps.log ?? console.log;
  const now = (deps.now ?? (() => new Date()))();
  const allow = deps.allowRequest ?? defaultLimiter;
  if (!allow(clientKey || 'onbekend', now.getTime())) {
    return { status: 429, body: { ok: false, error: 'Te veel aanmeldingen achter elkaar. Probeer het over een paar minuten opnieuw.' } };
  }
  const parsed = parseNewsletterSignup(body);
  if (parsed.kind === 'invalid') return { status: 400, body: { ok: false, error: parsed.error } };
  const mode = deps.env.RESEND_API_KEY ? 'sent' : 'preview';
  if (parsed.kind === 'spam') {
    log(`[nieuwsbrief] honeypot gevuld door ${clientKey}`);
    return { status: 200, body: { ok: true, mode, message: SIGNUP_MESSAGE } };
  }

  try {
    const existing = await deps.storage.getByEmail(parsed.email);
    if (existing?.status === 'subscribed') {
      // Already confirmed: answer the same, send nothing.
      return { status: 200, body: { ok: true, mode, message: SIGNUP_MESSAGE } };
    }
    const iso = now.toISOString();
    const keepToken = existing?.status === 'pending' && !isPendingExpired(existing, now);
    const record: SubscriberRecord = {
      email: parsed.email,
      status: 'pending',
      token: keepToken && existing ? existing.token : (deps.createToken ?? createNewsletterToken)(),
      createdAt: existing?.createdAt ?? iso,
      requestedAt: iso,
      source: parsed.source,
      consentText: NEWSLETTER_CONSENT_TEXT,
    };
    await deps.storage.save(record, existing?.token);

    const from = deps.env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
    const result = await sendMail({ from, to: record.email, ...buildNewsletterConfirmEmail(deps.siteUrl, record.token) }, deps, log);
    if (result.status === 'failed') {
      return { status: 502, body: { ok: false, error: 'De bevestigingsmail kon niet worden verstuurd. Probeer het later opnieuw.' } };
    }
    return { status: 200, body: { ok: true, mode, message: SIGNUP_MESSAGE } };
  } catch (error) {
    log(`[nieuwsbrief] fout: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    return { status: 500, body: { ok: false, error: 'Er ging iets mis aan onze kant. Probeer het later opnieuw.' } };
  }
}

export interface ConfirmResult {
  status: NewsletterPageStatus;
  /** Where the browser goes next: `/nieuwsbrief?status=…`. */
  location: string;
}

/** `GET /api/newsletter/confirm?token=…` */
export async function handleNewsletterConfirm(token: string | null, deps: NewsletterDeps): Promise<ConfirmResult> {
  const log = deps.log ?? console.log;
  const done = (status: NewsletterPageStatus): ConfirmResult => ({ status, location: `/nieuwsbrief?status=${status}` });
  if (!isNewsletterToken(token)) return done('ongeldig');
  const record = await deps.storage.getByToken(token);
  if (!record) return done('ongeldig');
  if (record.status === 'subscribed') return done('al-bevestigd');
  if (record.status === 'unsubscribed') return done('ongeldig');
  const now = (deps.now ?? (() => new Date()))();
  if (isPendingExpired(record, now)) return done('verlopen');
  await deps.storage.save({ ...record, status: 'subscribed', confirmedAt: now.toISOString() });
  log(`[nieuwsbrief] bevestigd: ${record.email}`);
  await syncResendContact(record.email, false, deps, log);
  return done('bevestigd');
}

export type UnsubscribeStatus = 'afgemeld' | 'al-afgemeld' | 'ongeldig';

/** `POST /api/newsletter/unsubscribe` with `{ token }`, called from /afmelden. */
export async function handleNewsletterUnsubscribe(
  body: unknown,
  deps: NewsletterDeps
): Promise<HandlerResult<{ ok: boolean; status: UnsubscribeStatus; error?: string }>> {
  const log = deps.log ?? console.log;
  const token = body && typeof body === 'object' ? (body as { token?: unknown }).token : undefined;
  if (typeof token !== 'string' || !isNewsletterToken(token)) {
    return { status: 400, body: { ok: false, status: 'ongeldig', error: 'Deze afmeldlink is niet geldig.' } };
  }
  const record = await deps.storage.getByToken(token);
  if (!record) return { status: 404, body: { ok: false, status: 'ongeldig', error: 'Deze afmeldlink is niet geldig.' } };
  if (record.status === 'unsubscribed') return { status: 200, body: { ok: true, status: 'al-afgemeld' } };
  const wasSubscribed = record.status === 'subscribed';
  const now = (deps.now ?? (() => new Date()))();
  await deps.storage.save({ ...record, status: 'unsubscribed', unsubscribedAt: now.toISOString() });
  log(`[nieuwsbrief] afgemeld: ${record.email}`);
  if (wasSubscribed) await syncResendContact(record.email, true, deps, log);
  return { status: 200, body: { ok: true, status: 'afgemeld' } };
}
