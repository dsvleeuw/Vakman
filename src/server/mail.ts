/**
 * Thin Resend client. Without an API key every mail is logged instead
 * (preview mode), so local development never needs secrets.
 */

export const DEFAULT_NOTIFY_EMAIL = 'thomascliphero@gmail.com';
/** Resend's shared test sender; only delivers to the Resend account's own address. */
export const DEFAULT_FROM_EMAIL = 'Klusbaas <onboarding@resend.dev>';

export interface MailEnv {
  /** Resend API key. Without it the handlers run in preview mode and send nothing. */
  RESEND_API_KEY?: string;
  /** Sender, e.g. "Klusbaas <offerte@klusbaas.nl>" (domain must be verified in Resend). */
  QUOTE_FROM_EMAIL?: string;
  /** Where new leads go. */
  QUOTE_NOTIFY_EMAIL?: string;
}

export interface MailAttachment {
  filename: string;
  /** Raw bytes; base64-encoded for Resend. */
  content: Uint8Array;
}

export interface OutgoingMail {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface MailResult {
  ok: boolean;
  /** True when nothing was sent because RESEND_API_KEY is missing. */
  preview: boolean;
  detail: string;
}

export const notifyAddress = (env: MailEnv) => env.QUOTE_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

export async function sendMail(
  mail: OutgoingMail,
  env: MailEnv,
  fetchImpl: FetchLike,
  log: (message: string) => void
): Promise<MailResult> {
  const attachmentNote = mail.attachments?.length
    ? ` [bijlage: ${mail.attachments.map((file) => file.filename).join(', ')}]`
    : '';
  if (!env.RESEND_API_KEY) {
    log(`[mail] PREVIEW (geen RESEND_API_KEY) → ${mail.to}: ${mail.subject}${attachmentNote}\n${mail.text}\n`);
    return { ok: true, preview: true, detail: '' };
  }
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.QUOTE_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL,
        to: [mail.to],
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.attachments?.length
          ? {
              attachments: mail.attachments.map((file) => ({
                filename: file.filename,
                content: toBase64(file.content),
              })),
            }
          : {}),
      }),
    });
    const detail = response.ok ? '' : await response.text();
    if (!response.ok) log(`[mail] Resend weigerde ${mail.to} (${response.status}): ${detail}`);
    return { ok: response.ok, preview: false, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    log(`[mail] versturen naar ${mail.to} mislukt: ${detail}`);
    return { ok: false, preview: false, detail };
  }
}
