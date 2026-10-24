import type { PlanId } from '../types';

export type AddonGroup = 'Vertrouwen' | 'Conversie' | 'Slimme tools';

export interface AddonDef {
  /** Matches the id in `componentCatalog.ts` so the library and the quote agree. */
  id: string;
  label: string;
  description: string;
  group: AddonGroup;
  /** One-off price in euro, excluding VAT, when the package does not include it. */
  price: number;
  /** Packages that already contain this component at no extra cost. */
  includedIn: PlanId[];
}

/**
 * Components a craftsman can add to their website on top of the package.
 * Prices live here only: the wizard, the quote summary and the e-mail
 * function all read this list, so a price change is a one-line edit.
 */
export const ADDONS: AddonDef[] = [
  {
    id: 'trust-bar',
    label: 'Vertrouwensbalk',
    description: 'Vier compacte bewijzen: keurmerk, reviews, bereikbaarheid en garantie.',
    group: 'Vertrouwen',
    price: 49,
    includedIn: [],
  },
  {
    id: 'guarantees',
    label: 'Garantielijst',
    description: 'Je beloftes en garanties overzichtelijk op een rij.',
    group: 'Vertrouwen',
    price: 49,
    includedIn: [],
  },
  {
    id: 'testimonial',
    label: 'Uitgelichte review',
    description: 'Eén grote klantreview met foto en sterren.',
    group: 'Vertrouwen',
    price: 59,
    includedIn: [],
  },
  {
    id: 'team-member',
    label: 'Maak kennis met de vakman',
    description: 'Persoonlijke profielkaart met foto, ervaring en certificaten.',
    group: 'Vertrouwen',
    price: 79,
    includedIn: [],
  },
  {
    id: 'project-stats',
    label: 'Projectcijfers',
    description: 'Aantal klussen, jaren ervaring en klantscore in grote cijfers.',
    group: 'Vertrouwen',
    price: 59,
    includedIn: [],
  },
  {
    id: 'before-after',
    label: 'Voor/na-slider',
    description: 'Sleep tussen de situatie vóór en na je werk.',
    group: 'Vertrouwen',
    price: 99,
    includedIn: ['basis', 'pro', 'premium'],
  },
  {
    id: 'opening-hours',
    label: 'Openingstijden',
    description: 'Bereikbaarheidskaart met directe bel- en WhatsApp-knoppen.',
    group: 'Conversie',
    price: 49,
    includedIn: [],
  },
  {
    id: 'availability',
    label: 'Beschikbaarheid',
    description: 'Laat zien wanneer je weer plek hebt en stuur door naar de agenda.',
    group: 'Conversie',
    price: 79,
    includedIn: [],
  },
  {
    id: 'promotion',
    label: 'Actiebanner',
    description: 'Seizoensactie of korting bovenaan je site.',
    group: 'Conversie',
    price: 69,
    includedIn: [],
  },
  {
    id: 'service-areas',
    label: 'Werkgebied-chips',
    description: 'Alle plaatsen waar je werkt, goed voor lokale vindbaarheid.',
    group: 'Conversie',
    price: 59,
    includedIn: [],
  },
  {
    id: 'contact-cta',
    label: 'Contactbanner',
    description: 'Opvallende afsluiter met bel- en WhatsApp-actie.',
    group: 'Conversie',
    price: 49,
    includedIn: [],
  },
  {
    id: 'area-checker',
    label: 'Postcodecheck',
    description: 'Bezoekers checken zelf of ze in je werkgebied wonen.',
    group: 'Slimme tools',
    price: 149,
    includedIn: ['pro', 'premium'],
  },
  {
    id: 'price-calculator',
    label: 'Prijscalculator',
    description: 'Interactieve vragen met een live prijsindicatie.',
    group: 'Slimme tools',
    price: 249,
    includedIn: ['pro', 'premium'],
  },
  {
    id: 'booking-calendar',
    label: 'Boekingskalender',
    description: 'Klanten plannen zelf een afspraak, met Google Calendar-sync.',
    group: 'Slimme tools',
    price: 299,
    includedIn: ['premium'],
  },
  {
    id: 'trade-tool',
    label: 'Slimme vak-tool',
    description: 'Spoedknop, storingsmelding, m²-calculator of projecttijdlijn — passend bij jouw vak.',
    group: 'Slimme tools',
    price: 349,
    includedIn: ['premium'],
  },
];

export const ADDON_GROUPS: AddonGroup[] = ['Vertrouwen', 'Conversie', 'Slimme tools'];

export function getAddon(id: string): AddonDef | undefined {
  return ADDONS.find((addon) => addon.id === id);
}

export function isAddonIncluded(addon: AddonDef, plan: PlanId | undefined): boolean {
  return plan !== undefined && addon.includedIn.includes(plan);
}
