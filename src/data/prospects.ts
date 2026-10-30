/**
 * Bedrijfsgegevens voor de werkkaart (`/kaart`).
 *
 * De kaart leest een bestand dat **niet in git staat**, omdat er telefoonnummers
 * en e-mailadressen van bedrijven in staan:
 *
 *   public/kaart/leads.json          ← jouw werkbestand (gitignored)
 *   public/kaart/leads.example.json  ← voorbeeld met verzonnen bedrijven
 *
 * Ontbreekt het werkbestand, dan valt de kaart terug op het voorbeeld en zegt
 * dat er ook bij. Zo blijft de pagina werken in een verse checkout en op een
 * publieke deploy, zonder dat er ooit klantdata meegaat.
 *
 * Formaat (zie leads.example.json):
 *   { "bijgewerkt": "2026-10-24", "bron": "leads-noord-holland.csv",
 *     "bedrijven": [ { ...Prospect } ] }
 */

export type VakId =
  | 'loodgieter'
  | 'elektricien'
  | 'schilder'
  | 'hovenier'
  | 'timmerman'
  | 'stukadoor'
  | 'dakdekker';

export interface LighthouseScores {
  performance?: number | null;
  seo?: number | null;
  toegankelijkheid?: number | null;
  best_practices?: number | null;
}

export interface Prospect {
  /** Rijnummer uit de leadlijst; houdt de kaart en de CSV in de pas. */
  id: string;
  naam: string;
  vak: VakId;
  plaats: string;
  regio?: string;
  adres?: string;
  postcode?: string;
  lat: number;
  lng: number;
  /** 'adres' als de pin op het adres staat, 'plaats' als het op de kern is gezet. */
  locatiePrecisie?: 'adres' | 'plaats';
  telefoon?: string;
  mobiel?: string;
  email?: string;
  website?: string;
  kvk?: string;
  /** Oprichtingsjaar of "sinds"-jaar. */
  sinds?: string;
  /** Bijvoorbeeld "5,0 · 74 Google-reviews". */
  reviews?: string;
  diensten?: string[];
  openingstijden?: string;
  werkgebied?: string;
  notitie?: string;
  bron?: string;
  lighthouse?: LighthouseScores;
}

export interface ProspectFile {
  bijgewerkt?: string;
  bron?: string;
  bedrijven: Prospect[];
}

export interface VakMeta {
  label: string;
  meervoud: string;
  kleur: string;
  /** Stijl waarmee de persoonlijke demo het beste uit de verf komt. */
  demoStijl: string;
}

export const VAKKEN: Record<VakId, VakMeta> = {
  loodgieter: { label: 'Loodgieter', meervoud: 'loodgieters', kleur: '#1d4ed8', demoStijl: 'krachtig' },
  elektricien: { label: 'Elektricien', meervoud: 'elektriciens', kleur: '#b45309', demoStijl: 'krachtig' },
  schilder: { label: 'Schilder', meervoud: 'schilders', kleur: '#6d28d9', demoStijl: 'modern' },
  hovenier: { label: 'Hovenier', meervoud: 'hoveniers', kleur: '#15803d', demoStijl: 'klassiek' },
  timmerman: { label: 'Timmerman', meervoud: 'timmerlieden', kleur: '#0f766e', demoStijl: 'modern' },
  stukadoor: { label: 'Stukadoor', meervoud: 'stukadoors', kleur: '#be123c', demoStijl: 'minimaal' },
  dakdekker: { label: 'Dakdekker', meervoud: 'dakdekkers', kleur: '#9a3412', demoStijl: 'donker' },
};

export const VAK_ORDER: VakId[] = [
  'loodgieter',
  'elektricien',
  'schilder',
  'hovenier',
  'timmerman',
  'stukadoor',
  'dakdekker',
];

const WERKBESTAND = '/kaart/leads.json';
const VOORBEELDBESTAND = '/kaart/leads.example.json';

export type Databron = 'werkbestand' | 'voorbeeld';

export interface GeladenProspects {
  bedrijven: Prospect[];
  bron: Databron;
  bijgewerkt?: string;
  bronbestand?: string;
}

function isProspect(value: unknown): value is Prospect {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.naam === 'string' &&
    typeof p.vak === 'string' &&
    p.vak in VAKKEN &&
    typeof p.plaats === 'string' &&
    typeof p.lat === 'number' &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

async function readFile(url: string): Promise<ProspectFile | null> {
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<ProspectFile>;
    if (!Array.isArray(data.bedrijven)) return null;
    return { ...data, bedrijven: data.bedrijven.filter(isProspect) };
  } catch {
    return null;
  }
}

/**
 * Leest het werkbestand en valt terug op het voorbeeld. Een leeg of kapot
 * bestand telt als "geen bestand": liever eerlijke voorbeelddata dan een lege kaart.
 */
export async function loadProspects(): Promise<GeladenProspects> {
  const werk = await readFile(WERKBESTAND);
  if (werk && werk.bedrijven.length > 0) {
    return {
      bedrijven: werk.bedrijven,
      bron: 'werkbestand',
      bijgewerkt: werk.bijgewerkt,
      bronbestand: werk.bron,
    };
  }
  const voorbeeld = await readFile(VOORBEELDBESTAND);
  return {
    bedrijven: voorbeeld?.bedrijven ?? [],
    bron: 'voorbeeld',
    bijgewerkt: voorbeeld?.bijgewerkt,
    bronbestand: voorbeeld?.bron,
  };
}

/** `06 12345678` → `+31612345678`, zodat `tel:` overal werkt. */
export function telHref(nummer?: string): string | undefined {
  if (!nummer) return undefined;
  const digits = nummer.replace(/[^\d+]/g, '');
  if (!digits) return undefined;
  if (digits.startsWith('+')) return `tel:${digits}`;
  if (digits.startsWith('0')) return `tel:+31${digits.slice(1)}`;
  return `tel:${digits}`;
}

/** Relatieve demo-link, zodat hij op elke host werkt (dev, preview, productie). */
export function demoPad(bedrijf: Prospect): string {
  const stijl = VAKKEN[bedrijf.vak].demoStijl;
  const params = new URLSearchParams();
  params.set('naam', bedrijf.naam);
  params.set('plaats', bedrijf.plaats);
  const telefoon = bedrijf.mobiel || bedrijf.telefoon;
  if (telefoon) params.set('tel', telefoon.replace(/[^\d+]/g, ''));
  return `/voorbeeld/${bedrijf.vak}/${stijl}?${params.toString()}`;
}

/** Score 0–100 → leesbare kwalificatie, gebruikt voor de kleur van de balkjes. */
export function scoreKleur(score?: number | null): string {
  if (score == null) return '#d6d3d1';
  if (score < 50) return '#dc2626';
  if (score < 90) return '#d97706';
  return '#15803d';
}
