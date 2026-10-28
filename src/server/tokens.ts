import { randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Link tokens for things that must stay private: an offer, a published site.
 *
 * A token is 24 random bytes in base64url: long enough that nobody guesses
 * it and short enough to paste into an e-mail or a WhatsApp message.
 */
export function createToken(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Compare two tokens without leaking how much of them was right.
 * `timingSafeEqual` needs the same length, so that is checked first.
 */
export function tokensMatch(expected: string, given: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
