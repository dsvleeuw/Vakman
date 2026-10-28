import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Passwords for customer accounts.
 *
 * A password is never stored. What is stored is a scrypt hash with a random
 * salt, so a leaked account table does not hand over the passwords of the
 * craftsmen. scrypt lives in node's crypto, so this costs no dependency.
 */

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** Long enough to be worth a password, short enough to type on a phone. */
export const MIN_PASSWORD_LENGTH = 8;

function scryptAsync(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

/** Hash a password: `scrypt$<salt>$<hash>`, both parts base64. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Check a password against a stored hash. Returns false for anything that
 * is not a hash we wrote, so a corrupted record never opens an account.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  if (!salt.length || !expected.length) return false;

  const derived = await scryptAsync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Why a password is not good enough, in Dutch. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Gebruik minimaal ${MIN_PASSWORD_LENGTH} tekens.`;
  }
  if (password.length > 200) return 'Deze wachtwoord is wel erg lang.';
  return null;
}
