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
  /**
   * Testing without a verified domain: customer mails go to this address
   * instead (Resend test mode only delivers to the account's own address).
   * Leave empty in production.
   */
  MAIL_TEST_RECIPIENT?: string;
}

/**
 * Send a customer mail to MAIL_TEST_RECIPIENT when set, with the intended
 * recipient in the subject and a banner, so every mail can be reviewed in
 * one inbox. Without the setting the mail is returned unchanged.
 */
export function redirectForTest(mail: OutgoingMail, env: MailEnv): OutgoingMail {
  const testTo = env.MAIL_TEST_RECIPIENT?.trim();
  if (!testTo || testTo === mail.to) return mail;
  const note = `TESTMAIL: bedoeld voor ${mail.to}`;
  return {
    ...mail,
    to: testTo,
    subject: `[TEST → ${mail.to}] ${mail.subject}`,
    text: `${note}\n\n${mail.text}`,
    html: mail.html.replace(
      /<body([^>]*)>/,
      `<body$1><div style="background:#fef3c7;color:#78350f;font:700 13px Arial,sans-serif;padding:10px 16px;text-align:center;">${note.replace(/[<>&]/g, '')}</div>`
    ),
  };
}

export interface MailAttachment {
  filename: string;
  /** Raw bytes; base64-encoded for Resend. */
  content: Uint8Array;
  /** MIME type, so mail clients show e.g. a PDF preview. */
  contentType?: string;
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
                ...(file.contentType ? { content_type: file.contentType } : {}),
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
