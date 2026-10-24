import React from 'react';
import { ArrowRight, Compass, Home } from 'lucide-react';
import { RouteLink } from './RouteLink';

interface NotFoundViewProps {
  path: string;
  onGoHome: () => void;
}

/**
 * Real 404 page instead of a blank screen. Every link here is a normal URL,
 * so people can bookmark or share what they were looking for.
 */
export const NotFoundView: React.FC<NotFoundViewProps> = ({ path, onGoHome }) => (
  <div className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
    <header className="px-4 sm:px-8 md:px-12 py-5 flex items-center justify-between border-b border-stone-200/60">
      <button
        onClick={onGoHome}
        className="flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
        aria-label="Klusbaas Home"
      >
        <span className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-black text-lg shadow-sm">
          K
        </span>
        <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Klusbaas</span>
      </button>
      <span className="font-mono text-xs font-bold tracking-widest uppercase text-stone-500">
        404 · niet gevonden
      </span>
    </header>

    <main
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-16 text-center"
    >
      <span className="flex items-center gap-2 h-9 px-4 rounded-full bg-amber-300 text-amber-950 text-xs font-extrabold uppercase tracking-wider">
        <Compass className="w-4 h-4" aria-hidden="true" />
        Verkeerde afslag
      </span>

      <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[0.95] text-balance max-w-3xl m-0">
        Deze pagina bestaat niet (meer).
      </h1>
      <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-xl leading-relaxed m-0 text-pretty">
        Misschien is de link verouderd of bevat het adres een typefout. Kies hieronder
        waar je verder wilt.
      </p>
      {path && (
        <code className="mt-4 px-3 py-2 rounded-lg bg-stone-200/70 text-xs text-stone-500 break-all">
          {path}
        </code>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-lg sm:justify-center">
        <RouteLink
          route={{ name: 'home' }}
          className="h-14 px-7 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow-md transition-transform hover:-translate-y-0.5"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Naar de homepage
        </RouteLink>
        <RouteLink
          route={{ name: 'wizard', step: 'vak' }}
          className="h-14 px-7 rounded-full border-2 border-stone-900 hover:bg-white text-stone-900 font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors"
        >
          Start je website
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </RouteLink>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-stone-600">
        <RouteLink route={{ name: 'home' }} hash="presets" className="hover:text-stone-900 underline underline-offset-4">
          Alle 30 presets
        </RouteLink>
        <RouteLink route={{ name: 'components' }} className="hover:text-stone-900 underline underline-offset-4">
          Componenten
        </RouteLink>
        <RouteLink
          route={{ name: 'site', sector: 'loodgieter', styleId: 'krachtig' }}
          className="hover:text-stone-900 underline underline-offset-4"
        >
          Voorbeeld: loodgieter
        </RouteLink>
      </div>
    </main>

    <footer className="border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500 bg-white">
      Klusbaas · Websites voor vakmensen
    </footer>
  </div>
);
