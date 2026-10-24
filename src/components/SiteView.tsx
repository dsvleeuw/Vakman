import React, { useEffect, useRef, useState } from 'react';
import { Phone, MessageCircle, Zap, Menu, X } from 'lucide-react';
import type { ActiveSiteData, SectorId } from '../types';
import { ORDER, SECTORS, STYLES, getUnsplashUrl } from '../data/tradesData';
import { ImageWithFallback } from './ImageWithFallback';
import { PriceCalculator } from './PriceCalculator';
import { AreaChecker } from './AreaChecker';
import { BookingCalendar } from './BookingCalendar';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { TradeTool } from './tools/TradeTool';
import { ContactSection } from './ContactSection';
import { FaqSection } from './FaqSection';
import { StarRating, StarIcon, CheckIcon } from './Icons';
import { RouteLink } from './RouteLink';
import { styleIdFromIndex } from '../utils/router';
import { track } from '../utils/analytics';
import { buildTelUrl, buildWhatsAppUrl } from '../utils/contact';

interface SiteViewProps {
  site: ActiveSiteData;
  selectedSector: SectorId;
  selectedStyleIndex: number;
  isCustomized?: boolean;
  /** When true, renders only the website body (no preview controls, floating
   *  buttons or mobile sticky bar) so it can live inside another frame. */
  embedded?: boolean;
}

