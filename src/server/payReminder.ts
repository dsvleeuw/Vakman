import { buildPaymentReminderEmail } from '../utils/leadEmail';
import { buildQuotePath, type QuoteRecord } from '../utils/quote';
import type { AccountMail } from './accountMailer';
import type { PaymentDetails } from '../types';

/**
 * Klusbaas chases an offer the customer accepted but did not pay.
 *
 * The customer said yes, so the sale is real; the money is not in yet. That
 * gap is where a sale quietly dies: the customer meant it, but the transfer
 * never happened because he lost the mail with the IBAN.
 *
 * This mail reminds him of the amount and the IBAN. It is a nudge, not a
 * scolding, and it never changes the offer: the site stays online whether he
 * pays today or next week.
 */

export interface PayReminderDeps {
  /** Sends the mail. Without it nothing happens. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, mentioned in the mail. */
  payment?: PaymentDetails;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  log?: (message: string) => void;
}

export interface PayReminderResult {
  ok: boolean;
  /** What happened with the mail: `sent`, `preview`, `failed` … */
  mailStatus?: string;
  error?: string;
}

/** Send the customer a reminder about the payment of an accepted offer. */
export async function remindPayment(
  record: QuoteRecord,
  deps: PayReminderDeps
): Promise<PayReminderResult> {
  const log = deps.log ?? (() => {});
  const email = record.customer.email?.trim().toLowerCase();
  if (!email) {
    return { ok: false, error: 'Deze klant heeft geen e-mailadres, dus geen herinnering.' };
  }
  if (!deps.sendMail) {
    return { ok: false, error: 'Er is geen mailer, dus geen herinnering verstuurd.' };
  }
  if (record.status === 'paid') {
    return { ok: false, error: 'Deze offerte is al betaald.' };
  }
  if (record.status === 'cancelled') {
    return { ok: false, error: 'Deze offerte is geannuleerd.' };
  }
  if (record.status !== 'accepted') {
    return {
      ok: false,
      error: 'Deze klant heeft nog niet ja gezegd. Stuur een herinnering over de offerte.',
    };
  }

  const siteUrl = (deps.siteUrl ?? 'https://klusbaas.nl').replace(/\/$/, '');
  const quoteUrl = `${siteUrl}${buildQuotePath(record.id, record.token)}`;
  const mail = buildPaymentReminderEmail(record, {
    quoteUrl,
    ...(deps.payment ? { payment: deps.payment } : {}),
  });
  const status = await deps.sendMail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  log(`[admin] betaalherinnering voor offerte ${record.id} verstuurd naar ${email} (${status})`);
  return { ok: true, mailStatus: status };
}
