import { buildReminderEmail } from '../utils/leadEmail';
import { buildQuotePath, type QuoteRecord } from '../utils/quote';
import type { AccountMail } from './accountMailer';
import type { PaymentDetails } from '../types';

/**
 * Klusbaas chases an offer that nobody accepted.
 *
 * An offer that stays open is an offer nobody said yes to. The customer
 * gets a nudge with the link to the offer and the amount again, so he does
 * not have to dig through his mailbox for the first mail.
 *
 * The customer can also say "no" by answering; Klusbaas then cancels the
 * offer by hand. This mail never closes anything by itself.
 */

export interface RemindDeps {
  /** Sends the mail. Without it nothing happens. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** How the customer pays, mentioned in the mail. */
  payment?: PaymentDetails;
  /** The origin for the link in the mail, e.g. https://klusbaas.nl */
  siteUrl?: string;
  log?: (message: string) => void;
}

export interface RemindResult {
  ok: boolean;
  /** What happened with the mail: `sent`, `preview`, `failed` … */
  mailStatus?: string;
  error?: string;
}

/** Send the customer a reminder about his offer. */
export async function remindQuote(
  record: QuoteRecord,
  deps: RemindDeps
): Promise<RemindResult> {
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

  const siteUrl = (deps.siteUrl ?? 'https://klusbaas.nl').replace(/\/$/, '');
  const quoteUrl = `${siteUrl}${buildQuotePath(record.id, record.token)}`;
  const mail = buildReminderEmail(record, {
    quoteUrl,
    ...(deps.payment ? { payment: deps.payment } : {}),
  });
  const status = await deps.sendMail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  log(`[admin] herinnering voor offerte ${record.id} verstuurd naar ${email} (${status})`);
  return { ok: true, mailStatus: status };
}
