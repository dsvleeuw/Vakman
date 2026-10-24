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
      'Offerteformulier met WhatsApp-aflevering',
      'Voor/na-projectgalerij',
      'Keurmerken- en garantievermelding (VCA e.d.)',
      'Koppeling met je Google Bedrijfsprofiel',
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
      'Meerdere pagina’s en onbeperkte diensten',
      'Interactieve prijscalculator',
      'Postcodecheck voor je werkgebied',
      'Reviewsectie met Google-badge',
      'Eigen .nl-domein, eerste jaar inbegrepen',
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
      'Online boekingskalender met Google Calendar-sync',
      'Offertes automatisch opgeslagen in Google Drive',
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
