import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Menu, X } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  onGoStart: () => void;
  onGoComponents: () => void;
  scrolled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onGoStart,
  onGoComponents,
  scrolled,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktop);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktop);
    };
  }, [menuOpen]);

  const handleGoHome = () => {
    setMenuOpen(false);
    onGoHome();
  };

  const handleGoStart = () => {
    setMenuOpen(false);
    onGoStart();
  };

  const handleGoComponents = () => {
    setMenuOpen(false);
    onGoComponents();
  };

  return (
    <header
      className={`sticky top-0 z-20 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8 md:px-12 border-b border-stone-200/60 ${
        scrolled
          ? 'py-3.5 bg-stone-100/90 shadow-sm'
          : 'py-5 bg-stone-100/75'
      }`}
    >
      {/* Zone 1: Brand Wordmark */}
      <button
        onClick={handleGoHome}
        className="flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer text-stone-900 shrink-0 text-left"
        aria-label="Klusbaas Home"
      >
        <span className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-black text-lg shadow-sm">
          K
        </span>
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
          Klusbaas
        </span>
      </button>

      {/* Zone 2: Navigation Links */}
      <nav aria-label="Hoofdnavigatie" className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-semibold text-stone-600">
        <a
          href="#presets"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
        >
          Alle 30 Presets
        </a>
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
        <button
          onClick={handleGoComponents}
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 bg-transparent border-0 p-0 cursor-pointer font-semibold"
        >
          Componenten
        </button>
      </nav>

      {/* Zone 3: Primary Action + Mobile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={handleGoStart}
          className="hidden sm:flex h-11 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold tracking-tight cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm whitespace-nowrap shrink-0 items-center gap-2"
        >
          <CalendarDays className="w-4 h-4" aria-hidden="true" />
          Plan een afspraak
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="lg:hidden w-11 h-11 rounded-full border border-stone-300 bg-white/60 hover:bg-white text-stone-900 flex items-center justify-center cursor-pointer transition-colors"
          aria-label={menuOpen ? 'Navigatie sluiten' : 'Navigatie openen'}
          aria-expanded={menuOpen}
          aria-controls="home-mobile-navigation"
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
          id="home-mobile-navigation"
          aria-label="Mobiele navigatie"
          className="lg:hidden animate-fade-in absolute inset-x-0 top-full z-10 border-b border-stone-200 bg-stone-100/95 backdrop-blur-md shadow-lg"
        >
          <div className="px-4 sm:px-8 py-4 flex flex-col gap-1 text-base font-semibold text-stone-700">
            <a
              href="#presets"
              onClick={() => setMenuOpen(false)}
              className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
            >
              Alle 30 Presets
            </a>
            <a
              href="#hoe-het-werkt"
              onClick={() => setMenuOpen(false)}
              className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
            >
              Hoe het werkt
            </a>
            <a
              href="#prijzen"
              onClick={() => setMenuOpen(false)}
              className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
            >
              Prijzen
            </a>
            <a
              href="#vakken"
              onClick={() => setMenuOpen(false)}
              className="h-12 flex items-center border-b border-stone-200/80 hover:text-stone-900 transition-colors"
            >
              Vakgebieden
            </a>
            <button
              onClick={handleGoComponents}
              className="h-12 flex items-center bg-transparent border-0 p-0 text-base font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
            >
              Componenten
            </button>
            <button
              onClick={handleGoStart}
              className="sm:hidden mt-3 h-12 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              Plan een afspraak
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};
