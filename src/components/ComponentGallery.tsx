import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Code,
  Layers,
  MousePointer,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { SectorId, WizardFormData } from '../types';
import type { WizardRouteStep } from '../utils/router';
import { buildActiveSite } from '../data/tradesData';
import {
  COMPONENT_ENTRIES,
  COMPONENT_FILTERS,
  type ComponentCatalogEntry,
  type ComponentFilter,
} from '../data/componentCatalog';
import { AreaChecker } from './AreaChecker';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { BookingCalendar } from './BookingCalendar';
import { ContactSection } from './ContactSection';
import { FaqSection } from './FaqSection';
import { Header } from './Header';
import { HeroStrip } from './HeroStrip';
import { HowItWorks } from './HowItWorks';
import {
  ArrowRightIcon,
  CheckIcon,
  PhoneIcon,
  StarIcon,
  StarRating,
} from './Icons';
import { ImageWithFallback } from './ImageWithFallback';
import { PresetsSection } from './PresetsSection';
import { PriceCalculator } from './PriceCalculator';
import { PricingSection } from './PricingSection';
import { SiteView } from './SiteView';
import { WizardView } from './WizardView';
import { RouteLink } from './RouteLink';
import { track } from '../utils/analytics';
import { EmergencyButton } from './tools/EmergencyButton';
import { FaultReportForm } from './tools/FaultReportForm';
import { ProjectTimeline } from './tools/ProjectTimeline';
import { SurfaceCalculator } from './tools/SurfaceCalculator';
import { TradeTool } from './tools/TradeTool';
import {
  AvailabilityCard,
  ContactCtaBanner,
  GuaranteeList,
  OpeningHoursCard,
  ProjectStats,
  PromotionBanner,
  ServiceAreaChips,
  TeamMemberCard,
  TestimonialCard,
  TrustBar,
} from './extras';

interface ComponentGalleryProps {
  /** /componenten/:id — the selected component lives in the URL. */
  initialComponentId?: string;
  onComponentChange?: (componentId: string) => void;
  onGoHome: () => void;
  onGoStart: () => void;
  onChooseStyle: (sectorId: SectorId, styleIndex: number) => void;
  onViewPublishedSite: (
    sectorId: SectorId,
    styleIndex: number,
    form: WizardFormData
  ) => void;
}

/**
 * The catalogue embeds the wizard as a live preview. The preview keeps its
 * own step state so it never hijacks the real wizard URL.
 */
const WizardPreview: React.FC<{
  sector: SectorId;
  styleIndex: number;
  onGoHome: () => void;
  onViewPublishedSite: ComponentGalleryProps['onViewPublishedSite'];
}> = ({ sector, styleIndex, onGoHome, onViewPublishedSite }) => {
  const [step, setStep] = useState<WizardRouteStep>('vak');
  return (
    <WizardView
      step={step}
      onStepChange={setStep}
      initialSector={sector}
      initialStyleIndex={styleIndex}
      onGoHome={onGoHome}
      onViewPublishedSite={onViewPublishedSite}
    />
  );
};

const PLUMBER_SITE = buildActiveSite('loodgieter', 0);
const ELECTRICIAN_SITE = buildActiveSite('elektricien', 0);
const PAINTER_SITE = buildActiveSite('schilder', 0);
const CARPENTER_SITE = buildActiveSite('timmerman', 0);

