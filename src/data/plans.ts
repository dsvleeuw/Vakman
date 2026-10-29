import type { PlanId } from '../types';

export interface PlatformPlan {
  id: PlanId;
  name: string;
  /** One-off price in euro, excluding VAT. */
  price: number;
  blurb: string;
  features: string[];
  popular: boolean;
}

/**
 * The three one-off packages Klusbaas sells. Kept in one place so the
 * pricing table, the wizard (`?pakket=pro`) and the confirmation screen can
 * never drift apart.
 *
 * Every line here is something the customer really gets. A promise that
 * Klusbaas does not build is a promise he breaks (VISION principle 2), so
 * what is not there stays out: no Google Business Profile link, no domain
 * included, no reviews badge.
 */
export const PLANS: PlatformPlan[] = [
  {
    id: 'basis',
    name: 'Basis',
    price: 595,
    blurb: 'Een sterke one-page website die gewoon gevonden wordt.',
    features: [
      'One-page ontwerp in een van de 5 premium stijlen',
      'Mobiele bel- en WhatsApp-knop, altijd in beeld',
      'Offerteformulier: je aanvragen komen in je mailbox',
      'Voor/na-projectgalerij met je eigen foto’s',
      'Ruimte voor je eigen keurmerken en garantie',
      'Lokale SEO voor jouw plaats en vak',
      'Oplevering binnen 2 weken',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 995,
    blurb: 'Alles van Basis, met interactieve tools die offertes opleveren.',
    features: [
      'Alles uit Basis',
      'Onbeperkt aantal diensten, met je eigen prijzen',
      'Interactieve prijscalculator met je eigen prijzen',
      'Postcodecheck voor je werkgebied',
      'Uitgelichte klantreactie met je eigen tekst',
      'Eigen .nl-domein op aanvraag, door Klusbaas geregistreerd',
      'Eerste 3 maanden service t.w.v. € 75',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1795,
    blurb: 'Het complete systeem, inclusief de slimme tool voor jouw vak.',
    features: [
      'Alles uit Pro',
      'Slimme vak-tool: spoedknop, storingsmelding, m²-calculator of projecttijdlijn',
      'Online boekingskalender, met je eigen Google Calendar',
      'Offertes opgeslagen in je account, altijd terug te vinden',
      'Persoonlijk kleuren-, foto- en tekstadvies',
      'Voorrang bij support en wijzigingen',
    ],
    popular: false,
  },
];

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === 'basis' || value === 'pro' || value === 'premium';
}

export function getPlan(planId: string | null | undefined): PlatformPlan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}
