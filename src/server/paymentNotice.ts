import { buildPaymentReportedEmail } from '../utils/leadEmail';
import { buildQuotePath, type QuoteRecord } from '../utils/quote';
import type { AccountMail } from './accountMailer';
import type { PaymentDetails } from '../types';

/**
 * The customer says he transferred the money.
 *
 * Klusbaas checks his own bank statement before he marks an offer as paid:
 * a customer can claim anything. But without this notice he only finds out
 * when he happens to look at his bank, and an order that looks forgotten
 * stops looking like a sale.
 *
 * The offer keeps its status `accepted`: only Klusbaas can mark it paid.
 */

export interface PaymentNoticeDeps {
  /** Sends the mail to Klusbaas. Without it nothing happens. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, mentioned in the mail. */
  payment?: PaymentDetails;
  /** Where Klusbaas gets the notification. */
  notifyEmail?: string;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  now?: () => Date;
  log?: (message: string) => void;
}

export interface PaymentNoticeResult {
  ok: boolean;
  /** What happened with the mail: `sent`, `preview`, `failed` … */
  mailStatus?: string;
  error?: string;
}

const DEFAULT_NOTIFY = 'thomascliphero@gmail.com';

/**
 * Note the payment report on the offer and tell Klusbaas about it.
 */
export async function reportPayment(
  record: QuoteRecord,
  deps: PaymentNoticeDeps & { markPaymentReported: (id: string, reportedAt: string) => Promise<QuoteRecord | null> }
): Promise<PaymentNoticeResult> {
  const log = deps.log ?? (() => {});
  if (record.status === 'paid') {
    return { ok: false, error: 'Deze offerte is al betaald.' };
  }
  if (record.status === 'cancelled') {
    return { ok: false, error: 'Deze offerte is geannuleerd.' };
  }
  if (record.status !== 'accepted') {
    return {
      ok: false,
      error: 'Je hebt deze offerte nog niet geaccepteerd. Accepteer hem eerst.',
    };
  }
  if (!deps.sendMail) {
    return { ok: false, error: 'Er is geen mailer, dus de melding is niet verstuurd.' };
  }

  const now = deps.now ? deps.now() : new Date();
  const reportedAt = now.toISOString();
  const updated = await deps.markPaymentReported(record.id, reportedAt);
  if (!updated) {
    return { ok: false, error: 'Deze offerte bestaat niet (meer).' };
  }

  const siteUrl = (deps.siteUrl ?? 'https://klusbaas.nl').replace(/\/$/, '');
  const quoteUrl = `${siteUrl}${buildQuotePath(record.id, record.token)}`;
  const mail = buildPaymentReportedEmail(updated, {
    quoteUrl,
    ...(deps.payment ? { payment: deps.payment } : {}),
  });
  const status = await deps.sendMail({
    to: deps.notifyEmail?.trim() || DEFAULT_NOTIFY,
    ...(record.customer.email ? { replyTo: record.customer.email } : {}),
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  log(`[quote] betaling gemeld voor offerte ${record.id} (${status})`);
  return { ok: true, mailStatus: status };
}