export const ComponentGallery: React.FC<ComponentGalleryProps> = ({
  initialComponentId,
  onComponentChange,
  onGoHome,
  onGoStart,
  onChooseStyle,
  onViewPublishedSite,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ComponentFilter>('Alles');
  const [selectedId, setSelectedId] = useState(
    () => (COMPONENT_ENTRIES.some((entry) => entry.id === initialComponentId) ? initialComponentId! : 'trust-bar')
  );

  // Selecting a component updates the URL so it can be shared or reopened.
  const selectComponent = (componentId: string) => {
    track('component_view', { component: componentId });
    setSelectedId(componentId);
    onComponentChange?.(componentId);
  };

  // Follow the URL when the visitor uses back/forward or opens a deep link.
  const lastSyncedId = useRef(initialComponentId);
  useEffect(() => {
    if (!initialComponentId || initialComponentId === lastSyncedId.current) return;
    lastSyncedId.current = initialComponentId;
    if (COMPONENT_ENTRIES.some((entry) => entry.id === initialComponentId)) {
      setSelectedId(initialComponentId);
    }
  }, [initialComponentId]);
  const [demoSector, setDemoSector] = useState<SectorId>('timmerman');
  const [demoStyleIndex, setDemoStyleIndex] = useState(0);

  const demoSite = useMemo(
    () => buildActiveSite(demoSector, demoStyleIndex),
    [demoSector, demoStyleIndex]
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('nl-NL');
    return COMPONENT_ENTRIES.filter((entry) => {
      const matchesFilter = activeFilter === 'Alles' || entry.category === activeFilter;
      const matchesQuery =
        !normalizedQuery ||
        `${entry.name} ${entry.label} ${entry.description} ${entry.file}`
          .toLocaleLowerCase('nl-NL')
          .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ?? filteredEntries[0];
  const newComponentCount = COMPONENT_ENTRIES.filter((entry) => entry.isNew).length;
  const existingComponentCount = COMPONENT_ENTRIES.length - newComponentCount;

  const beforeAfterProject = demoSite.beforeAfter?.[0] ?? {
    title: 'Project op maat',
    location: demoSite.city,
    beforeImg: demoSite.img.a,
    afterImg: demoSite.img.b,
    description: 'Een zorgvuldig uitgevoerd project met duidelijke afspraken en een nette oplevering.',
  };

  const renderPreview = (entry: ComponentCatalogEntry) => {
    switch (entry.id) {
      case 'trust-bar':
        return <TrustBar site={demoSite} />;
      case 'opening-hours':
        return <OpeningHoursCard site={demoSite} />;
      case 'availability':
        return <AvailabilityCard site={demoSite} />;
      case 'team-member':
        return <TeamMemberCard site={demoSite} />;
      case 'testimonial':
        return <TestimonialCard site={demoSite} />;
      case 'guarantees':
        return <GuaranteeList site={demoSite} />;
      case 'promotion':
        return <PromotionBanner site={demoSite} />;
      case 'service-areas':
        return <ServiceAreaChips site={demoSite} />;
      case 'project-stats':
        return <ProjectStats site={demoSite} />;
      case 'contact-cta':
        return <ContactCtaBanner site={demoSite} />;
      case 'header':
        return <Header />;
      case 'hero-strip':
        return <HeroStrip onSelectSector={setDemoSector} />;
      case 'presets-section':
        return (
          <PresetsSection
            selectedSector={demoSector}
            onSelectSector={setDemoSector}
            onOpenSite={(sectorId, styleIndex) => {
              setDemoSector(sectorId);
              setDemoStyleIndex(styleIndex);
              setQuery('');
              setActiveFilter('Alles');
              selectComponent('site-view');
            }}
            onChooseStyle={onChooseStyle}
          />
        );
      case 'how-it-works':
        return <HowItWorks onStart={onGoStart} />;
      case 'pricing-section':
        return <PricingSection onStart={onGoStart} />;
      case 'faq-section':
        return <FaqSection />;
      case 'wizard-view':
        return (
          <WizardPreview
            sector={demoSector}
            styleIndex={demoStyleIndex}
            onGoHome={onGoHome}
            onViewPublishedSite={onViewPublishedSite}
          />
        );
      case 'area-checker':
        return <AreaChecker site={demoSite} />;
      case 'before-after':
        return <BeforeAfterSlider project={beforeAfterProject} />;
      case 'booking-calendar':
        return <BookingCalendar site={demoSite} />;
      case 'contact-section':
        return <ContactSection site={demoSite} />;
      case 'price-calculator':
        return <PriceCalculator site={demoSite} />;
      case 'site-view':
        return (
          <SiteView
            site={demoSite}
            selectedSector={demoSector}
            selectedStyleIndex={demoStyleIndex}
            embedded
          />
        );
      case 'icons':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-stone-900">
            {[
              { label: 'CheckIcon', icon: <CheckIcon className="w-7 h-7" /> },
              { label: 'StarIcon', icon: <StarIcon className="w-7 h-7" /> },
              { label: 'StarRating', icon: <StarRating /> },
              { label: 'ArrowRightIcon', icon: <ArrowRightIcon className="w-7 h-7" /> },
              { label: 'PhoneIcon', icon: <PhoneIcon className="w-7 h-7" /> },
            ].map((item) => (
              <div
                key={item.label}
                className="min-h-32 p-5 rounded-2xl border border-stone-200 bg-white flex flex-col items-center justify-center gap-4 text-amber-500 shadow-sm"
              >
                {item.icon}
                <span className="font-mono text-xs font-semibold text-stone-500">{item.label}</span>
              </div>
            ))}
          </div>
        );
      case 'image-fallback':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <ImageWithFallback
                src={demoSite.img.a}
                alt="Voorbeeld van vakwerk"
                className="w-full h-64 object-cover rounded-2xl"
              />
              <span className="text-xs font-bold text-stone-500">Afbeelding geladen</span>
            </div>
            <div className="flex flex-col gap-3">
              <ImageWithFallback
                src="/afbeelding-die-niet-bestaat.jpg"
                alt="Vervangende afbeeldingsweergave"
                className="w-full h-64 rounded-2xl"
              />
              <span className="text-xs font-bold text-stone-500">Fallback bij een laadfout</span>
            </div>
          </div>
        );
      case 'emergency-button':
        return <EmergencyButton site={PLUMBER_SITE} />;
      case 'fault-report':
        return <FaultReportForm site={ELECTRICIAN_SITE} />;
      case 'project-timeline':
        return <ProjectTimeline site={CARPENTER_SITE} />;
      case 'surface-calculator':
        return <SurfaceCalculator site={PAINTER_SITE} />;
      case 'trade-tool':
        return <TradeTool site={ELECTRICIAN_SITE} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
            aria-label="Terug naar Klusbaas"
          >
            <span className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black">
              K
            </span>
            <span className="hidden sm:flex flex-col items-start">
              <strong className="text-lg leading-none">Klusbaas</strong>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mt-1">
                Ontwerpbibliotheek
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <RouteLink
              route={{ name: 'home' }}
              className="h-10 px-3 sm:px-4 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 text-stone-900 no-underline"
              aria-label="Terug naar website"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Terug naar website</span>
            </RouteLink>
            <RouteLink
              route={{ name: 'wizard', step: 'vak' }}
              className="h-10 px-4 sm:px-5 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 no-underline"
            >
              <span className="hidden sm:inline">Start je website</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </RouteLink>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col gap-10">
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 items-end">
          <div className="flex flex-col gap-5 max-w-4xl">
            <span className="flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-stone-500 uppercase">
              <Layers className="w-4 h-4" aria-hidden="true" />
              Klusbaas componentenbibliotheek
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.96] m-0 text-balance">
              Alle bouwstenen. Eén overzicht.
            </h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl m-0">
              Bekijk alle bestaande onderdelen en de nieuwe conversiecomponenten in een echte,
              interactieve omgeving. Kies een component links en probeer de preview rechts.
            </p>
          </div>

          <div className="flex flex-wrap lg:justify-end gap-2.5">
            <span className="h-10 px-4 rounded-full bg-white border border-stone-200 flex items-center gap-2 text-xs font-bold shadow-sm">
              <Code className="w-4 h-4 text-stone-500" aria-hidden="true" />
              {COMPONENT_ENTRIES.length} componenten
            </span>
            <span className="h-10 px-4 rounded-full bg-amber-300 border border-amber-300 flex items-center gap-2 text-xs font-extrabold text-amber-950 shadow-sm">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {newComponentCount} nieuw
            </span>
            <span className="h-10 px-4 rounded-full bg-white border border-stone-200 flex items-center gap-2 text-xs font-bold shadow-sm">
              <MousePointer className="w-4 h-4 text-stone-500" aria-hidden="true" />
              Live previews
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <aside className="lg:sticky lg:top-6 bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black m-0">Componenten</h2>
                  <p className="text-xs text-stone-500 m-0 mt-1">
                    {existingComponentCount} bestaand · {newComponentCount} nieuw
                  </p>
                </div>
                <span className="h-8 min-w-8 px-2 rounded-full bg-stone-100 text-xs font-bold text-stone-600 flex items-center justify-center">
                  {filteredEntries.length}
                </span>
              </div>

              <div className="relative">
                <label htmlFor="component-search" className="sr-only">
                  Zoek een component
                </label>
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="component-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Zoek op naam of functie…"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-stone-900 focus:outline-none text-base sm:text-sm font-medium"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border-0 bg-transparent hover:bg-stone-200 text-stone-500 cursor-pointer flex items-center justify-center"
                    aria-label="Zoekopdracht wissen"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5" aria-label="Filter componenten op categorie">
                {COMPONENT_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={activeFilter === filter}
                    className={`h-8 px-3 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                      activeFilter === filter
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <nav aria-label="Componentenoverzicht" className="p-2.5 max-h-[420px] lg:max-h-[calc(100vh-24rem)] lg:min-h-80 overflow-y-auto">
              {filteredEntries.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {filteredEntries.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => selectComponent(entry.id)}
                        aria-pressed={isSelected}
                        className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                            : 'bg-transparent border-transparent hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-bold leading-snug">{entry.label}</span>
                            <span
                              className={`font-mono text-[10px] truncate ${
                                isSelected ? 'text-stone-400' : 'text-stone-400'
                              }`}
                            >
                              {entry.name}
                            </span>
                          </span>
                          {entry.isNew && (
                            <span
                              className={`h-5 px-2 rounded-full flex items-center text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                                isSelected ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Nieuw
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 px-5 text-center flex flex-col items-center gap-3">
                  <Search className="w-6 h-6 text-stone-300" aria-hidden="true" />
                  <p className="text-sm font-bold m-0">Geen componenten gevonden</p>
                  <p className="text-xs text-stone-500 leading-relaxed m-0">
                    Probeer een andere zoekterm of categorie.
                  </p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setActiveFilter('Alles');
                    }}
                    className="mt-2 h-9 px-4 rounded-full bg-stone-900 text-white border-0 text-xs font-bold cursor-pointer"
                  >
                    Wis filters
                  </button>
                </div>
              )}
            </nav>
          </aside>

          <section id="component-preview" className="min-w-0 scroll-mt-6" aria-label="Componentpreview">
            {selectedEntry ? (
              <div className="flex flex-col gap-4">
                <div className="px-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        {selectedEntry.category}
                      </span>
                      {selectedEntry.isNew && (
                        <span className="h-5 px-2 rounded-full bg-amber-300 text-amber-950 flex items-center text-[9px] font-extrabold uppercase tracking-wider">
                          Nieuwe toevoeging
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight m-0">
                      {selectedEntry.label}
                    </h2>
                    <p className="text-sm text-stone-600 leading-relaxed max-w-2xl m-0">
                      {selectedEntry.description}
                    </p>
                  </div>
                  <code className="self-start sm:self-auto px-3 py-2 rounded-lg bg-stone-200/70 text-[10px] text-stone-500 whitespace-nowrap">
                    src/{selectedEntry.file}
                  </code>
                </div>

                <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="h-11 px-4 sm:px-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                    </div>
                    <span className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Interactieve preview
                    </span>
                  </div>

                  <div
                    key={selectedEntry.id}
                    className={`${
                      selectedEntry.preview === 'scroll'
                        ? 'h-[760px] overflow-auto'
                        : selectedEntry.preview === 'bleed'
                          ? ''
                          : 'p-3 sm:p-6 lg:p-8'
                    }`}
                    style={
                      selectedEntry.category === 'Nieuw' ||
                      selectedEntry.category === 'Vakmansite' ||
                      selectedEntry.category === 'Vaktools'
                        ? { background: demoSite.bg, color: demoSite.fg }
                        : undefined
                    }
                    tabIndex={selectedEntry.preview === 'scroll' ? 0 : undefined}
                    aria-label={
                      selectedEntry.preview === 'scroll'
                        ? `Scrollbare preview van ${selectedEntry.label}`
                        : undefined
                    }
                  >
                    {renderPreview(selectedEntry)}
                  </div>
                </div>

                <p className="px-1 text-xs text-stone-500 m-0 flex items-center gap-2">
                  <MousePointer className="w-3.5 h-3.5" aria-hidden="true" />
                  Deze preview gebruikt de echte componentcode en demogegevens van {demoSite.biz}.
                </p>
              </div>
            ) : (
              <div className="min-h-96 rounded-3xl border-2 border-dashed border-stone-200 bg-white/50 flex flex-col items-center justify-center text-center p-8 gap-4">
                <Search className="w-8 h-8 text-stone-300" aria-hidden="true" />
                <h2 className="text-xl font-black m-0">Geen preview beschikbaar</h2>
                <p className="text-sm text-stone-500 m-0">Wis je filters om weer componenten te bekijken.</p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-4 rounded-3xl bg-stone-900 text-white p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7 overflow-hidden relative">
          <div className="absolute -right-20 -top-28 w-80 h-80 rounded-full border-[56px] border-white/5 pointer-events-none" />
          <div className="relative flex flex-col gap-3 max-w-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-300">
              Van bibliotheek naar website
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight m-0">
              Zie hoe deze bouwstenen voor jouw vak werken.
            </h2>
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed m-0">
              Kies je vak en stijl in de wizard en bekijk je eigen complete website direct in de live preview.
            </p>
          </div>
          <button
            onClick={onGoStart}
            className="relative h-13 px-7 rounded-full bg-amber-300 hover:bg-amber-200 text-stone-950 border-0 font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            Start je website
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </section>
      </main>
    </div>
  );
};
