import React, { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import type { CustomSite, PlanId, SectorId, WizardDraft, WizardFormData } from './types';
import { SECTORS, STYLES, buildActiveSite } from './data/tradesData';
import {
  DEFAULT_SECTOR,
  buildPath,
  getRouteMeta,
  routeFromLegacyQuery,
  styleIdFromIndex,
  styleIndexFromId,
  type WizardRouteStep,
  mergeDemoPersonalization,
} from './utils/router';
import { isPlanId } from './data/plans';
import { applySiteContent, contentForCustomSite, sanitizeCustomSite } from './utils/siteContent';
import { navigate, replaceUrl, useRoute } from './hooks/useRouter';
import { track } from './utils/analytics';
import { ensureAllStyleFontsLoaded, ensureStyleFontLoaded } from './utils/fonts';
import { useRouteMeta } from './hooks/useRouteMeta';
import { Header } from './components/Header';
import { HeroStrip } from './components/HeroStrip';
import { PresetsSection } from './components/PresetsSection';
import { HowItWorks } from './components/HowItWorks';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { NotFoundView } from './components/NotFoundView';
import { RouteLink } from './components/RouteLink';
import { SiteFooter } from './components/SiteFooter';

// Route-level code splitting: the marketing page stays small and the heavy
// screens (generated site, wizard, library) load when they are opened.
const SiteView = lazy(() =>
  import('./components/SiteView').then((module) => ({ default: module.SiteView }))
);
const WizardView = lazy(() =>
  import('./components/WizardView').then((module) => ({ default: module.WizardView }))
);
const QuoteView = lazy(() =>
  import('./components/QuoteView').then((module) => ({ default: module.QuoteView }))
);
// Privacy, nieuwsbrief and afmelden share one small chunk.
const PrivacyView = lazy(() =>
  import('./components/InfoPages').then((module) => ({ default: module.PrivacyView }))
);
const NewsletterView = lazy(() =>
  import('./components/InfoPages').then((module) => ({ default: module.NewsletterView }))
);
const UnsubscribeView = lazy(() =>
  import('./components/InfoPages').then((module) => ({ default: module.UnsubscribeView }))
);
const ComponentGallery = lazy(() =>
  import('./components/ComponentGallery').then((module) => ({
    default: module.ComponentGallery,
  }))
);
const ProspectMapView = lazy(() =>
  import('./components/ProspectMapView').then((module) => ({
    default: module.ProspectMapView,
  }))
);
const SiteEditor = lazy(() =>
  import('./components/editor/SiteEditor').then((module) => ({
    default: module.SiteEditor,
  }))
);

const PageFallback: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="min-h-screen bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-4"
    role="status"
    aria-live="polite"
  >
    <span className="w-9 h-9 rounded-full border-2 border-stone-300 border-t-stone-900 animate-spin" />
    <span className="text-sm font-bold">{label}</span>
  </div>
);

const DRAFT_STORAGE_KEY = 'klusbaas_wizard_draft';

