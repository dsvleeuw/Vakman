import type { SectorId, StyleId } from '../types';
import { SECTORS, STYLES } from '../data/tradesData';

/**
 * Every view of the app gets a real, shareable URL. This module is pure so
 * the parsing/building rules can be unit-tested without a browser.
 *
 *   /                                   home
 *   /?vak=loodgieter                    home with a preselected trade
 *   /voorbeeld/loodgieter/signaal       generated trade website
 *   /start/vak                          wizard, step 1 (also /start)
 *   /start/gegevens?vak=schilder&stijl=modern
 *   /start/klaar                        wizard confirmation screen
 *   /componenten                        component library
 *   /componenten/trust-bar              component library with a selection
 *
 * Paths are Dutch because users see and share them; identifiers stay English.
 */

/** The five visible wizard steps, in order. */
export const WIZARD_STEPS = ['vak', 'stijl', 'gegevens', 'diensten', 'afspraak'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** The confirmation screen after booking an appointment is a step of its own. */
export type WizardRouteStep = WizardStep | 'klaar';

export const WIZARD_STEP_LABELS: Record<WizardRouteStep, string> = {
  vak: 'Vak',
  stijl: 'Stijl',
  gegevens: 'Gegevens',
  diensten: 'Diensten',
  afspraak: 'Afspraak',
  klaar: 'Klaar',
};

export const DEFAULT_SECTOR: SectorId = 'timmerman';
export const DEFAULT_STYLE_ID: StyleId = STYLES[0].id;

export type Route =
  | { name: 'home'; sector?: SectorId }
  | { name: 'wizard'; step: WizardRouteStep; sector?: SectorId; styleId?: StyleId }
  | { name: 'site'; sector: SectorId; styleId: StyleId }
  | { name: 'components'; componentId?: string }
  | { name: 'notFound'; path: string };

export function isSectorId(value: string | null | undefined): value is SectorId {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(SECTORS, value)
  );
}

export function isStyleId(value: string | null | undefined): value is StyleId {
  return typeof value === 'string' && STYLES.some((style) => style.id === value);
}

export function isWizardRouteStep(value: string | null | undefined): value is WizardRouteStep {
  return value === 'klaar' || WIZARD_STEPS.includes(value as WizardStep);
}

/** Clamp a style index to a valid one so callers never have to bounds-check. */
export function clampStyleIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  const rounded = Math.trunc(index);
  if (rounded < 0) return 0;
  if (rounded > STYLES.length - 1) return STYLES.length - 1;
  return rounded;
}

export function styleIndexFromId(styleId: StyleId): number {
  const index = STYLES.findIndex((style) => style.id === styleId);
  return index === -1 ? 0 : index;
}

export function styleIdFromIndex(index: number): StyleId {
  return STYLES[clampStyleIndex(index)].id;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Turn a pathname + query string into a route. Unknown paths return
 * `notFound` so the app can show a real 404 instead of a blank page.
 */
export function parseRoute(pathname: string, search = ''): Route {
  const params = new URLSearchParams(search);
  const segments = pathname.split('/').filter(Boolean).map(decodeSegment);
  const sectorParam = params.get('vak');
  const sector = isSectorId(sectorParam) ? sectorParam : undefined;

  if (segments.length === 0) {
    return sector ? { name: 'home', sector } : { name: 'home' };
  }

  const [first, second, third] = segments;

  if (first === 'start') {
    if (segments.length > 2) {
      return { name: 'notFound', path: pathname };
    }
    const step = second ?? 'vak';
    if (!isWizardRouteStep(step)) {
      return { name: 'notFound', path: pathname };
    }
    const styleParam = params.get('stijl');
    return {
      name: 'wizard',
      step,
      ...(sector ? { sector } : {}),
      ...(isStyleId(styleParam) ? { styleId: styleParam } : {}),
    };
  }

  if (first === 'voorbeeld') {
    if (segments.length > 3) return { name: 'notFound', path: pathname };
    if (!isSectorId(second)) return { name: 'notFound', path: pathname };
    const styleId = third ?? DEFAULT_STYLE_ID;
    if (!isStyleId(styleId)) return { name: 'notFound', path: pathname };
    return { name: 'site', sector: second, styleId };
  }

  if (first === 'componenten') {
    if (segments.length > 2) return { name: 'notFound', path: pathname };
    return second ? { name: 'components', componentId: second } : { name: 'components' };
  }

  return { name: 'notFound', path: pathname };
}

/** The canonical URL for a route. Used to rewrite legacy/alias URLs. */
export function buildPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return route.sector ? `/?vak=${route.sector}` : '/';
    case 'wizard': {
      const params = new URLSearchParams();
      if (route.sector) params.set('vak', route.sector);
      if (route.styleId) params.set('stijl', route.styleId);
      const query = params.toString();
      return `/start/${route.step}${query ? `?${query}` : ''}`;
    }
    case 'site':
      return `/voorbeeld/${route.sector}/${route.styleId}`;
    case 'components':
      return route.componentId
        ? `/componenten/${encodeURIComponent(route.componentId)}`
        : '/componenten';
    case 'notFound':
      return route.path || '/';
  }
}

