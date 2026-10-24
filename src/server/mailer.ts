/**
 * Minimal Resend client over `fetch` (no SDK needed). Without an API key the
 * caller runs in preview mode and never calls this.
 */

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface MailAttachment {
  filename: string;
  content: Uint8Array;
  /** MIME type, so mail clients show e.g. a PDF preview instead of a download. */
  contentType?: string;
}

export interface OutgoingMail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

/**
 * Testing without a verified domain: Resend only delivers to the account's
 * own address. With `testRecipient` set, a customer mail goes there instead,
 * marked with the intended address in the subject and a banner, so every
 * mail can be reviewed in one inbox. Without it the mail is unchanged.
 */
export function redirectForTest(mail: OutgoingMail, testRecipient: string | undefined): OutgoingMail {
  const to = testRecipient?.trim();
  if (!to || to === mail.to) return mail;
  const note = `TESTMAIL: bedoeld voor ${mail.to}`;
  return {
    ...mail,
    to,
    subject: `[TEST → ${mail.to}] ${mail.subject}`,
    text: `${note}\n\n${mail.text}`,
    html: mail.html.replace(
      /<body([^>]*)>/,
      `<body$1><div style="background:#fef3c7;color:#78350f;font:700 13px Arial,sans-serif;padding:10px 16px;text-align:center;">${note.replace(/[<>&]/g, '')}</div>`
    ),
  };
}

export type DeliveryStatus = 'sent' | 'preview' | 'failed' | 'skipped';

export interface DeliveryResult {
  to: string;
  status: DeliveryStatus;
  /** Resend message id when sent; error detail when failed (server log only). */
  detail?: string;
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function sendViaResend(
  apiKey: string,
  mail: OutgoingMail,
  fetchImpl: FetchLike = fetch
): Promise<DeliveryResult> {
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: mail.from,
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
    const body = await response.text();
    if (!response.ok) return { to: mail.to, status: 'failed', detail: `${response.status} ${body}` };
    let id: string | undefined;
    try {
      id = (JSON.parse(body) as { id?: string }).id;
    } catch {
      id = undefined;
    }
    return { to: mail.to, status: 'sent', ...(id ? { detail: id } : {}) };
  } catch (error) {
    return { to: mail.to, status: 'failed', detail: error instanceof Error ? error.message : String(error) };
  }
}
