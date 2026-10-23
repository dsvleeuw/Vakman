import React from 'react';

interface HeaderProps {
  onGoHome: () => void;
  onGoStart: () => void;
  scrolled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome, onGoStart, scrolled }) => {
  return (
    <header
      className={`sticky top-0 z-20 backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-8 px-4 sm:px-8 md:px-12 border-b border-stone-200/60 ${
        scrolled
          ? 'py-3.5 bg-stone-100/90 shadow-sm'
          : 'py-5 bg-stone-100/75'
      }`}
    >
      {/* Zone 1: Brand Wordmark */}
      <button
        onClick={onGoHome}
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
      <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600">
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
          href="#vakken"
          className="hover:text-stone-900 transition-colors whitespace-nowrap shrink-0"
        >
          Vakgebieden
        </a>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onGoStart}
          className="h-11 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold tracking-tight cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm whitespace-nowrap shrink-0"
        >
          Start gratis →
        </button>
      </div>
    </header>
  );
};