function loadDraft(): WizardDraft {
  const fallback: WizardDraft = {
    sector: DEFAULT_SECTOR,
    styleIndex: 0,
    form: null,
    disabledServices: {},
    sectorChosen: false,
    addons: [],
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WizardDraft>;
    if (!parsed || typeof parsed !== 'object') return fallback;
    const sector =
      typeof parsed.sector === 'string' && parsed.sector in SECTORS
        ? (parsed.sector as SectorId)
        : fallback.sector;
    return {
      sector,
      styleIndex:
        typeof parsed.styleIndex === 'number' && parsed.styleIndex >= 0 && parsed.styleIndex < STYLES.length
          ? parsed.styleIndex
          : 0,
      form: parsed.form ?? null,
      disabledServices: parsed.disabledServices ?? {},
      sectorChosen: typeof parsed.sectorChosen === 'boolean' ? parsed.sectorChosen : true,
      addons: Array.isArray(parsed.addons) ? parsed.addons.filter((id) => typeof id === 'string') : [],
      ...(parsed.channel === 'WhatsApp' || parsed.channel === 'E-mail' || parsed.channel === 'Allebei'
        ? { channel: parsed.channel }
        : {}),
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const route = useRoute();
  const routeRef = useRef(route);
  routeRef.current = route;

  useRouteMeta(route);

  // One page_view per route, so the funnel has a denominator.
  useEffect(() => {
    track('page_view', { route: route.name, path: window.location.pathname });
  }, [route]);

  // Personal demo links (?naam=&plaats=&tel=) only apply after hydration:
  // the prerendered HTML has the sector defaults, so the first client render
  // must match it before the URL details take over.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const personal = hydrated && route.name === 'site' ? route.personal : undefined;
  const wizardPrefill = hydrated && route.name === 'wizard' ? route.prefill : undefined;

  const [draft, setDraft] = useState<WizardDraft>(loadDraft);
  const [scrolled, setScrolled] = useState(false);

  // Store the site each craftsman filled in himself, per sector.
  const [customData, setCustomData] = useState<Record<string, CustomSite>>(() => {
    try {
      const saved = localStorage.getItem('klusbaas_custom_sites');
      const parsed: unknown = saved ? JSON.parse(saved) : {};
      if (typeof parsed !== 'object' || parsed === null) return {};
      const entries = Object.entries(parsed as Record<string, unknown>);
      const sites: Record<string, CustomSite> = {};
      for (const [sector, value] of entries) {
        const site = sanitizeCustomSite(value);
        if (site) sites[sector] = site;
      }
      return sites;
    } catch {
      return {};
    }
  });

  // Track window scroll for header shrinkage
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Translate pre-router URLs (?view=site&sector=…&style=2, ?autostart=1) to
  // the new paths, plus normalise aliases such as /voorbeeld/timmerman.
  useEffect(() => {
    const legacy = routeFromLegacyQuery(window.location.search);
    if (legacy) {
      navigate(legacy, { replace: true });
      return;
    }
    const canonical = buildPath(routeRef.current);
    const current = `${window.location.pathname}${window.location.search}`;
    if (canonical !== current && routeRef.current.name !== 'notFound') {
      // Keep the entry's state (scrollY) so the browser can restore the offset
      // later instead of losing it on this alias rewrite.
      window.history.replaceState(window.history.state ?? {}, '', canonical);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDraftChange = useCallback((next: WizardDraft) => {
    setDraft(next);
    try {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors (private mode, quota)
    }
  }, []);

  /** Keep the wizard URL in sync with the trade/style picked inside it. */
  const handleWizardSelectionChange = useCallback((sector: SectorId, styleIndex: number, plan?: PlanId) => {
    const current = routeRef.current;
    if (current.name !== 'wizard') return;
    const styleId = styleIdFromIndex(styleIndex);
    const nextPlan = plan ?? current.plan;
    if (current.sector === sector && current.styleId === styleId && current.plan === nextPlan) return;
    replaceUrl(
      { name: 'wizard', step: current.step, sector, styleId, plan: nextPlan, prefill: current.prefill },
      { scroll: false, keepHash: true }
    );
  }, []);

  const handleSelectSector = (sectorId: SectorId) => {
    const current = routeRef.current;
    if (current.name === 'site') {
      navigate({ name: 'site', sector: sectorId, styleId: current.styleId }, { scroll: false });
      return;
    }
    replaceUrl({ name: 'home', sector: sectorId }, { scroll: false, keepHash: true });
  };

  const handleOpenSite = (sectorId: SectorId, styleIdx: number) => {
    navigate({ name: 'site', sector: sectorId, styleId: styleIdFromIndex(styleIdx) });
  };

  const handleChooseStyle = (sectorId: SectorId, styleIdx: number) => {
    const current = routeRef.current;
    navigate({
      name: 'wizard',
      step: 'gegevens',
      sector: sectorId,
      styleId: styleIdFromIndex(styleIdx),
      plan: current.name === 'wizard' ? current.plan : undefined,
    });
  };

  /**
   * Pricing-table CTAs start the wizard and carry the chosen package along.
   * The guard matters because some CTAs pass this handler straight to
   * `onClick`, which would otherwise forward the click event as a plan id.
   */
  const handleGoStart = (planId?: PlanId) => {
    navigate({
      name: 'wizard',
      step: 'vak',
      plan: typeof planId === 'string' && isPlanId(planId) ? planId : undefined,
    });
  };

  const handleGoHome = () => {
    navigate({ name: 'home' });
  };

  const handleWizardStepChange = (step: WizardRouteStep) => {
    const current = routeRef.current;
    if (current.name !== 'wizard') return;
    navigate({
      name: 'wizard',
      step,
      sector: current.sector ?? draft.sector,
      styleId: current.styleId ?? styleIdFromIndex(draft.styleIndex),
      plan: current.plan,
    });
  };

  const handleViewPublishedSite = (
    sectorId: SectorId,
    styleIdx: number,
    custom: CustomSite
  ) => {
    const form = custom.form;
    const hasCustomInput = Boolean(
      form.biz.trim() || form.owner.trim() || form.phone.trim() || form.city.trim()
    );
    if (hasCustomInput) {
      const updated = {
        ...customData,
        [sectorId]: custom,
      };
      setCustomData(updated);
      try {
        localStorage.setItem('klusbaas_custom_sites', JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }

    navigate({ name: 'site', sector: sectorId, styleId: styleIdFromIndex(styleIdx) });
  };

  const homeSector: SectorId =
    route.name === 'home' && route.sector ? route.sector : DEFAULT_SECTOR;

  const wizardSector: SectorId =
    route.name === 'wizard' && route.sector ? route.sector : draft.sector;
  const wizardStyleIndex =
    route.name === 'wizard' && route.styleId
      ? styleIndexFromId(route.styleId)
      : draft.styleIndex;

  useEffect(() => {
    if (route.name === 'site') {
      ensureStyleFontLoaded(route.styleId);
    } else if (route.name === 'wizard') {
      if (route.step === 'stijl') {
        ensureAllStyleFontsLoaded();
      } else {
        ensureStyleFontLoaded(styleIdFromIndex(wizardStyleIndex));
      }
    } else if (route.name === 'components') {
      ensureAllStyleFontsLoaded();
    }
  }, [route, wizardStyleIndex]);

  const meta = getRouteMeta(route);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:h-12 focus:px-5 focus:rounded-full focus:bg-stone-900 focus:text-white focus:font-bold focus:text-sm focus:flex focus:items-center focus:shadow-xl"
      >
        Naar de inhoud
      </a>

      {/* Announces each route change to screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {meta.title}
      </div>

      {/* 1. HOME VIEW */}
      {route.name === 'home' && (
        <div className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
          <Header scrolled={scrolled} currentSector={homeSector} />

          {/* Hero Section */}
          <main id="main-content" className="flex-1 flex flex-col">
            <section className="pt-12 sm:pt-20 md:pt-24 pb-8 sm:pb-12 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <span className="font-mono text-xs font-bold tracking-widest text-stone-500 uppercase">
                  WEBSITES VOOR VAKMENSEN · {Object.keys(SECTORS).length} VAKKEN · {STYLES.length} STIJLEN
                </span>
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.92] text-stone-900 text-balance m-0">
                  Jouw vak. Jouw website. Binnen een kwartier.
                </h1>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-5 pb-2">
                <p className="text-base sm:text-lg text-stone-600 leading-relaxed m-0 text-pretty">
                  Kies je vak en een van de vijf doordachte stijlen. Diensten,
                  prijzen, professionele fotografie en een interactieve
                  prijscalculator staan direct klaar. Jij vult alleen je naam en
                  telefoonnummer in.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <RouteLink
                    route={{ name: 'wizard', step: 'vak' }}
                    className="h-14 px-8 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center"
                  >
                    Start je website →
                  </RouteLink>
                  <a
                    href="#presets"
                    className="h-14 px-6 rounded-full border-2 border-stone-900 bg-transparent hover:bg-white text-stone-900 font-bold text-base flex items-center transition-colors"
                  >
                    Bekijk presets
                  </a>
                </div>
              </div>
            </section>

            {/* Marquee Showcase Strip */}
            <HeroStrip />

            {/* Interactive Presets Gallery */}
            <PresetsSection
              selectedSector={homeSector}
              onSelectSector={handleSelectSector}
              onOpenSite={handleOpenSite}
              onChooseStyle={handleChooseStyle}
              useLinks
            />

            {/* How It Works */}
            <HowItWorks onStart={handleGoStart} />

            {/* Platform Pricing */}
            <PricingSection onStart={handleGoStart} />

            {/* Platform FAQ */}
            <FaqSection />
          </main>

          <SiteFooter />
        </div>
      )}

      {/* 2. COMPONENT LIBRARY */}
      {route.name === 'components' && (
        <Suspense
          fallback={
            <div
              className="min-h-screen bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-4"
              role="status"
              aria-live="polite"
            >
              <span className="w-9 h-9 rounded-full border-2 border-stone-300 border-t-stone-900 animate-spin" />
              <span className="text-sm font-bold">Componentenbibliotheek laden…</span>
            </div>
          }
        >
          <ComponentGallery
            initialComponentId={route.componentId}
            onComponentChange={(componentId) =>
              navigate({ name: 'components', componentId }, { scroll: false })
            }
            onGoHome={handleGoHome}
            onGoStart={handleGoStart}
            onChooseStyle={handleChooseStyle}
            onViewPublishedSite={handleViewPublishedSite}
          />
        </Suspense>
      )}

      {/* 3. WERKKAART (intern, niet in de navigatie of sitemap) */}
      {route.name === 'prospects' && (
        <Suspense fallback={<PageFallback label="Werkkaart laden…" />}>
          <ProspectMapView />
        </Suspense>
      )}

      {/* 4. LIVE SITE VIEW */}
      {route.name === 'site' && (
        <div id="main-content">
          <Suspense fallback={<PageFallback label="Voorbeeldwebsite laden…" />}>
            <SiteView
              site={applySiteContent(
                buildActiveSite(
                  route.sector,
                  styleIndexFromId(route.styleId),
                  mergeDemoPersonalization(customData[route.sector]?.form, personal),
                  undefined,
                  undefined,
                  // Een site met de gegevens van de klant is geen demosite:
                  // geen demonummer en geen demomelding.
                  Boolean(customData[route.sector])
                ),
                contentForCustomSite(
                  customData[route.sector] ?? {
                    form: { biz: '', owner: '', phone: '', city: '' },
                    blocks: [],
                    disabledServices: {},
                  },
                  route.sector,
                  route.styleId
                )
              )}
              selectedSector={route.sector}
              selectedStyleIndex={styleIndexFromId(route.styleId)}
              isCustomized={!!customData[route.sector]}
              personal={personal}
            />
          </Suspense>
        </div>
      )}

      {/* 4b. DE KLANT VULT ZIJN EIGEN SITE IN */}
      {route.name === 'editor' && (
        <div id="main-content">
          <Suspense fallback={<PageFallback label="Je site laden…" />}>
            <SiteEditor sector={route.sector} styleId={route.styleId} />
          </Suspense>
        </div>
      )}

      {/* 4. WIZARD ONBOARDING VIEW */}
      {route.name === 'wizard' && (
        <Suspense fallback={<PageFallback label="Wizard laden…" />}>
        <WizardView
          step={route.step}
          onStepChange={handleWizardStepChange}
          initialSector={wizardSector}
          hasInitialSector={Boolean(route.sector || draft.sectorChosen)}
          initialStyleIndex={wizardStyleIndex}
          initialForm={draft.form}
          prefill={wizardPrefill}
          initialDisabledServices={draft.sector === wizardSector ? draft.disabledServices : undefined}
          initialAddons={draft.addons}
          initialChannel={draft.channel}
          plan={route.plan}
          onDraftChange={handleDraftChange}
          onSelectionChange={handleWizardSelectionChange}
          onGoHome={handleGoHome}
          onViewPublishedSite={handleViewPublishedSite}
        />
        </Suspense>
      )}

      {/* 5. STORED QUOTE (token link from the e-mail) */}
      {route.name === 'quote' && (
        <Suspense fallback={<PageFallback label="Offerte laden…" />}>
          <QuoteView id={route.id} token={route.token} onGoHome={handleGoHome} />
        </Suspense>
      )}

      {/* 6. PRIVACY, NIEUWSBRIEF, AFMELDEN */}
      {route.name === 'privacy' && (
        <Suspense fallback={<PageFallback label="Privacyverklaring laden…" />}>
          <PrivacyView />
        </Suspense>
      )}
      {route.name === 'newsletter' && (
        <Suspense fallback={<PageFallback label="Nieuwsbrief laden…" />}>
          {/* The ?status= banner only after hydration: the prerendered page has none. */}
          <NewsletterView status={hydrated ? route.status : undefined} />
        </Suspense>
      )}
      {route.name === 'unsubscribe' && (
        <Suspense fallback={<PageFallback label="Afmelden laden…" />}>
          <UnsubscribeView token={hydrated ? route.token : undefined} />
        </Suspense>
      )}

      {/* 7. 404 */}
      {route.name === 'notFound' && (
        <NotFoundView path={route.path} onGoHome={handleGoHome} />
      )}
    </div>
  );
}
