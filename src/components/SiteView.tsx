import React from 'react';
import type { ActiveSiteData, SectorId } from '../types';
import { ORDER, SECTORS, STYLES, getUnsplashUrl } from '../data/tradesData';
import { ImageWithFallback } from './ImageWithFallback';
import { PriceCalculator } from './PriceCalculator';
import { AreaChecker } from './AreaChecker';
import { BookingCalendar } from './BookingCalendar';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { FaqSection } from './FaqSection';
import { StarRating, StarIcon, CheckIcon } from './Icons';

interface SiteViewProps {
  site: ActiveSiteData;
  selectedSector: SectorId;
  selectedStyleIndex: number;
  isCustomized?: boolean;
  onGoHome: () => void;
  onSelectSector: (sectorId: SectorId) => void;
  onSelectStyle: (styleIndex: number) => void;
  onGoStart: () => void;
}

export const SiteView: React.FC<SiteViewProps> = ({
  site,
  selectedSector,
  selectedStyleIndex,
  isCustomized,
  onGoHome,
  onSelectSector,
  onSelectStyle,
  onGoStart,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-30 bg-stone-900 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap text-xs sm:text-sm border-b border-stone-800 shadow-md">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onGoHome}
            className="h-8 px-3 rounded-full border border-stone-700 bg-stone-800 hover:bg-stone-700 text-white font-semibold cursor-pointer whitespace-nowrap transition-colors"
          >
            ← Alle presets
          </button>

          {/* Quick sector circles */}
          <div className="flex items-center gap-1.5" title="Kies een ander vak">
            {ORDER.map((secId) => {
              const sec = SECTORS[secId];
              const isCurrent = secId === selectedSector;
              const thumb = getUnsplashUrl(sec.pool[0], 100);

              return (
                <button
                  key={secId}
                  onClick={() => onSelectSector(secId)}
                  title={sec.name}
                  className={`w-7 h-7 rounded-full p-0 overflow-hidden cursor-pointer bg-transparent transition-transform hover:scale-110 ${
                    isCurrent ? 'ring-2 ring-white scale-105' : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={thumb}
                    alt={sec.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Style Chips */}
        <div className="flex items-center gap-1 bg-stone-800/80 p-1 rounded-full overflow-x-auto max-w-full">
          {STYLES.map((st, idx) => {
            const isCurrent = idx === selectedStyleIndex;
            return (
              <button
                key={st.id}
                onClick={() => onSelectStyle(idx)}
                className={`h-7 px-3 rounded-full border-0 text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  isCurrent
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'bg-transparent text-stone-300 hover:text-white'
                }`}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Builder CTA */}
        <button
          onClick={onGoStart}
          className="h-8 px-4 rounded-full border-0 bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-xs cursor-pointer whitespace-nowrap transition-transform hover:-translate-y-0.5"
        >
          {isCustomized ? 'Bewerk jouw gegevens ✎' : 'Pas deze site aan →'}
        </button>
      </div>

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
          className="sticky top-11 z-20 backdrop-blur-md border-b flex items-center justify-between gap-6 px-4 sm:px-8 md:px-12 py-4 transition-colors"
          style={{
            background: site.hdrBg,
            borderColor: site.line,
          }}
        >
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
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
              className="text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap"
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
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold">
            <a href="#diensten" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Diensten
            </a>
            <a href="#werk" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Eerder werk
            </a>
            <a href="#prijs" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Prijs berekenen
            </a>
            <a href="#gebied" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Werkgebied
            </a>
          </nav>

          {/* Action button */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${site.phone.replace(/[\s-]/g, '')}`}
              className="h-10 px-5 flex items-center font-bold text-xs sm:text-sm whitespace-nowrap transition-transform hover:-translate-y-0.5"
              style={{
                borderRadius: site.radius,
                background: site.fg,
                color: site.bg,
              }}
            >
              {site.callLabel}
            </a>
          </div>
        </header>

        {/* 1. Hero: Split Layout */}
        {site.layout === 'split' && (
          <section className="py-12 sm:py-20 md:py-24 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <span
                  className="font-mono text-xs font-semibold tracking-wider uppercase"
                  style={{ color: site.muted }}
                >
                  {site.kicker}
                </span>
                <h1
                  className="text-4xl sm:text-6xl md:text-7xl font-bold leading-[0.98] tracking-tight m-0 text-balance"
                  style={{
                    fontFamily: site.display,
                    fontWeight: site.dw,
                    letterSpacing: site.ls,
                  }}
                >
                  {site.headline}
                </h1>
                <p
                  className="text-lg sm:text-xl leading-relaxed m-0 max-w-xl"
                  style={{ color: site.muted }}
                >
                  {site.intro}
                </p>

                <div className="flex gap-3 flex-wrap pt-2">
                  <a
                    href="#prijs"
                    className="h-14 px-7 flex items-center font-bold text-base transition-transform hover:-translate-y-0.5 shadow-sm"
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
                    className="h-14 px-7 flex items-center font-bold text-base border-2 transition-colors hover:bg-black/5"
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
                  className="flex items-center gap-3 text-sm pt-2"
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
                  className="aspect-[4/5] w-full overflow-hidden shadow-lg"
                  style={{
                    borderRadius: site.radiusLg,
                    background: site.soft,
                  }}
                >
                  <ImageWithFallback
                    src={site.img.hero}
                    alt={site.name}
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
          <section className="relative min-h-[580px] sm:min-h-[700px] flex items-end overflow-hidden text-white bg-black">
            <ImageWithFallback
              src={site.img.hero}
              alt={site.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
            <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-12 py-12 sm:py-20 flex flex-col gap-6">
              <span className="self-start h-8 px-4 rounded-full bg-white/20 backdrop-blur-md flex items-center font-mono text-xs tracking-wider uppercase font-semibold">
                {site.kicker}
              </span>
              <h1
                className="text-4xl sm:text-6xl md:text-8xl font-black leading-none tracking-tight m-0 max-w-3xl text-balance"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.headline}
              </h1>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <p className="text-base sm:text-xl opacity-90 max-w-xl leading-relaxed m-0">
                  {site.intro}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a
                    href="#prijs"
                    className="h-14 px-8 flex items-center font-bold text-base transition-transform hover:-translate-y-0.5 shadow-md"
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
                    className="h-14 px-7 flex items-center font-bold text-base bg-white/15 backdrop-blur-md border border-white/30 text-white transition-colors hover:bg-white/25"
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
              className="pt-12 sm:pt-20 px-4 sm:px-8 md:px-12 overflow-hidden"
              style={{
                background: site.accent,
                color: site.onAccent,
              }}
            >
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-7 flex flex-col gap-6 pb-12 sm:pb-20">
                  <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-90">
                    {site.kicker}
                  </span>
                  <h1
                    className="text-5xl sm:text-7xl md:text-8xl font-black leading-[0.88] tracking-tight m-0"
                    style={{
                      fontFamily: site.display,
                      fontWeight: site.dw,
                      letterSpacing: site.ls,
                    }}
                  >
                    {site.headline}
                  </h1>
                  <p className="text-lg sm:text-xl font-medium leading-relaxed m-0 max-w-xl opacity-95">
                    {site.intro}
                  </p>
                  <div className="flex gap-3 flex-wrap pt-2">
                    <a
                      href="#prijs"
                      className="h-14 px-8 flex items-center font-black text-base transition-transform hover:-translate-y-0.5 shadow"
                      style={{
                        borderRadius: site.radius,
                        background: site.fg,
                        color: site.bg,
                      }}
                    >
                      {site.cta1} →
                    </a>
                    <a
                      href={`tel:${site.phone.replace(/[\s-]/g, '')}`}
                      className="h-14 px-7 flex items-center font-black text-base border-2"
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

                <div className="lg:col-span-5 h-[360px] sm:h-[480px] relative [clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)] overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src={site.img.hero}
                    alt={site.name}
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
          <section className="pt-12 sm:pt-20 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
              <div
                className="flex justify-between items-baseline gap-4 font-mono text-xs tracking-widest pb-4 border-b uppercase"
                style={{
                  borderColor: site.line,
                  color: site.muted,
                }}
              >
                <span>{site.kicker}</span>
                <span>★ {site.rating} · {site.reviewCount} REVIEWS</span>
              </div>

              <h1
                className="text-6xl sm:text-8xl md:text-9xl font-normal leading-[0.88] tracking-tight m-0 text-balance"
                style={{
                  fontFamily: site.display,
                  fontWeight: site.dw,
                  letterSpacing: site.ls,
                }}
              >
                {site.headline}
              </h1>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-2">
                <p
                  className="text-lg sm:text-2xl leading-relaxed m-0 max-w-xl font-light"
                  style={{ color: site.muted }}
                >
                  {site.intro}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a
                    href="#prijs"
                    className="h-14 px-8 flex items-center font-bold text-base transition-transform hover:-translate-y-0.5 shadow-sm"
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
                    className="h-14 px-7 flex items-center font-bold text-base border"
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
                className="aspect-[21/9] min-h-[300px] overflow-hidden shadow-lg mt-4"
                style={{ borderRadius: site.radiusLg }}
              >
                <ImageWithFallback
                  src={site.img.hero}
                  alt={site.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* 5. Hero: Mosaic Layout */}
        {site.layout === 'mosaic' && (
          <section className="py-14 sm:py-24 px-4 sm:px-8 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-10 items-center text-center">
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
                className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight m-0 max-w-3xl text-balance"
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

              <div className="flex gap-3 flex-wrap justify-center">
                <a
                  href="#prijs"
                  className="h-14 px-8 flex items-center font-bold text-base transition-transform hover:-translate-y-0.5 shadow-sm"
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
                  className="h-14 px-7 flex items-center font-bold text-base border"
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
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
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
                <div className="flex flex-col gap-3.5">
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
          className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
                  className="border p-7 flex flex-col gap-4 min-h-[260px] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
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
          </div>
        </section>

        {/* Portfolio Projects Section */}
        <section
          id="werk"
          className="pb-16 sm:pb-24 px-4 sm:px-8 md:px-12 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto flex flex-col gap-10">
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
              <div className="pb-4">
                <BeforeAfterSlider project={site.beforeAfter[0]} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {site.work.map((w, idx) => (
                <div key={idx} className="flex flex-col gap-3 group">
                  <div
                    className="aspect-[4/5] overflow-hidden relative shadow-md bg-stone-200"
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
              ))}
            </div>
          </div>
        </section>

        {/* About Craftsman Profile */}
        <section className="pb-16 sm:pb-24 px-4 sm:px-8 md:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            <div
              className="lg:col-span-5 aspect-square overflow-hidden shadow-lg"
              style={{ borderRadius: site.radiusLg }}
            >
              <ImageWithFallback
                src={site.img.d}
                alt={site.owner}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-7 flex flex-col gap-6">
              <span
                className="font-mono text-xs font-semibold tracking-wider uppercase"
                style={{ color: site.muted }}
              >
                OVER {site.ownerFirstUpper}
              </span>

              <p
                className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug m-0 text-pretty"
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

        {/* Customer Appointment Booking Calendar */}
        <BookingCalendar site={site} />

        {/* Customer Reviews */}
        <section className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {site.reviews.map((rv, idx) => (
                <div
                  key={idx}
                  className="border p-7 flex flex-col gap-4 shadow-sm"
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
          </div>
        </section>

        {/* FAQ Accordion */}
        <FaqSection faqs={site.faqs} />

        {/* Site Footer */}
        <footer
          className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 text-center sm:text-left"
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
                  href={`tel:${site.phone.replace(/[\s-]/g, '')}`}
                  className="h-14 px-8 flex items-center font-black text-base shadow transition-transform hover:-translate-y-0.5"
                  style={{
                    borderRadius: site.radius,
                    background: site.onAccent,
                    color: site.accent,
                  }}
                >
                  {site.callLabel}
                </a>
                <a
                  href={`https://wa.me/31${site.phone.replace(/\D/g, '').replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-14 px-7 flex items-center font-black text-base border-2"
                  style={{
                    borderRadius: site.radius,
                    borderColor: site.onAccent,
                    color: site.onAccent,
                  }}
                >
                  WhatsApp bericht
                </a>
              </div>

              <span className="text-xs sm:text-sm font-medium opacity-90">
                {site.biz} · {site.owner} · KvK 12345678 · {site.city}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Action Badge */}
      <a
        href="#prijs"
        className="fixed right-5 bottom-5 z-40 h-14 px-6 rounded-full flex items-center gap-2 font-extrabold text-sm sm:text-base shadow-2xl transition-transform hover:scale-105"
        style={{
          background: site.accent,
          color: site.onAccent,
        }}
      >
        <span>⚡ Offerte in 1 minuut</span>
      </a>
    </div>
  );
};
