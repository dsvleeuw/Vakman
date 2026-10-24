import React, { useEffect, useRef, useState } from 'react';
import type { SectorId, StyleDef } from '../types';
import {
  ORDER,
  SECTORS,
  STYLES,
  getUnsplashUrl,
  computePalette,
  getPhotoSet,
} from '../data/tradesData';
import { ImageWithFallback } from './ImageWithFallback';
import { RouteLink } from './RouteLink';
import { track } from '../utils/analytics';
import { styleIdFromIndex, type Route } from '../utils/router';
import { ensureAllStyleFontsLoaded } from '../utils/fonts';
import { navigate } from '../hooks/useRouter';

interface PresetsSectionProps {
  selectedSector: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
  onOpenSite: (sectorId: SectorId, styleIndex: number) => void;
  onChooseStyle: (sectorId: SectorId, styleIndex: number) => void;
  /** Render real links (home page) instead of preview-only buttons (gallery). */
  useLinks?: boolean;
}

/** Length of the card flip played when a style is selected. */
const FLIP_DURATION_MS = 300;

/** A full turn, so the card ends in exactly the orientation it started in. */
const FLIP_KEYFRAMES = [
  { transform: 'rotateY(0deg)' },
  { transform: 'rotateY(180deg)' },
  { transform: 'rotateY(360deg)' },
];

