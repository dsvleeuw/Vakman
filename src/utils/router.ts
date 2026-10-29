import type { PlanId, SectorId, StyleId, WizardFormData } from '../types';
import { SECTORS, STYLES } from '../data/tradesData';
import { isPlanId } from '../data/plans';
import { normalizeDutchPhone } from './contact';
import { isQuoteNumber } from './quote';
import { isNewsletterPageStatus, isNewsletterToken, type NewsletterPageStatus } from './newsletterStatus';

/**
 * Every view of the app gets a real, shareable URL. This module is pure so
 * the parsing/building rules can be unit-tested without a browser.
 *
 *   /                                   home
 *   /?vak=loodgieter                    home with a preselected trade
 *   /voorbeeld/loodgieter/signaal       generated trade website
 *   /voorbeeld/schilder/modern?naam=Schildersbedrijf%20Jansen&plaats=Hoofddorp
 *                                       personal demo link for a prospect
 *   /start/vak                          wizard, step 1 (also /start)
 *   /start/gegevens?vak=schilder&stijl=modern
 *   /start/gegevens?vak=schilder&naam=…&plaats=…&tel=…   prefilled details
 *   /start/klaar                        wizard confirmation screen
 *   /mijn-account                       login and the sites of the customer
 *   /componenten                        component library
 *   /componenten/trust-bar              component library with a selection
 *   /offerte/KB-2026-0001?token=…       a stored quote (token-protected)
 *   /privacy                            privacyverklaring
 *   /nieuwsbrief?status=bevestigd       newsletter signup / confirmation result
 *   /afmelden?token=…                   unsubscribe from the newsletter
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
  afspraak: 'Offerte',
  klaar: 'Klaar',
};

export const DEFAULT_SECTOR: SectorId = 'timmerman';
export const DEFAULT_STYLE_ID: StyleId = STYLES[0].id;

/**
 * Business details carried in a personal demo link (`?naam=&plaats=&tel=`).
 * Only fields that survived validation are present.
 */
export interface DemoPersonalization {
  biz?: string;
  city?: string;
  phone?: string;
}

/** Long enough for any real trade name, short enough to keep layouts intact. */
const MAX_PERSONAL_TEXT = 60;

function cleanPersonalText(value: string | null): string | undefined {
  if (value === null) return undefined;
  const cleaned = value.replace(/\s+/g, ' ').trim().slice(0, MAX_PERSONAL_TEXT).trim();
  return cleaned || undefined;
}

/**
 * Read `naam`, `plaats` and `tel` from a query string. The phone number only
 * counts when it is a valid Dutch number; it is kept in its normalised
 * 10-digit form. Returns `undefined` when nothing usable is present.
 */
export function parseDemoPersonalization(
  params: URLSearchParams
): DemoPersonalization | undefined {
  const biz = cleanPersonalText(params.get('naam'));
  const city = cleanPersonalText(params.get('plaats'));
  const rawPhone = params.get('tel');
  const phone = rawPhone ? normalizeDutchPhone(rawPhone) ?? undefined : undefined;
  if (!biz && !city && !phone) return undefined;
  return {
    ...(biz ? { biz } : {}),
    ...(city ? { city } : {}),
    ...(phone ? { phone } : {}),
  };
}

function setPersonalParams(params: URLSearchParams, personal?: DemoPersonalization) {
  if (!personal) return;
  if (personal.biz) params.set('naam', personal.biz);
  if (personal.city) params.set('plaats', personal.city);
  if (personal.phone) params.set('tel', personal.phone);
}

/**
 * Combine wizard details saved on this device with a personal demo link.
 * The link wins per field because it is the explicit request; empty fields
 * stay empty so `buildActiveSite` falls back to the sector defaults, exactly
 * like the wizard does.
 */
export function mergeDemoPersonalization(
  saved: WizardFormData | undefined,
  personal: DemoPersonalization | undefined
): WizardFormData | undefined {
  if (!personal) return saved;
  return {
    biz: personal.biz ?? saved?.biz ?? '',
    owner: saved?.owner ?? '',
    phone: personal.phone ?? saved?.phone ?? '',
    city: personal.city ?? saved?.city ?? '',
  };
}