export const SiteView: React.FC<SiteViewProps> = ({
  site,
  selectedSector,
  selectedStyleIndex,
  isCustomized,
  embedded = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  // The preview bar is three wrapped rows on a phone; collapse the sector and
  // style pickers behind one "Aanpassen" toggle so the demo site stays visible.
  const [controlsOpen, setControlsOpen] = useState(false);
  const [previewBarHidden, setPreviewBarHidden] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllWork, setShowAllWork] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (embedded) return;
    lastScrollYRef.current = window.scrollY;
    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastScrollYRef.current;
      if (currentY < 48 || controlsOpen) {
        setPreviewBarHidden(false);
        lastScrollYRef.current = currentY;
        return;
      }
      if (delta > 10) {
        setPreviewBarHidden(true);
        lastScrollYRef.current = currentY;
      } else if (delta < -6) {
        setPreviewBarHidden(false);
        lastScrollYRef.current = currentY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [embedded, controlsOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktop);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktop);
    };
  }, [menuOpen]);

  const hidePreviewBar = previewBarHidden && !controlsOpen;

  return (
    <div className={`flex flex-col min-h-screen ${embedded ? '' : 'pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0'}`}>
      {/* Top Preview Control Bar */}
      {!embedded && (
      <div
        className={`sticky top-0 z-30 bg-stone-900 text-white px-3 sm:px-6 pt-[calc(0.375rem+env(safe-area-inset-top))] pb-1.5 flex lg:pt-[calc(0.5rem+env(safe-area-inset-top))] lg:pb-2 flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-3 text-xs sm:text-sm border-b border-stone-800 shadow-md transition-transform duration-200 ${
          hidePreviewBar
            ? '-translate-y-full lg:translate-y-0 pointer-events-none lg:pointer-events-auto'
            : 'translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between gap-2 lg:justify-start lg:gap-3">
          <RouteLink
            route={{ name: 'home', sector: selectedSector }}
            hash="presets"
            className="min-h-11 px-3.5 rounded-full border border-stone-700 bg-stone-800 hover:bg-stone-700 text-white font-semibold whitespace-nowrap transition-colors inline-flex items-center no-underline"
          >
            ← Alle presets
          </RouteLink>

          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <span className="text-[11px] font-semibold text-stone-300 truncate">
              {SECTORS[selectedSector].name} · {STYLES[selectedStyleIndex].name}
            </span>
            <button
              type="button"
              onClick={() => setControlsOpen((open) => !open)}
              aria-expanded={controlsOpen}
              aria-controls="site-preview-controls"
              className="min-h-11 px-3.5 rounded-full border border-stone-700 bg-stone-800 hover:bg-stone-700 text-white font-bold whitespace-nowrap cursor-pointer inline-flex items-center shrink-0"
            >
              {controlsOpen ? 'Sluiten' : 'Aanpassen'}
            </button>
          </div>

          {/* Quick sector circles (desktop) */}
          <div className="hidden lg:flex items-center gap-0.5" title="Kies een ander vak">
            {ORDER.map((secId) => {
              const sec = SECTORS[secId];
              const isCurrent = secId === selectedSector;
              const thumb = getUnsplashUrl(sec.pool[0], 100);

              return (
                <RouteLink
                  key={secId}
                  route={{ name: 'site', sector: secId, styleId: styleIdFromIndex(selectedStyleIndex) }}
                  title={sec.name}
                  aria-label={`Bekijk het ${sec.name}-voorbeeld`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className="w-10 h-10 rounded-full p-0 bg-transparent transition-transform hover:scale-110 inline-flex items-center justify-center"
                >
                  <span
                    className={`w-7 h-7 rounded-full overflow-hidden block ${
                      isCurrent ? 'ring-2 ring-white scale-105' : 'opacity-65 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </span>
                </RouteLink>
              );
            })}
          </div>
        </div>

        {/* Quick Style Chips (desktop) */}
        <div className="hidden lg:flex items-center gap-1 bg-stone-800/80 p-1 rounded-full overflow-x-auto max-w-full">
          {STYLES.map((st, idx) => {
            const isCurrent = idx === selectedStyleIndex;
            return (
              <RouteLink
                key={st.id}
                route={{ name: 'site', sector: selectedSector, styleId: st.id }}
                aria-current={isCurrent ? 'true' : undefined}
                className={`min-h-10 px-3 rounded-full text-xs font-bold transition-colors whitespace-nowrap inline-flex items-center no-underline ${
                  isCurrent
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'bg-transparent text-stone-300 hover:text-white'
                }`}
              >
                {st.name}
              </RouteLink>
            );
          })}
        </div>

        {/* Builder CTA (desktop) */}
        <RouteLink
          route={{
            name: 'wizard',
            step: 'gegevens',
            sector: selectedSector,
            styleId: styleIdFromIndex(selectedStyleIndex),
          }}
          className="hidden lg:inline-flex min-h-11 px-4 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-xs whitespace-nowrap transition-transform hover:-translate-y-0.5 items-center no-underline"
        >
          {isCustomized ? 'Bewerk jouw gegevens ✎' : 'Pas deze site aan →'}
        </RouteLink>

        {/* Expanded controls on phones & tablets */}
        {controlsOpen && (
          <div
            id="site-preview-controls"
            className="lg:hidden flex flex-col gap-2 pb-1 animate-fade-in"
          >
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" aria-label="Kies een ander vak">
              {ORDER.map((secId) => {
                const sec = SECTORS[secId];
                const isCurrent = secId === selectedSector;
                return (
                  <RouteLink
                    key={secId}
                    route={{ name: 'site', sector: secId, styleId: styleIdFromIndex(selectedStyleIndex) }}
                    aria-label={`Bekijk het ${sec.name}-voorbeeld`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`min-h-11 px-3 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center no-underline ${
                      isCurrent ? 'bg-white text-stone-900' : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {sec.name}
                  </RouteLink>
                );
              })}
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5" aria-label="Kies een andere stijl">
              {STYLES.map((st, idx) => {
                const isCurrent = idx === selectedStyleIndex;
                return (
                  <RouteLink
                    key={st.id}
                    route={{ name: 'site', sector: selectedSector, styleId: st.id }}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`min-h-11 px-3.5 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center no-underline ${
                      isCurrent ? 'bg-white text-stone-900' : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {st.name}
                  </RouteLink>
                );
              })}
            </div>
            <RouteLink
              route={{
                name: 'wizard',
                step: 'gegevens',
                sector: selectedSector,
                styleId: styleIdFromIndex(selectedStyleIndex),
              }}
              className="min-h-11 px-4 rounded-full bg-amber-400 text-stone-900 font-extrabold text-xs inline-flex items-center justify-center no-underline"
            >
              {isCustomized ? 'Bewerk jouw gegevens ✎' : 'Pas deze site aan →'}
            </RouteLink>
          </div>
        )}
      </div>
      )}

      {/* The Craftsman's Website */}
      <div
        className="flex-1 flex flex-col transition-colors duration-300"
        style={{
          background: site.bg,
          color: site.fg,
        }}
      >
        {/* Site Header */}
        <header
          className={`${
            embedded
              ? 'sticky top-0'
              : hidePreviewBar
                ? 'sticky top-[env(safe-area-inset-top)] lg:top-[calc(3.75rem+env(safe-area-inset-top))]'
                : 'sticky top-[calc(3.5rem+env(safe-area-inset-top))] lg:top-[calc(3.75rem+env(safe-area-inset-top))]'
          } z-20 backdrop-blur-md border-b flex items-center justify-between gap-6 px-4 sm:px-8 md:px-12 py-4 transition-[top,background-color,border-color] duration-200`}
          style={{
            background: site.hdrBg,
            borderColor: site.line,
          }}
        >
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-9 h-9 flex items-center justify-center font-bold text-lg shadow-sm shrink-0"
              style={{
                borderRadius: site.radiusSm,
                background: site.accent,
                color: site.onAccent,
                fontFamily: site.display,
                fontWeight: site.dw,
              }}
            >
              {site.bizLetter}
            </span>
            <span
              className="text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap truncate"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                letterSpacing: site.ls,
              }}
            >
              {site.biz}
            </span>
          </div>

          {/* Nav links */}
          <nav aria-label="Hoofdnavigatie" className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-semibold">
            <a href="#diensten" className="min-h-11 inline-flex items-center hover:opacity-75 transition-opacity whitespace-nowrap">
              Diensten
            </a>
            <a href="#werk" className="min-h-11 inline-flex items-center hover:opacity-75 transition-opacity whitespace-nowrap">
              Eerder werk
            </a>
            <a href="#prijs" className="min-h-11 inline-flex items-center hover:opacity-75 transition-opacity whitespace-nowrap">
              Prijs berekenen
            </a>
            <a href="#gebied" className="min-h-11 inline-flex items-center hover:opacity-75 transition-opacity whitespace-nowrap">
              Werkgebied
            </a>
            <a href="#contact" className="min-h-11 inline-flex items-center hover:opacity-75 transition-opacity whitespace-nowrap">
              Contact
            </a>
          </nav>

          {/* Action button + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={buildTelUrl(site.phone)}
              className="hidden sm:flex min-h-11 px-5 items-center font-bold text-xs sm:text-sm whitespace-nowrap transition-transform hover:-translate-y-0.5"
              style={{
                borderRadius: site.radius,
                background: site.fg,
                color: site.bg,
              }}
            >
              {site.callLabel}
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden w-11 h-11 border flex items-center justify-center shrink-0 cursor-pointer transition-opacity hover:opacity-75"
              style={{
                borderRadius: site.radiusSm,
                background: site.card,
                borderColor: site.line,
                color: site.fg,
              }}
              aria-label={menuOpen ? 'Navigatie sluiten' : 'Navigatie openen'}
              aria-expanded={menuOpen}
              aria-controls="site-mobile-navigation"
            >
              {menuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {menuOpen && (
            <nav
              id="site-mobile-navigation"
              aria-label="Mobiele navigatie"
              className="md:hidden animate-fade-in absolute inset-x-0 top-full z-10 border-b shadow-lg"
              style={{
                background: site.card,
                borderColor: site.line,
                color: site.fg,
              }}
            >
              <div className="px-4 sm:px-8 py-4 flex flex-col gap-1 text-base font-semibold">
                <a
                  href="#diensten"
                  onClick={() => setMenuOpen(false)}
                  className="h-12 flex items-center border-b hover:opacity-75 transition-opacity"
                  style={{ borderColor: site.line }}
                >
                  Diensten
                </a>
                <a
                  href="#werk"
                  onClick={() => setMenuOpen(false)}
                  className="h-12 flex items-center border-b hover:opacity-75 transition-opacity"
                  style={{ borderColor: site.line }}
                >
                  Eerder werk
                </a>
                <a
                  href="#prijs"
                  onClick={() => setMenuOpen(false)}
                  className="h-12 flex items-center border-b hover:opacity-75 transition-opacity"
                  style={{ borderColor: site.line }}
                >
                  Prijs berekenen
                </a>
                <a
                  href="#gebied"
                  onClick={() => setMenuOpen(false)}
                  className="h-12 flex items-center border-b hover:opacity-75 transition-opacity"
                  style={{ borderColor: site.line }}
                >
                  Werkgebied
                </a>
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="h-12 flex items-center hover:opacity-75 transition-opacity"
                >
                  Contact
                </a>
              </div>
            </nav>
          )}
        </header>

        {/* 1. Hero: Split Layout */}
        {site.layout === 'split' && (
          <section className="py-7 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
                <span
                  className="font-mono text-xs font-semibold tracking-wider uppercase"
                  style={{ color: site.muted }}
                >
                  {site.kicker}
                </span>
                <h1
                  className="text-[1.95rem] sm:text-6xl md:text-7xl font-bold leading-[1.04] sm:leading-[0.98] tracking-tight m-0 text-balance"
                  style={{
                    fontFamily: site.display,
                    fontWeight: site.dw,
                    letterSpacing: site.ls,
                  }}
                >
                  {site.headline}
                </h1>
                <p
                  className="text-base sm:text-xl leading-relaxed m-0 max-w-xl"
                  style={{ color: site.muted }}
                >
                  {site.intro}
                </p>

                <div className="flex gap-2.5 sm:gap-3 flex-wrap pt-1 sm:pt-2">
                  <a
                    href="#prijs"
                    className="h-12 sm:h-14 px-5 sm:px-7 flex items-center font-bold text-sm sm:text-base transition-transform hover:-translate-y-0.5 shadow-sm"
                    style={{
                      borderRadius: site.radius,
                      background: site.accent,
                      color: site.onAccent,
                    }}
                  >
                    {site.cta1} →
                  </a>
                  <a
                    href="#werk"
                    className="h-12 sm:h-14 px-5 sm:px-7 flex items-center font-bold text-sm sm:text-base border-2 transition-colors hover:bg-black/5"
                    style={{
                      borderRadius: site.radius,
                      borderColor: site.fg,
                      color: site.fg,
                    }}
                  >
                    {site.cta2}
                  </a>
                </div>

                {/* Rating */}
                <div
                  className="flex items-center gap-3 text-sm pt-1 sm:pt-2"
                  style={{ color: site.muted }}
                >
                  <StarRating count={5} />
                  <span>
                    <strong style={{ color: site.fg }}>{site.rating}</strong> uit{' '}
                    {site.reviewCount} beoordelingen
                  </span>
                </div>
              </div>

              {/* Split Image with Floating Badge */}
              <div className="lg:col-span-5 relative">
                <div
                  className="aspect-[16/10] sm:aspect-[4/5] w-full overflow-hidden shadow-lg"
                  style={{
                    borderRadius: site.radiusLg,
                    background: site.soft,
                  }}
                >
                  <ImageWithFallback
                    src={site.img.hero}
                    alt="" aria-hidden="true"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute -left-3 bottom-6 sm:-left-6 p-4 border flex flex-col gap-1 shadow-xl"
                  style={{
                    borderRadius: site.radiusLg,
                    background: site.card,
                    borderColor: site.line,
                    color: site.fg,
                  }}
                >
                  <span
                    className="text-3xl font-black leading-none"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                    }}
                  >
                    {site.since}
                  </span>
                  <span className="text-xs font-semibold opacity-75">
                    vakman sinds
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. Hero: Bleed Layout */}
        {site.layout === 'bleed' && (
          <section className="relative min-h-[430px] sm:min-h-[700px] flex items-end overflow-hidden text-white bg-black">
            <ImageWithFallback
              src={site.img.hero}
              alt="" aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
            <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-12 py-7 sm:py-20 flex flex-col gap-4 sm:gap-6">
              <span className="self-start h-8 px-4 rounded-full bg-white/20 backdrop-blur-md flex items-center font-mono text-xs tracking-wider uppercase font-semibold">
                {site.kicker}
              </span>
              <h1
                className="text-[1.95rem] sm:text-6xl md:text-8xl font-black leading-[1.04] sm:leading-none tracking-tight m-0 max-w-3xl text-balance"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.headline}
              </h1>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6">
                <p className="text-base sm:text-xl opacity-90 max-w-xl leading-relaxed m-0">
                  {site.intro}
                </p>
                <div className="flex gap-2.5 sm:gap-3 flex-wrap">
                  <a
                    href="#prijs"
                    className="h-12 sm:h-14 px-5 sm:px-8 flex items-center font-bold text-sm sm:text-base transition-transform hover:-translate-y-0.5 shadow-md"
                    style={{
                      borderRadius: site.radius,
                      background: site.accent,
                      color: site.onAccent,
                    }}
                  >
                    {site.cta1} →
                  </a>
                  <a
                    href="#werk"
                    className="h-12 sm:h-14 px-5 sm:px-7 flex items-center font-bold text-sm sm:text-base bg-white/15 backdrop-blur-md border border-white/30 text-white transition-colors hover:bg-white/25"
                    style={{ borderRadius: site.radius }}
                  >
                    {site.cta2}
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. Hero: Bold Layout */}
        {site.layout === 'bold' && (
          <>
            <section
              className="pt-7 sm:pt-20 px-4 sm:px-8 md:px-12 overflow-hidden"
              style={{
                background: site.accent,
                color: site.onAccent,
              }}
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-end">
                <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6 pb-4 sm:pb-20">
                  <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-90">
                    {site.kicker}
                  </span>
                  <h1
                    className="text-[2rem] sm:text-7xl md:text-8xl font-black leading-[0.95] sm:leading-[0.88] tracking-tight m-0 text-balance"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                      letterSpacing: site.ls,
                    }}
                  >
                    {site.headline}
                  </h1>
                  <p className="text-base sm:text-xl font-medium leading-relaxed m-0 max-w-xl opacity-95">
                    {site.intro}
                  </p>
                  <div className="flex gap-3 flex-wrap pt-1 sm:pt-2">
                    <a
                      href="#prijs"
                      className="w-full sm:w-auto justify-center h-13 sm:h-14 px-6 sm:px-8 flex items-center font-black text-base transition-transform hover:-translate-y-0.5 shadow"
                      style={{
                        borderRadius: site.radius,
                        background: site.fg,
                        color: site.bg,
                      }}
                    >
                      {site.cta1} →
                    </a>
                    <a
                      href={buildTelUrl(site.phone)}
                      className="hidden sm:flex h-14 px-7 items-center font-black text-base border-2"
                      style={{
                        borderRadius: site.radius,
                        borderColor: site.onAccent,
                        color: site.onAccent,
                      }}
                    >
                      {site.callLabel}
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 h-[220px] sm:h-[480px] relative [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)] overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src={site.img.hero}
                    alt="" aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>

            {/* Marquee quality ticker */}
            <div
              className="py-4 overflow-hidden border-b border-black/10"
              style={{
                background: site.fg,
                color: site.bg,
              }}
            >
              <div className="animate-marquee flex gap-10 whitespace-nowrap text-xl sm:text-3xl font-black uppercase tracking-tight">
                {[...site.services, ...site.services, ...site.services].map((sv, idx) => (
                  <span key={idx} className="flex items-center gap-10">
                    {sv.n}
                    <span
                      className="w-3.5 h-3.5 rotate-45 shrink-0"
                      style={{ background: site.accent }}
                    />
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 4. Hero: Editorial Layout */}
        {site.layout === 'editorial' && (
          <section className="pt-7 sm:pt-20 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:gap-8">
              <div
                className="flex justify-between items-baseline gap-4 font-mono text-xs tracking-widest pb-3 sm:pb-4 border-b uppercase"
                style={{
                  borderColor: site.line,
                  color: site.muted,
                }}
              >
                <span>{site.kicker}</span>
                <span>★ {site.rating} · {site.reviewCount} REVIEWS</span>
              </div>

              <h1
                className="text-[2.25rem] sm:text-8xl md:text-9xl font-normal leading-[0.95] sm:leading-[0.88] tracking-tight m-0 text-balance"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.headline}
              </h1>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 pt-1 sm:pt-2">
                <p
                  className="text-base sm:text-2xl leading-relaxed m-0 max-w-xl font-light"
                  style={{ color: site.muted }}
                >
                  {site.intro}
                </p>
                <div className="flex gap-2.5 sm:gap-3 flex-wrap">
                  <a
                    href="#prijs"
                    className="h-12 sm:h-14 px-5 sm:px-8 flex items-center font-bold text-sm sm:text-base transition-transform hover:-translate-y-0.5 shadow-sm"
                    style={{
                      borderRadius: site.radius,
                      background: site.accent,
                      color: site.onAccent,
                    }}
                  >
                    {site.cta1} →
                  </a>
                  <a
                    href="#werk"
                    className="h-12 sm:h-14 px-5 sm:px-7 flex items-center font-bold text-sm sm:text-base border"
                    style={{
                      borderRadius: site.radius,
                      borderColor: site.fg,
                      color: site.fg,
                    }}
                  >
                    {site.cta2}
                  </a>
                </div>
              </div>

              {/* Panoramic Backdrop */}
              <div
                className="aspect-[21/9] min-h-[200px] sm:min-h-[300px] overflow-hidden shadow-lg mt-2 sm:mt-4"
                style={{ borderRadius: site.radiusLg }}
              >
                <ImageWithFallback
                  src={site.img.hero}
                  alt="" aria-hidden="true"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* 5. Hero: Mosaic Layout */}
        {site.layout === 'mosaic' && (
          <section className="py-8 sm:py-24 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-5 sm:gap-10 items-center text-center">
              <span
                className="font-mono text-xs font-semibold tracking-wider uppercase flex items-center gap-2"
                style={{ color: site.muted }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: site.accentText }}
                />
                {site.kicker}
              </span>

              <h1
                className="text-[1.95rem] sm:text-6xl md:text-7xl font-bold leading-[1.06] sm:leading-tight tracking-tight m-0 max-w-3xl text-balance"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.headline}
              </h1>

              <p
                className="text-base sm:text-xl leading-relaxed m-0 max-w-2xl"
                style={{ color: site.muted }}
              >
                {site.intro}
              </p>

              <div className="flex gap-2.5 sm:gap-3 flex-wrap justify-center">
                <a
                  href="#prijs"
                  className="h-12 sm:h-14 px-5 sm:px-8 flex items-center font-bold text-sm sm:text-base transition-transform hover:-translate-y-0.5 shadow-sm"
                  style={{
                    borderRadius: site.radius,
                    background: site.accent,
                    color: site.onAccent,
                  }}
                >
                  {site.cta1} →
                </a>
                <a
                  href="#werk"
                  className="h-12 sm:h-14 px-5 sm:px-7 flex items-center font-bold text-sm sm:text-base border"
                  style={{
                    borderRadius: site.radius,
                    borderColor: site.line,
                    background: site.card,
                    color: site.fg,
                  }}
                >
                  {site.cta2}
                </a>
              </div>

              {/* Mosaic Grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 sm:pt-4">
                <div
                  className="sm:col-span-2 aspect-[16/10] overflow-hidden shadow-sm"
                  style={{ borderRadius: site.radiusLg }}
                >
                  <ImageWithFallback
                    src={site.img.hero}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3.5">
                  <div
                    className="flex-1 aspect-[4/3] sm:aspect-auto overflow-hidden shadow-sm"
                    style={{ borderRadius: site.radiusLg }}
                  >
                    <ImageWithFallback
                      src={site.img.e}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="flex-1 aspect-[4/3] sm:aspect-auto overflow-hidden shadow-sm"
                    style={{ borderRadius: site.radiusLg }}
                  >
                    <ImageWithFallback
                      src={site.img.d}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quality Marks / Certifications Ribbon */}
        <div
          className="border-y py-5 px-4 sm:px-8 md:px-12"
          style={{ borderColor: site.line }}
        >
          <div className="max-w-7xl mx-auto flex gap-6 sm:gap-10 flex-wrap items-center justify-between text-xs sm:text-sm font-semibold">
            {site.marks.map((mark, idx) => (
              <span key={idx} className="flex items-center gap-2.5">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px]"
                  style={{
                    background: site.soft,
                    color: site.accentText,
                  }}
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
                {mark}
              </span>
            ))}
          </div>
        </div>

        {/* Services & Pricing Section */}
        <section
          id="diensten"
          className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-7 sm:gap-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
              <h2
                className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0 max-w-md"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.servicesTitle}
              </h2>
              <span className="text-sm font-medium" style={{ color: site.muted }}>
                Vaste pakketprijzen, inclusief btw en garantie.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {site.services.map((sv, idx) => (
                <div
                  key={idx}
                  className={`${
                    idx >= 2 && !showAllServices ? 'hidden sm:flex' : 'flex'
                  } border p-5 sm:p-7 flex-col gap-3 sm:gap-4 sm:min-h-[260px] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl`}
                  style={{
                    background: site.card,
                    borderColor: site.line,
                    borderRadius: site.radiusLg,
                  }}
                >
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: site.muted }}
                  >
                    {sv.nr || `0${idx + 1}`}
                  </span>
                  <h3
                    className="text-xl sm:text-2xl font-bold leading-tight m-0"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                      letterSpacing: site.ls,
                    }}
                  >
                    {sv.n}
                  </h3>
                  <p
                    className="text-sm leading-relaxed m-0 flex-1"
                    style={{ color: site.muted }}
                  >
                    {sv.d}
                  </p>
                  <div
                    className="flex justify-between items-center pt-3 border-t text-sm font-bold"
                    style={{ borderColor: site.line }}
                  >
                    <span style={{ color: site.accentText }}>{sv.p}</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>

            {site.services.length > 2 && !showAllServices && (
              <button
                type="button"
                onClick={() => setShowAllServices(true)}
                className="sm:hidden self-start min-h-11 px-5 border font-bold text-sm cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: site.card,
                  borderColor: site.line,
                  color: site.fg,
                  borderRadius: site.radius,
                }}
              >
                Toon alle {site.services.length} diensten →
              </button>
            )}
          </div>
        </section>

        {/* Portfolio Projects Section */}
        <section
          id="werk"
          className="pb-10 sm:pb-24 px-4 sm:px-8 md:px-12 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-7 sm:gap-10">
            <div className="flex justify-between items-baseline gap-4 flex-wrap">
              <h2
                className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                Eerder opgeleverd werk
              </h2>
              <span className="text-sm font-medium" style={{ color: site.muted }}>
                {site.workNote}
              </span>
            </div>

            {/* Before & After Comparison (if present) */}
            {site.beforeAfter && site.beforeAfter.length > 0 && (
              <div className="pb-2 sm:pb-4">
                <BeforeAfterSlider project={site.beforeAfter[0]} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {site.work.map((w, idx) => {
                const mobileVisibleLimit = site.beforeAfter && site.beforeAfter.length > 0 ? 0 : 1;
                const hiddenOnMobile = idx >= mobileVisibleLimit && !showAllWork;
                return (
                  <div
                    key={idx}
                    className={`${hiddenOnMobile ? 'hidden sm:flex' : 'flex'} flex-col gap-3 group`}
                  >
                    <div
                      className="aspect-[16/10] sm:aspect-[4/5] overflow-hidden relative shadow-md bg-stone-200"
                      style={{ borderRadius: site.radiusLg }}
                    >
                      <ImageWithFallback
                        src={w.img || site.img.a}
                        alt={w.t}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 h-7 px-3 rounded-full bg-white/95 text-stone-900 flex items-center font-bold text-xs shadow-sm">
                        {w.c}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3
                        className="text-lg sm:text-xl font-bold tracking-tight m-0"
                        style={{
                          fontFamily: site.display,
                          fontWeight: site.dw,
                        }}
                      >
                        {w.t}
                      </h3>
                      <span
                        className="font-mono text-xs"
                        style={{ color: site.muted }}
                      >
                        {w.y}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {site.work.length > (site.beforeAfter?.length ? 0 : 1) && !showAllWork && (
              <button
                type="button"
                onClick={() => setShowAllWork(true)}
                className="sm:hidden self-start min-h-11 px-5 border font-bold text-sm cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: site.card,
                  borderColor: site.line,
                  color: site.fg,
                  borderRadius: site.radius,
                }}
              >
                Bekijk alle {site.work.length} projecten →
              </button>
            )}
          </div>
        </section>

        {/* About Craftsman Profile */}
        <section className="pb-10 sm:pb-24 px-4 sm:px-8 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 items-center">
            <div
              className="lg:col-span-5 aspect-[16/10] sm:aspect-square overflow-hidden shadow-lg"
              style={{ borderRadius: site.radiusLg }}
            >
              <ImageWithFallback
                src={site.img.d}
                alt={site.owner}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
              <span
                className="font-mono text-xs font-semibold tracking-wider uppercase"
                style={{ color: site.muted }}
              >
                OVER {site.ownerFirstUpper}
              </span>

              <p
                className="text-xl sm:text-3xl md:text-4xl font-semibold leading-snug m-0 text-pretty"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                "{site.about}"
              </p>

              <div
                className="grid grid-cols-2 gap-6 pt-4 border-t"
                style={{ borderColor: site.line }}
              >
                <div>
                  <span
                    className="text-3xl sm:text-5xl font-black leading-none block"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                    }}
                  >
                    {site.since}
                  </span>
                  <span className="text-xs sm:text-sm font-medium mt-1 block" style={{ color: site.muted }}>
                    actief als vakman
                  </span>
                </div>
                <div>
                  <span
                    className="text-3xl sm:text-5xl font-black leading-none flex items-center gap-2"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                      color: site.accentText,
                    }}
                  >
                    {site.rating} <StarIcon className="w-8 h-8 fill-current" />
                  </span>
                  <span className="text-xs sm:text-sm font-medium mt-1 block" style={{ color: site.muted }}>
                    uit {site.reviewCount} geverifieerde reviews
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded Interactive Price Calculator */}
        <PriceCalculator site={site} />

        {/* Service Area Checker */}
        <AreaChecker site={site} />

        {/* Smart, trade-specific conversion tool */}
        <TradeTool site={site} />

        {/* Customer Appointment Booking Calendar */}
        <BookingCalendar site={site} />

        {/* Customer Reviews */}
        <section className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60">
          <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2
                className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                Wat klanten over mij zeggen
              </h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${site.biz} ${site.city}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 h-12 px-5 border font-bold text-sm transition-transform hover:-translate-y-0.5"
                style={{
                  borderColor: site.line,
                  background: site.card,
                  color: site.fg,
                  borderRadius: site.radius,
                }}
                title="Bekijk alle reviews op het Google Bedrijfsprofiel"
              >
                <span className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[#4285F4] font-black text-base shadow-sm">
                  G
                </span>
                {site.rating} op Google · {site.reviewCount} reviews
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {site.reviews.map((rv, idx) => (
                <div
                  key={idx}
                  className={`${
                    idx >= 1 && !showAllReviews ? 'hidden sm:flex' : 'flex'
                  } border p-6 sm:p-7 flex-col gap-4 shadow-sm`}
                  style={{
                    borderRadius: site.radiusLg,
                    background: site.card,
                    borderColor: site.line,
                  }}
                >
                  <StarRating count={5} />
                  <p
                    className="text-base sm:text-lg leading-relaxed m-0 italic flex-1"
                    style={{
                      fontFamily: site.display,
                      letterSpacing: site.ls,
                    }}
                  >
                    "{rv.q}"
                  </p>
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: site.muted }}
                  >
                    {rv.who}
                  </span>
                </div>
              ))}
            </div>

            {site.reviews.length > 1 && !showAllReviews && (
              <button
                type="button"
                onClick={() => setShowAllReviews(true)}
                className="sm:hidden self-start min-h-11 px-5 border font-bold text-sm cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: site.card,
                  borderColor: site.line,
                  color: site.fg,
                  borderRadius: site.radius,
                }}
              >
                Lees alle {site.reviews.length} beoordelingen →
              </button>
            )}
          </div>
        </section>

        {/* FAQ Accordion */}
        <FaqSection faqs={site.faqs} />

        {/* WhatsApp-first contact section with form fallback */}
        <ContactSection site={site} />

        {/* Site Footer */}
        <footer
          className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 text-center sm:text-left"
          style={{
            background: site.accent,
            color: site.onAccent,
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <h2
              className="text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tight m-0 max-w-xl"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                letterSpacing: site.ls,
              }}
            >
              Zullen we jouw klus bespreken?
            </h2>

            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 flex-wrap pt-2">
              <div className="flex gap-3 flex-wrap">
                <a
                  href={buildWhatsAppUrl(
                    site.phone,
                    `Hallo ${site.biz}! Ik wil graag een klus bespreken.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="h-14 px-8 flex items-center gap-2.5 font-black text-base shadow transition-transform hover:-translate-y-0.5 bg-[#25D366] text-white"
                  style={{ borderRadius: site.radius }}
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp ons
                </a>
                <a
                  href={buildTelUrl(site.phone)}
                  className="h-14 px-7 flex items-center gap-2.5 font-black text-base border-2"
                  style={{
                    borderRadius: site.radius,
                    borderColor: site.onAccent,
                    color: site.onAccent,
                  }}
                >
                  <Phone className="w-5 h-5" />
                  {site.callLabel}
                </a>
              </div>

              <span className="text-xs sm:text-sm font-medium opacity-90">
                {site.biz} · {site.owner} · KvK 12345678 · {site.city}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Desktop floating action stack (mobile uses the sticky bar below) */}
      {!embedded && (
      <>
      <div className="hidden sm:flex fixed right-5 bottom-5 z-40 flex-col items-end gap-2.5">
        <a
          href={buildWhatsAppUrl(
            site.phone,
            `Hallo ${site.biz}! Ik heb een vraag.`
          )}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('whatsapp_click', { source: 'floating', sector: selectedSector })}
          className="h-12 px-5 rounded-full flex items-center gap-2 font-extrabold text-sm shadow-2xl bg-[#25D366] text-white transition-transform hover:scale-105"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
        <a
          href="#prijs"
          className="h-14 px-6 rounded-full flex items-center gap-2 font-extrabold text-sm sm:text-base shadow-2xl transition-transform hover:scale-105"
          style={{
            background: site.accent,
            color: site.onAccent,
          }}
        >
          <Zap className="w-4 h-4" />
          Offerte in 1 minuut
        </a>
      </div>

      {/* Mobile sticky contact bar: call and WhatsApp always in reach */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex gap-2 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
        style={{ background: site.card, borderColor: site.line }}
      >
        <a
          href={buildTelUrl(site.phone)}
          onClick={() => track('phone_click', { source: 'sticky-bar', sector: selectedSector })}
          className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-extrabold text-sm"
          style={{ background: site.fg, color: site.bg }}
        >
          <Phone className="w-4 h-4" />
          Bellen
        </a>
        <a
          href={buildWhatsAppUrl(
            site.phone,
            `Hallo ${site.biz}! Ik heb een vraag.`
          )}
          target="_blank"
          rel="noreferrer"
          onClick={() => track('whatsapp_click', { source: 'sticky-bar', sector: selectedSector })}
          className="flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-extrabold text-sm bg-[#25D366] text-white"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>
      </>
      )}

    </div>
  );
};