/** Read at call time (never during render), so prerendering stays safe. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const PresetsSection: React.FC<PresetsSectionProps> = ({
  selectedSector,
  onSelectSector,
  onOpenSite,
  onChooseStyle,
  useLinks = false,
}) => {
  const [showAllStyles, setShowAllStyles] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const flipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // A navigation that waits for the flip to finish, if any.
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const currentSector = SECTORS[selectedSector];

  // The style cards render in each style's display font, but index.html only
  // ships the base fonts. Fetch the style fonts shortly before the section
  // scrolls into view so first paint stays light.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      ensureAllStyleFontsLoaded();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          ensureAllStyleFontsLoaded();
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Let the flip finish before the page changes, otherwise the card would
  // unmount mid-animation. Cleared on unmount so a stale click never fires.
  useEffect(() => {
    if (!pendingAction) return;
    const timer = window.setTimeout(() => {
      setPendingAction(null);
      pendingAction();
    }, FLIP_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [pendingAction]);

  /**
   * Plays the 300ms flip on the inner wrapper of a style card (so the card's
   * own box, and therefore the surrounding grid, never moves). Returns false
   * when there is nothing to wait for: reduced motion, no animation support
   * or an unmounted card.
   */
  const playFlip = (styleId: string): boolean => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return false;
    const element = flipRefs.current.get(styleId);
    if (!element || typeof element.animate !== 'function') return false;
    if (typeof element.getAnimations === 'function') {
      element.getAnimations().forEach((animation) => animation.cancel());
    }
    element.animate(FLIP_KEYFRAMES, {
      duration: FLIP_DURATION_MS,
      easing: 'ease-in-out',
    });
    return true;
  };

  /**
   * Selection handler for the controls of one style card: flip first, then
   * run `action`. Modified clicks (new tab, cmd/ctrl/shift-click) are left to
   * the browser so the demo can open elsewhere while the flip plays here.
   */
  const selectStyle = (
    styleId: string,
    event: React.MouseEvent<HTMLElement>,
    action: () => void
  ) => {
    const opensElsewhere =
      event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    const flipping = playFlip(styleId);
    if (opensElsewhere) return;

    // `RouteLink` navigates on a plain click; hold that until the flip is done.
    event.preventDefault();
    if (!flipping) {
      action();
      return;
    }
    setPendingAction(() => action);
  };

  const openSite = (styleIndex: number) => {
    track('preset_open', { sector: selectedSector, style: styleIndex });
    onOpenSite(selectedSector, styleIndex);
  };
  const siteRoute = (styleIndex: number) =>
    ({ name: 'site', sector: selectedSector, styleId: styleIdFromIndex(styleIndex) }) as const;
  const wizardRoute = (styleIndex: number) =>
    ({
      name: 'wizard',
      step: 'gegevens',
      sector: selectedSector,
      styleId: styleIdFromIndex(styleIndex),
    }) as const;

  const handleOpenStyle = (styleIndex: number, event: React.MouseEvent<HTMLElement>) => {
    selectStyle(
      STYLES[styleIndex].id,
      event,
      useLinks ? () => navigate(siteRoute(styleIndex)) : () => openSite(styleIndex)
    );
  };

  const handleChooseStyle = (styleIndex: number, event: React.MouseEvent<HTMLElement>) => {
    selectStyle(
      STYLES[styleIndex].id,
      event,
      useLinks
        ? () => navigate(wizardRoute(styleIndex))
        : () => onChooseStyle(selectedSector, styleIndex)
    );
  };

  return (
    <section
      ref={sectionRef}
      id="presets"
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-10 scroll-mt-24"
    >
      {/* Header and Trade Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 flex-wrap">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs font-semibold tracking-wider text-stone-500 uppercase">
            STAP 1 · KIES JE VAK
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-stone-900 leading-none">
            Vijf stijlen voor {currentSector.name.toLowerCase()}s.
          </h2>
        </div>

        {/* Sector Tabs */}
        <div
          id="vakken"
          className="flex gap-1.5 p-1.5 bg-white rounded-full border border-stone-200 shadow-sm flex-wrap overflow-x-auto max-w-full"
        >
          {ORDER.map((secId) => {
            const sec = SECTORS[secId];
            const isSelected = secId === selectedSector;
            const thumb = getUnsplashUrl(sec.pool[0], 120);

            return (
              <button
                key={secId}
                onClick={() => onSelectSector(secId)}
                className={`h-11 pl-1.5 pr-4 rounded-full border-0 cursor-pointer flex items-center gap-2 text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-transparent text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <ImageWithFallback
                    src={thumb}
                    alt={sec.name}
                    className="w-full h-full object-cover"
                  />
                </span>
                {sec.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Style Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {STYLES.map((style: StyleDef, idx: number) => {
          const pal = computePalette(currentSector, style);
          const photos = getPhotoSet(currentSector, idx);

          return (
            <div
              key={style.id}
              className={`${
                idx >= 3 && !showAllStyles ? 'hidden sm:flex' : 'flex'
              } flex-col gap-4 group`}
            >
              {/* Miniature Layout Preview Card */}
              <PreviewTrigger
                useLinks={useLinks}
                route={siteRoute(idx)}
                onClick={(event) => handleOpenStyle(idx, event)}
                className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative cursor-pointer border-0 p-0 shadow-md transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl text-left block"
                style={{
                  background: pal.bg,
                  color: pal.fg,
                  perspective: '1000px',
                }}
                ariaLabel={`Bekijk ${style.name} stijl voor ${currentSector.name}`}
              >
                {/* `kb-card-flip` marks the inner wrapper; the 300ms turn is
                    played through the Web Animations API so it can restart on
                    every selection. Transform only, so the card keeps its size
                    and the grid around it never shifts. */}
                <div
                  ref={(node) => {
                    const elements = flipRefs.current;
                    if (node) elements.set(style.id, node);
                    else elements.delete(style.id);
                  }}
                  className="kb-card-flip absolute inset-0"
                >
                  {/* 1. Split Layout Thumbnail */}
                  {style.layout === 'split' && (
                    <div className="absolute inset-0 grid grid-cols-12 gap-3 p-4 items-center">
                      <div className="col-span-7 flex flex-col gap-2.5">
                        <span
                          className="text-lg sm:text-xl font-bold leading-tight"
                          style={{
                            fontFamily: style.display,
                            fontWeight: style.dw,
                            letterSpacing: style.ls,
                          }}
                        >
                          {currentSector.headline}
                        </span>
                        <span
                          className="self-start h-6 px-2.5 text-xs font-bold flex items-center"
                          style={{
                            borderRadius: pal.radius,
                            background: pal.accent,
                            color: pal.onAccent,
                          }}
                        >
                          Offerte
                        </span>
                      </div>
                      <div
                        className="col-span-5 h-full overflow-hidden shadow-inner"
                        style={{ borderRadius: pal.radiusLg }}
                      >
                        <ImageWithFallback
                          src={photos.hero}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. Bleed Layout Thumbnail */}
                  {style.layout === 'bleed' && (
                    <div className="absolute inset-0">
                      <ImageWithFallback
                        src={photos.hero}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="absolute left-4 right-4 bottom-4 flex flex-col gap-2 text-white">
                        <span
                          className="text-xl sm:text-2xl font-bold leading-tight"
                          style={{
                            fontFamily: style.display,
                            fontWeight: style.dw,
                            letterSpacing: style.ls,
                          }}
                        >
                          {currentSector.headline}
                        </span>
                        <span
                          className="self-start h-6 px-2.5 text-xs font-bold flex items-center"
                          style={{
                            borderRadius: pal.radius,
                            background: pal.accent,
                            color: pal.onAccent,
                          }}
                        >
                          Offerte in 1 minuut
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. Bold Layout Thumbnail */}
                  {style.layout === 'bold' && (
                    <div
                      className="absolute inset-0 p-4 flex flex-col justify-between"
                      style={{
                        background: pal.accent,
                        color: pal.onAccent,
                      }}
                    >
                      <span
                        className="text-2xl sm:text-3xl font-black leading-tight max-w-[12ch]"
                        style={{
                          fontFamily: style.display,
                          fontWeight: style.dw,
                          letterSpacing: style.ls,
                        }}
                      >
                        {currentSector.headline}
                      </span>
                      <div className="h-[40%] -mx-4 -mb-4 overflow-hidden [clip-path:polygon(0_20%,100%_0,100%_100%,0_100%)]">
                        <ImageWithFallback
                          src={photos.hero}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Editorial Layout Thumbnail */}
                  {style.layout === 'editorial' && (
                    <div className="absolute inset-0 p-4 flex flex-col gap-2">
                      <span
                        className="text-2xl sm:text-3xl font-normal leading-none"
                        style={{
                          fontFamily: style.display,
                          fontWeight: style.dw,
                          letterSpacing: style.ls,
                        }}
                      >
                        {currentSector.headline}
                      </span>
                      <div className="flex-1 -mx-4 -mb-4 mt-2 overflow-hidden">
                        <ImageWithFallback
                          src={photos.hero}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* 5. Mosaic Layout Thumbnail */}
                  {style.layout === 'mosaic' && (
                    <div className="absolute inset-0 p-4 flex flex-col gap-2 text-center items-center">
                      <span
                        className="text-base sm:text-lg font-semibold leading-tight line-clamp-1"
                        style={{
                          fontFamily: style.display,
                          fontWeight: style.dw,
                          letterSpacing: style.ls,
                        }}
                      >
                        {currentSector.headline}
                      </span>
                      <div className="flex-1 w-full grid grid-cols-3 grid-rows-2 gap-1.5 mt-1">
                        <div
                          className="col-span-2 row-span-2 overflow-hidden"
                          style={{ borderRadius: pal.radiusLg }}
                        >
                          <ImageWithFallback
                            src={photos.hero}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="overflow-hidden"
                          style={{ borderRadius: pal.radiusLg }}
                        >
                          <ImageWithFallback
                            src={photos.e}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          className="overflow-hidden"
                          style={{ borderRadius: pal.radiusLg }}
                        >
                          <ImageWithFallback
                            src={photos.d}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PreviewTrigger>

              {/* Card Meta & Details */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-semibold text-stone-400">
                      0{idx + 1}
                    </span>
                    <h3 className="text-xl font-extrabold text-stone-900 tracking-tight m-0">
                      {style.name}
                    </h3>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed m-0 line-clamp-2">
                    {style.desc}
                  </p>
                </div>
                {/* Swatches */}
                <div className="flex gap-1.5 shrink-0 pt-1" title="Kleuraccent en achtergrond">
                  <span
                    className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                    style={{ background: pal.accent }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/15 shadow-sm"
                    style={{ background: pal.bg }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <PreviewTrigger
                  useLinks={useLinks}
                  route={siteRoute(idx)}
                  onClick={(event) => handleOpenStyle(idx, event)}
                  className="flex-1 h-11 rounded-full border-2 border-stone-900 bg-transparent hover:bg-white text-stone-900 text-sm font-bold transition-colors duration-200 inline-flex items-center justify-center no-underline"
                  ariaLabel={`Bekijk de demo van ${style.name} voor ${currentSector.name}`}
                >
                  Bekijk demo
                </PreviewTrigger>
                <PreviewTrigger
                  useLinks={useLinks}
                  route={wizardRoute(idx)}
                  onClick={(event) => handleChooseStyle(idx, event)}
                  className="flex-1 h-11 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center no-underline"
                  ariaLabel={`Kies de ${style.name}-stijl en vul je gegevens in`}
                >
                  Kies deze stijl
                </PreviewTrigger>
              </div>
            </div>
          );
        })}
      </div>

      {STYLES.length > 3 && !showAllStyles && (
        <button
          type="button"
          onClick={() => setShowAllStyles(true)}
          className="sm:hidden self-center min-h-12 px-6 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer inline-flex items-center gap-2 shadow-sm"
        >
          Toon alle {STYLES.length} stijlen →
        </button>
      )}
    </section>
  );
};

interface PreviewTriggerProps {
  useLinks: boolean;
  route: Route;
  /** Receives the click so the card can flip before navigation happens. */
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel: string;
  children: React.ReactNode;
}

/**
 * Uses an <a href> on the marketing page (shareable, open-in-new-tab) and a
 * plain button inside the component library, where the click updates the
 * preview instead of the page.
 */
const PreviewTrigger: React.FC<PreviewTriggerProps> = ({
  useLinks,
  route,
  onClick,
  className,
  style,
  ariaLabel,
  children,
}) => {
  if (useLinks) {
    return (
      <RouteLink
        route={route}
        className={className}
        style={style}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {children}
      </RouteLink>
    );
  }
  return (
    <button
      onClick={onClick}
      className={className}
      style={style}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
};
