import { buildPaidEmail } from '../utils/leadEmail';
import type { QuoteRecord } from '../utils/quote';
import type { AccountMail } from './accountMailer';
import { invoiceNumberFor } from './invoice';
import { renderInvoicePdf } from './invoicePdf';
import type { InvoiceDetails, PaymentDetails } from '../types';

/**
 * The mail the customer gets when Klusbaas marks his offer as paid.
 *
 * Until now the sale ended silently: the customer transferred the money and
 * heard nothing. A customer who paid wants to know that his money arrived
 * and what he got for it — and he needs a document for his own
 * administration.
 *
 * So: an invoice as a PDF (with the details of Klusbaas from the
 * environment, nothing invented) and a short mail with the invoice
 * attached.
 */

export interface PaidNoticeDeps {
  /** Sends the mail. Without it nothing happens, but the payment stands. */
  sendMail?: (mail: AccountMail) => Promise<string>;
  /** Klusbaas' own details on the invoice. */
  invoice?: InvoiceDetails;
  /** How the customer paid, mentioned on the invoice. */
  payment?: PaymentDetails;
  /** The origin for the links in the mail. */
  siteUrl?: string;
  /** The moment of payment, when Klusbaas knows it. */
  paidAt?: string;
  log?: (message: string) => void;
}

/**
 * Write the invoice and mail it to the customer. Returns what happened:
 * `sent`, `preview`, `failed`, `geen mailer` or `geen e-mailadres`.
 */
export async function sendPaidNotice(
  record: QuoteRecord,
  deps: PaidNoticeDeps
): Promise<string> {
  const log = deps.log ?? (() => {});
  const email = record.customer.email?.trim().toLowerCase();
  if (!email) {
    log(`[admin] offerte ${record.id} is betaald, maar zonder e-mailadres voor de factuur`);
    return 'geen e-mailadres';
  }
  if (!deps.sendMail) {
    log(`[admin] offerte ${record.id} is betaald, maar er is geen mailer voor de factuur`);
    return 'geen mailer';
  }
  if (!deps.invoice) {
    log(`[admin] offerte ${record.id} is betaald, maar er zijn geen factuurgegevens`);
    return 'geen factuurgegevens';
  }

  const paidAt = deps.paidAt ?? record.paidAt ?? record.createdAt;
  const pdf = await renderInvoicePdf(record, {
    invoice: deps.invoice,
    ...(deps.payment ? { payment: deps.payment } : {}),
    paidAt,
    issuedAt: paidAt,
  });
  const number = invoiceNumberFor(record.id);
  const mail = buildPaidEmail(record, {
    ...(deps.siteUrl ? { siteUrl: deps.siteUrl } : {}),
    paidAt,
  });
  const status = await deps.sendMail({
    to: email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: [
      { filename: `Factuur-${number}.pdf`, content: pdf, contentType: 'application/pdf' },
    ],
  });
  log(`[admin] factuur ${number} van offerte ${record.id} verstuurd naar ${email} (${status})`);
  return status;
}
