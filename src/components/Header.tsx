import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import type { SectorId } from '../types';
import { RouteLink } from './RouteLink';

interface HeaderProps {
  scrolled?: boolean;
  /** Keeps the preset deep link on the same trade the visitor is viewing. */
  currentSector?: SectorId;
}

export const Header: React.FC<HeaderProps> = ({ scrolled, currentSector }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    // Prevent the page behind the full-width menu from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handleOutsidePointer);
    desktopQuery.addEventListener('change', handleDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handleOutsidePointer);
      desktopQuery.removeEventListener('change', handleDesktop);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const presetsRoute = { name: 'home', sector: currentSector } as const;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-30 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8 md:px-12 border-b border-stone-200/60 ${
        scrolled
          ? 'pt-[calc(0.875rem+env(safe-area-inset-top))] pb-3.5 bg-stone-100/90 shadow-sm'
          : 'pt-[calc(1.25rem+env(safe-area-inset-top))] pb-5 bg-stone-100/75'
      }`}
    >
      {/* Zone 1: Brand Wordmark */}
      <RouteLink
        route={{ name: 'home' }}
        onClick={closeMenu}
        className="flex items-center gap-2.5 text-stone-900 shrink-0 text-left no-underline"
        aria-label="Klusbaas Home"
      >
        <span className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-black text-lg shadow-sm">
          K
        </span>
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Klusbaas</span>
      </RouteLink>

      {/* Zone 2: Navigation Links */}
      <nav
        aria-label="Hoofdnavigatie"
        className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-semibold text-stone-600"
      >
        <RouteLink
          route={presetsRoute}
          hash="presets"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 no-underline"
        >
          Alle 30 presets
        </RouteLink>
        <a
          href="#hoe-het-werkt"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
        >
          Hoe het werkt
        </a>
        <a
          href="#prijzen"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
        >
          Prijzen
        </a>
        <a
          href="#vakken"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
        >
          Vakgebieden
        </a>
        <RouteLink
          route={{ name: 'components' }}
          onClick={closeMenu}
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 no-underline"
        >
          Componenten
        </RouteLink>
      </nav>

      {/* Zone 3: Primary Action + Mobile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <RouteLink
          route={{ name: 'wizard', step: 'vak' }}
          onClick={closeMenu}
          className="hidden sm:flex h-11 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold tracking-tight transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm whitespace-nowrap shrink-0 items-center gap-2 no-underline"
        >
          Start je website
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </RouteLink>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="lg:hidden w-11 h-11 rounded-full border border-stone-300 bg-white/60 hover:bg-white text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
          aria-label={menuOpen ? 'Navigatie sluiten' : 'Navigatie openen'}
          aria-expanded={menuOpen}
          aria-controls="home-mobile-navigation"
        >
          {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <>
          <nav
            id="home-mobile-navigation"
            aria-label="Mobiele navigatie"
            className="lg:hidden animate-fade-in absolute inset-x-0 top-full z-10 border-b border-stone-200 bg-stone-100/95 backdrop-blur-md shadow-lg"
          >
            <div className="px-4 sm:px-8 py-4 flex flex-col gap-1 text-base font-semibold text-stone-700">
              <RouteLink
                route={presetsRoute}
                hash="presets"
                onClick={closeMenu}
                className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors no-underline text-stone-700"
              >
                Alle 30 presets
              </RouteLink>
              <a
                href="#hoe-het-werkt"
                onClick={closeMenu}
                className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
              >
                Hoe het werkt
              </a>
              <a
                href="#prijzen"
                onClick={closeMenu}
                className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
              >
                Prijzen
              </a>
              <a
                href="#vakken"
                onClick={closeMenu}
                className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
              >
                Vakgebieden
              </a>
              <RouteLink
                route={{ name: 'components' }}
                onClick={closeMenu}
                className="h-12 flex items-center hover:text-stone-900 transition-colors no-underline text-stone-700"
              >
                Componenten
              </RouteLink>
              <RouteLink
                route={{ name: 'wizard', step: 'vak' }}
                onClick={closeMenu}
                className="sm:hidden mt-3 h-12 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm no-underline"
              >
                Start je website
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </RouteLink>
            </div>
          </nav>
        </>
      )}
    </header>
  );
};
