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