export type Route =
  | { name: 'home'; sector?: SectorId }
  | {
      name: 'wizard';
      step: WizardRouteStep;
      sector?: SectorId;
      styleId?: StyleId;
      /** Chosen package from the pricing table, e.g. /start/vak?pakket=pro */
      plan?: PlanId;
      /** Details to prefill, e.g. from "Maak dit mijn website" on a demo link. */
      prefill?: DemoPersonalization;
    }
  | { name: 'site'; sector: SectorId; styleId: StyleId; personal?: DemoPersonalization }
  /** De editor waarin een vakman zijn eigen site invult: /mijn-site */
  | {
      name: 'editor';
      sector?: SectorId;
      styleId?: StyleId;
      /** A published site that is being changed: /mijn-site/<slug>?token=… */
      slug?: string;
      /** The management token of that site. */
      token?: string;
    }
  /** A site a customer published: /site/<slug> */
  | { name: 'published'; slug: string }
  /** The account of the customer: login and his own sites. /mijn-account */
  | { name: 'account' }
  | { name: 'components'; componentId?: string }
  /** The overview of Klusbaas: /klusbaas */
  | { name: 'admin' }
  | { name: 'prospects' }
  | { name: 'quote'; id: string; token: string }
  | { name: 'privacy' }
  | { name: 'newsletter'; status?: NewsletterPageStatus }
  | { name: 'unsubscribe'; token?: string }
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
    const planParam = params.get('pakket');
    const prefill = parseDemoPersonalization(params);
    return {
      name: 'wizard',
      step,
      ...(sector ? { sector } : {}),
      ...(isStyleId(styleParam) ? { styleId: styleParam } : {}),
      ...(isPlanId(planParam) ? { plan: planParam } : {}),
      ...(prefill ? { prefill } : {}),
    };
  }

  if (first === 'voorbeeld') {
    if (segments.length > 3) return { name: 'notFound', path: pathname };
    if (!isSectorId(second)) return { name: 'notFound', path: pathname };
    const styleId = third ?? DEFAULT_STYLE_ID;
    if (!isStyleId(styleId)) return { name: 'notFound', path: pathname };
    const personal = parseDemoPersonalization(params);
    return { name: 'site', sector: second, styleId, ...(personal ? { personal } : {}) };
  }

  if (first === 'mijn-site') {
    if (segments.length > 2) return { name: 'notFound', path: pathname };
    const styleParam = params.get('stijl');
    const token = params.get('token');
    const slug = second;
    return {
      name: 'editor',
      ...(sector ? { sector } : {}),
      ...(isStyleId(styleParam) ? { styleId: styleParam } : {}),
      ...(slug ? { slug } : {}),
      ...(token ? { token } : {}),
    };
  }

  if (first === 'mijn-account') {
    if (segments.length > 1) return { name: 'notFound', path: pathname };
    return { name: 'account' };
  }

  if (first === 'site') {
    // The public address of a site a customer published.
    if (segments.length !== 2 || !second) return { name: 'notFound', path: pathname };
    return { name: 'published', slug: second };
  }

  if (first === 'offerte') {
    if (segments.length !== 2 || !isQuoteNumber(second)) return { name: 'notFound', path: pathname };
    return { name: 'quote', id: second, token: params.get('token') ?? '' };
  }

  if (segments.length === 1 && first === 'privacy') return { name: 'privacy' };
  if (segments.length === 1 && first === 'nieuwsbrief') {
    const status = params.get('status');
    return isNewsletterPageStatus(status) ? { name: 'newsletter', status } : { name: 'newsletter' };
  }
  if (segments.length === 1 && first === 'afmelden') {
    const token = params.get('token');
    return isNewsletterToken(token) ? { name: 'unsubscribe', token } : { name: 'unsubscribe' };
  }

  // Het overzicht van Klusbaas zelf. Bewust niet in de navigatie, niet in de
  // sitemap en niet geprerenderd: het is gereedschap, geen marketingpagina.
  if (first === 'klusbaas') {
    if (segments.length > 1) return { name: 'notFound', path: pathname };
    return { name: 'admin' };
  }

  if (first === 'componenten') {
    if (segments.length > 2) return { name: 'notFound', path: pathname };
    return second ? { name: 'components', componentId: second } : { name: 'components' };
  }

  // Interne werkkaart met de leadlijst. Bewust niet in de navigatie, niet in de
  // sitemap en niet geprerenderd: het is gereedschap, geen marketingpagina.
  if (first === 'kaart') {
    if (segments.length > 1) return { name: 'notFound', path: pathname };
    return { name: 'prospects' };
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
      if (route.plan) params.set('pakket', route.plan);
      setPersonalParams(params, route.prefill);
      const query = params.toString();
      return `/start/${route.step}${query ? `?${query}` : ''}`;
    }
    case 'site': {
      const params = new URLSearchParams();
      setPersonalParams(params, route.personal);
      const query = params.toString();
      return `/voorbeeld/${route.sector}/${route.styleId}${query ? `?${query}` : ''}`;
    }
    case 'editor': {
      const params = new URLSearchParams();
      if (route.sector) params.set('vak', route.sector);
      if (route.styleId) params.set('stijl', route.styleId);
      if (route.token) params.set('token', route.token);
      const query = params.toString();
      if (route.slug) {
        return `/mijn-site/${encodeURIComponent(route.slug)}${query ? `?${query}` : ''}`;
      }
      return `/mijn-site${query ? `?${query}` : ''}`;
    }
    case 'published':
      return `/site/${encodeURIComponent(route.slug)}`;
    case 'account':
      return '/mijn-account';
    case 'components':
      return route.componentId
        ? `/componenten/${encodeURIComponent(route.componentId)}`
        : '/componenten';
    case 'admin':
      return '/klusbaas';
    case 'prospects':
      return '/kaart';
    case 'quote':
      return `/offerte/${encodeURIComponent(route.id)}${route.token ? `?token=${encodeURIComponent(route.token)}` : ''}`;
    case 'privacy':
      return '/privacy';
    case 'newsletter':
      return route.status ? `/nieuwsbrief?status=${route.status}` : '/nieuwsbrief';
    case 'unsubscribe':
      return route.token ? `/afmelden?token=${encodeURIComponent(route.token)}` : '/afmelden';
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
          title: 'Offerte aangevraagd · Klusbaas',
          description: 'Je offerte-aanvraag is verstuurd. Bekijk je offerte of je gegenereerde vakmanssite.',
        };
      }
      const stepNumber = WIZARD_STEPS.indexOf(route.step) + 1;
      return {
        title: `Stap ${stepNumber} van ${WIZARD_STEPS.length}: ${WIZARD_STEP_LABELS[route.step]} · Klusbaas`,
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
    case 'admin':
      return {
        title: 'Klusbaas-overzicht',
        description: 'Intern overzicht van Klusbaas: de aanvragen, de offertes en de gepubliceerde sites.',
      };
    case 'prospects':
      return {
        title: 'Werkkaart · Klusbaas',
        description: 'Interne werkkaart met de bedrijven uit de leadlijst Noord-Holland.',
      };
    case 'editor':
      return {
        title: 'Mijn site · Klusbaas',
        description:
          'Vul je eigen vakmansite: je gegevens, je tekst en de onderdelen die je op je site wilt hebben.',
      };
    case 'published':
      return {
        title: 'Vakmanssite · Klusbaas',
        description: 'Een website van een vakman, gemaakt met Klusbaas.',
      };
    case 'account':
      return {
        title: 'Mijn account · Klusbaas',
        description:
          'Log in om je eigen websites te beheren: tekst aanpassen, onderdelen kiezen en je site bekijken.',
      };
    case 'components':
      return {
        title: 'Componentenbibliotheek · Klusbaas',
        description: 'Alle 30 componenten van Klusbaas en de gegenereerde vakmanssites, met live previews.',
      };
    case 'quote':
      return {
        title: `Offerte ${route.id} · Klusbaas`,
        description: 'Je offerte van Klusbaas: pakket, extra componenten, btw en totaal, 30 dagen geldig.',
      };
    case 'privacy':
      return {
        title: 'Privacyverklaring · Klusbaas',
        description: 'Welke gegevens Klusbaas verwerkt bij formulieren, offertes en de nieuwsbrief, waarom, hoe lang we ze bewaren en welke rechten je hebt.',
      };
    case 'newsletter':
      return {
        title: 'Nieuwsbrief · Klusbaas',
        description: 'Af en toe tips voor je vakmanswebsite: nieuwe stijlen, slimme tools en wat werkt in de Haarlemmermeer. Aanmelden met dubbele bevestiging, afmelden kan altijd.',
      };
    case 'unsubscribe':
      return {
        title: 'Afmelden nieuwsbrief · Klusbaas',
        description: 'Meld je af voor de Klusbaas-nieuwsbrief. Je krijgt daarna geen nieuwsbrief meer van ons.',
      };
    case 'notFound':
      return {
        title: 'Pagina niet gevonden · Klusbaas',
        description: 'Deze pagina bestaat niet (meer). Ga terug naar de homepage of start je eigen website.',
      };
  }
}