/**
 * Map the pre-router query-param shortcuts (`?view=site&sector=…&style=2`,
 * `?autostart=1`, `?view=components`) onto real routes so old links and the
 * documented quick-test URLs keep working.
 */
export function routeFromLegacyQuery(search: string): Route | null {
  const params = new URLSearchParams(search);
  const hasLegacyParam =
    params.has('view') || params.has('autostart') || params.has('sector') || params.has('style');
  if (!hasLegacyParam) return null;

  const view = params.get('view');
  const autostart = params.get('autostart') === '1';
  const sectorParam = params.get('sector');
  const sector = isSectorId(sectorParam) ? sectorParam : undefined;
  const rawStyle = params.get('style');
  const parsedStyle = rawStyle !== null ? Number.parseInt(rawStyle, 10) : Number.NaN;
  const styleId = Number.isNaN(parsedStyle) ? undefined : styleIdFromIndex(parsedStyle);

  if (view === 'site' || autostart) {
    return { name: 'site', sector: sector ?? DEFAULT_SECTOR, styleId: styleId ?? DEFAULT_STYLE_ID };
  }
  if (view === 'start') {
    return { name: 'wizard', step: 'vak', sector, styleId };
  }
  if (view === 'components') {
    return { name: 'components' };
  }
  if (view === null && (sector || styleId)) {
    return { name: 'home', sector };
  }
  return null;
}

export interface RouteMeta {
  title: string;
  description: string;
}

const BASE_DESCRIPTION =
  'Klusbaas maakt professionele websites voor Nederlandse vakmensen. Kies je vak en stijl, vul je gegevens in en bekijk je eigen demo-website met prijscalculator en WhatsApp-contact.';

export function getRouteMeta(route: Route): RouteMeta {
  switch (route.name) {
    case 'home':
      return {
        title: 'Klusbaas · Websites voor vakmensen',
        description: BASE_DESCRIPTION,
      };
    case 'wizard': {
      if (route.step === 'klaar') {
        return {
          title: 'Afspraak aangevraagd · Klusbaas',
          description: 'Je afspraak is aangevraagd. Bekijk je gegenereerde vakmanssite of plan een nieuw moment.',
        };
      }
      const stepNumber = WIZARD_STEPS.indexOf(route.step) + 1;
      return {
        title: `Stap ${stepNumber} van 5: ${WIZARD_STEP_LABELS[route.step]} · Klusbaas`,
        description: BASE_DESCRIPTION,
      };
    }
    case 'site': {
      const sectorName = SECTORS[route.sector].name;
      const style = STYLES[styleIndexFromId(route.styleId)];
      return {
        title: `Voorbeeldwebsite ${sectorName.toLowerCase()} · ${style.name} · Klusbaas`,
        description: `Bekijk de ${style.name}-stijl voor een ${sectorName.toLowerCase()}: diensten, tarieven, prijscalculator, reviews en direct contact via WhatsApp.`,
      };
    }
    case 'components':
      return {
        title: 'Componentenbibliotheek · Klusbaas',
        description: 'Alle 30 componenten van Klusbaas en de gegenereerde vakmanssites, met live previews.',
      };
    case 'notFound':
      return {
        title: 'Pagina niet gevonden · Klusbaas',
        description: 'Deze pagina bestaat niet (meer). Ga terug naar de homepage of start je eigen website.',
      };
  }
}
