import { getDemoPhone } from '../utils/contact';

/**
 * Klusbaas' own contact details, used when a visitor asks to be contacted
 * through a specific channel after requesting an appointment.
 */
export const PLATFORM_CONTACT = {
  name: 'Klusbaas',
  email: 'hallo@klusbaas.nl',
} as const;

/**
 * Klusbaas' WhatsApp number: the same `VITE_DEMO_PHONE` the demo sites use.
 * `null` when unset, so the wizard never sends a quote to a made-up number
 * that may belong to a stranger; it offers e-mail instead.
 */
export function getPlatformWhatsApp(): string | null {
  return getDemoPhone();
}
