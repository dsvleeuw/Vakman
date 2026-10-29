import type { InvoiceDetails } from '../types';

/**
 * Klusbaas' own details on an invoice.
 *
 * An invoice for a business customer needs more than an offer: a postal
 * address, a KvK number and a VAT number. Those are facts about the
 * business, so they come from the environment and are never invented. What
 * is not set is not printed on the invoice — a half-filled invoice is
 * better than a made-up one.
 *
 * The variables are:
 * - `INVOICE_NAME`: the name the invoice is issued under (default
 *   `PAYMENT_NAME`, otherwise `Klusbaas`).
 * - `INVOICE_ADDRESS`: the postal address.
 * - `INVOICE_KVK`: the KvK number.
 * - `INVOICE_VAT`: the VAT number.
 * - `INVOICE_EMAIL`: the e-mail address for questions (default
 *   `PAYMENT_EMAIL`).
 */
export function invoiceDetailsFromEnv(
  env: Record<string, string | undefined>
): InvoiceDetails {
  const name = (env.INVOICE_NAME ?? env.PAYMENT_NAME ?? 'Klusbaas').trim() || 'Klusbaas';
  const email = (env.INVOICE_EMAIL ?? env.PAYMENT_EMAIL ?? '').trim();
  const address = (env.INVOICE_ADDRESS ?? '').trim();
  const kvk = (env.INVOICE_KVK ?? '').trim();
  const vat = (env.INVOICE_VAT ?? '').trim();
  return {
    name,
    ...(address ? { address } : {}),
    ...(kvk ? { kvk } : {}),
    ...(vat ? { vat } : {}),
    ...(email ? { email } : {}),
  };
}

/**
 * The invoice number of an offer.
 *
 * The number follows the offer it belongs to (`KB-2026-0001` becomes
 * `F-2026-0001`), so the invoice and the offer can be found back together
 * without a second counter that could go wrong.
 */
export function invoiceNumberFor(quoteId: string): string {
  const match = /^KB-(\d{4})-(\d+)$/.exec(quoteId.trim());
  if (!match) return `F-${quoteId.trim()}`;
  return `F-${match[1]}-${match[2]}`;
}
