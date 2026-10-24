import { useState, useEffect } from 'react';
import type { SectorId, WizardFormData } from './types';
import { SECTORS, buildActiveSite } from './data/tradesData';
import { Header } from './components/Header';
import { HeroStrip } from './components/HeroStrip';
import { PresetsSection } from './components/PresetsSection';
import { HowItWorks } from './components/HowItWorks';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { SiteView } from './components/SiteView';
import { WizardView } from './components/WizardView';

export default function App() {
  const [route, setRoute] = useState<'home' | 'site' | 'start'>('home');
  const [selectedSector, setSelectedSector] = useState<SectorId>('timmerman');
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number>(0);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);

  // Store user-customized details per sector in localStorage
  const [customData, setCustomData] = useState<Record<string, WizardFormData>>(() => {
    try {
      const saved = localStorage.getItem('klusbaas_custom_sites');
      return saved ? JSON.parse(saved) : {};
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

  // Check URL search params for quick direct navigation or ?autostart=1 (Ultra Mode testability)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setRoute('site');
      }
      const paramSector = params.get('sector') as SectorId;
      if (paramSector && SECTORS[paramSector]) {
        setSelectedSector(paramSector);
      }
      const paramStyle = params.get('style');
      if (paramStyle !== null) {
        const styleNum = parseInt(paramStyle, 10);
        if (!isNaN(styleNum) && styleNum >= 0 && styleNum <= 4) {
          setSelectedStyleIndex(styleNum);
        }
      }
      const paramView = params.get('view');
      if (paramView === 'site' || paramView === 'start') {
        setRoute(paramView);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const handleSelectSector = (sectorId: SectorId) => {
    setSelectedSector(sectorId);
  };

  const handleOpenSite = (sectorId: SectorId, styleIdx: number) => {
    setSelectedSector(sectorId);
    setSelectedStyleIndex(styleIdx);
    setRoute('site');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChooseStyle = (sectorId: SectorId, styleIdx: number) => {
    setSelectedSector(sectorId);
    setSelectedStyleIndex(styleIdx);
    setWizardStep(2); // Jump to data entry
    setRoute('start');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoStart = () => {
    setWizardStep(0);
    setRoute('start');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setRoute('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewPublishedSite = (
    sectorId: SectorId,
    styleIdx: number,
    form: WizardFormData
  ) => {
    const updated = {
      ...customData,
      [sectorId]: form,
    };
    setCustomData(updated);
    try {
      localStorage.setItem('klusbaas_custom_sites', JSON.stringify(updated));
    } catch {
      // Ignore
    }

    setSelectedSector(sectorId);
    setSelectedStyleIndex(styleIdx);
    setRoute('site');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSite = buildActiveSite(
    selectedSector,
    selectedStyleIndex,
    customData[selectedSector]
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* 1. HOME VIEW */}
      {route === 'home' && (
        <div className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
          <Header
            onGoHome={handleGoHome}
            onGoStart={handleGoStart}
            scrolled={scrolled}
          />

          {/* Hero Section */}
          <main className="flex-1 flex flex-col">
            <section className="pt-12 sm:pt-20 md:pt-24 pb-8 sm:pb-12 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8 flex flex-col gap-6">
                <span className="font-mono text-xs font-bold tracking-widest text-stone-500 uppercase">
                  WEBSITES VOOR VAKMENSEN · 6 VAKKEN · 30 STIJLEN
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
                  <button
                    onClick={handleGoStart}
                    className="h-14 px-8 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Start je website →
                  </button>
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
            <HeroStrip
              onSelectSector={(secId) => {
                handleSelectSector(secId);
                const el = document.getElementById('presets');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Interactive Presets Gallery */}
            <PresetsSection
              selectedSector={selectedSector}
              onSelectSector={handleSelectSector}
              onOpenSite={handleOpenSite}
              onChooseStyle={handleChooseStyle}
            />

            {/* How It Works */}
            <HowItWorks onStart={handleGoStart} />

            {/* Platform Pricing */}
            <PricingSection onStart={handleGoStart} />

            {/* Platform FAQ */}
            <FaqSection />
          </main>

          {/* Home Footer */}
          <footer className="border-t border-stone-200 py-8 px-4 sm:px-8 md:px-12 bg-white text-xs text-stone-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-semibold text-stone-700">
                © {new Date().getFullYear()} Klusbaas · Websites voor Vakmensen
              </span>
              <span>
                Gemaakt voor timmermannen, hoveniers, schilders, loodgieters,
                elektriciens en stukadoors in Nederland.
              </span>
            </div>
          </footer>
        </div>
      )}

      {/* 2. LIVE SITE VIEW */}
      {route === 'site' && (
        <SiteView
          site={activeSite}
          selectedSector={selectedSector}
          selectedStyleIndex={selectedStyleIndex}
          isCustomized={!!customData[selectedSector]}
          onGoHome={handleGoHome}
          onSelectSector={handleSelectSector}
          onSelectStyle={(idx) => setSelectedStyleIndex(idx)}
          onGoStart={handleGoStart}
        />
      )}

      {/* 3. WIZARD ONBOARDING VIEW */}
      {route === 'start' && (
        <WizardView
          initialSector={selectedSector}
          initialStyleIndex={selectedStyleIndex}
          initialStep={wizardStep}
          onGoHome={handleGoHome}
          onViewPublishedSite={handleViewPublishedSite}
        />
      )}
    </div>
  );
}
