import type { WizardFormData } from '../types';
import { normalizeDutchPhone } from './contact';

/**
 * Pure helper to generate oklch color string
 */
export function getOklchColor(l: number, c: number, h: number, alpha?: number): string {
  const cFixed = Number(c).toFixed(3);
  return alpha !== undefined
    ? `oklch(${l} ${cFixed} ${h} / ${alpha})`
    : `oklch(${l} ${cFixed} ${h})`;
}

/**
 * Calculate total price estimate from step selections
 */
export function calculateEstimate(
  selectedOptions: ({ b?: number; a?: number } | undefined)[]
): number {
  if (!selectedOptions || selectedOptions.length === 0) return 0;
  const baseOption = selectedOptions[0];
  if (!baseOption || typeof baseOption.b !== 'number') return 0;

  let total = baseOption.b;
  for (let i = 1; i < selectedOptions.length; i++) {
    const opt = selectedOptions[i];
    if (opt && typeof opt.a === 'number') {
      total += opt.a;
    }
  }
  return Math.round(total);
}

/**
 * Format numeric amount into Dutch euro format: e.g. "€ 1.250"
 */
export function formatPrice(amount: number): string {
  return '€ ' + Math.round(amount).toLocaleString('nl-NL');
}

/**
 * Format Dutch 10-digit phone number with standard spacing: e.g. "06 12 34 56 78"
 */
export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/[\s-]/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return (
      digits.slice(0, 2) +
      ' ' +
      digits.slice(2, 4) +
      ' ' +
      digits.slice(4, 6) +
      ' ' +
      digits.slice(6, 8) +
      ' ' +
      digits.slice(8, 10)
    );
  }
  return input;
}

/**
 * Generate a clean .nl web domain slug from a business name
 */
export function generateDomainSlug(businessName: string): string {
  if (!businessName || !businessName.trim()) return 'mijnbedrijf.nl';
  const clean = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '');
  return (clean || 'mijnbedrijf') + '.nl';
}

/**
 * Validate Dutch postal code and check whether it falls into service radius
 */
export function validatePostalCode(
  input: string,
  nearPrefixes: string[],
  city: string,
  example: string
): { isValid: boolean; inArea: boolean; message: string } {
  const cleaned = (input || '').replace(/\s+/g, '').toUpperCase();
  // Valid Dutch postcode: 4 digits, optional 2 letters
  const isValid = /^\d{4}[A-Z]{0,2}$/.test(cleaned);

  if (!isValid || cleaned.length < 4) {
    return {
      isValid: false,
      inArea: false,
      message: `Vul een geldige postcode in, bijvoorbeeld ${example}.`,
    };
  }

  const prefix = cleaned.slice(0, 2);
  const inArea = nearPrefixes.includes(prefix);

  if (inArea) {
    return {
      isValid: true,
      inArea: true,
      message: `Ja, ik kom bij jou in de regio ${city}. Meestal kan ik binnen 2 werkdagen terecht.`,
    };
  } else {
    return {
      isValid: true,
      inArea: false,
      message: `Dat valt net buiten mijn standaard werkgebied rond ${city}. Bel me gerust, dan kijk ik wat er mogelijk is.`,
    };
  }
}

/**
 * Validate onboarding form fields
 */
export function validateWizardForm(form: WizardFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.biz || !form.biz.trim()) {
    errors.biz = 'Vul je bedrijfsnaam in';
  }
  if (!form.owner || !form.owner.trim()) {
    errors.owner = 'Vul je naam in';
  }
  if (!normalizeDutchPhone(form.phone || '')) {
    errors.phone = 'Gebruik een geldig nummer, bijvoorbeeld 06 12345678 of +31 6 12345678';
  }
  if (!form.city || !form.city.trim()) {
    errors.city = 'Vul je plaats in';
  }
  return errors;
}
