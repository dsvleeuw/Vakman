import type { PaymentDetails } from '../types';

/**
 * How a customer pays for his website.
 *
 * There is no payment provider: the customer transfers the amount to
 * Klusbaas by bank transfer and Klusbaas marks the offer as paid once the
 * money is in. That is what a tradesman expects, and it means there is no
 * third party between the customer and his money.
 *
 * The details come from the environment (`PAYMENT_IBAN`, `PAYMENT_NAME`,
 * `PAYMENT_EMAIL`). Without an IBAN there are no payment details, and the
 * account says so instead of showing a broken bank account.
 */
export function paymentDetailsFromEnv(
  env: Record<string, string | undefined>
): PaymentDetails | undefined {
  const iban = (env.PAYMENT_IBAN ?? '').trim();
  if (!iban) return undefined;
  const notify = (env.QUOTE_NOTIFY_EMAIL ?? '').trim();
  return {
    iban,
    name: (env.PAYMENT_NAME ?? 'Klusbaas').trim() || 'Klusbaas',
    email: (env.PAYMENT_EMAIL ?? notify).trim(),
  };
}
