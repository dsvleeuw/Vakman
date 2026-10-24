import React from 'react';
import { Logo } from './Logo';
import { NewsletterSignup } from './NewsletterSignup';
import { RouteLink } from './RouteLink';
import type { Route } from '../utils/router';

const LINKS: { label: string; route: Route }[] = [
  { label: 'Start je website', route: { name: 'wizard', step: 'vak' } },
  { label: 'Componenten', route: { name: 'components' } },
  { label: 'Nieuwsbrief', route: { name: 'newsletter' } },
  { label: 'Privacyverklaring', route: { name: 'privacy' } },
  { label: 'Afmelden nieuwsbrief', route: { name: 'unsubscribe' } },
];

interface SiteFooterProps {
  /** Hide the signup on the newsletter page itself, which has its own form. */
  showSignup?: boolean;
}

/** Footer for the Klusbaas marketing pages: logo, links and newsletter signup. */
export const SiteFooter: React.FC<SiteFooterProps> = ({ showSignup = true }) => (
  <footer className="bg-stone-900 text-stone-300 px-4 sm:px-8 md:px-12 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))]">
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <Logo tone="light" className="h-8 self-start" />
        <p className="m-0 text-sm leading-relaxed max-w-sm text-pretty">
          Websites voor timmermannen, hoveniers, schilders, loodgieters, elektriciens en stukadoors in de
          Haarlemmermeer en omstreken.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
          {LINKS.map((link) => (
            <RouteLink
              key={link.label}
              route={link.route}
              className="min-h-11 inline-flex items-center text-stone-200 hover:text-amber-300 underline-offset-4 hover:underline transition-colors"
            >
              {link.label}
            </RouteLink>
          ))}
        </nav>
      </div>
      {showSignup && (
        <div className="lg:col-span-6 lg:col-start-7 flex flex-col gap-3">
          <h2 className="m-0 text-xl font-black tracking-tight text-white">Tips voor je vakmanswebsite, af en toe in je inbox</h2>
          <NewsletterSignup source="footer" tone="dark" />
        </div>
      )}
    </div>
    <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-stone-800 text-xs text-stone-400">
      © {new Date().getFullYear()} Klusbaas · Websites voor vakmensen
    </div>
  </footer>
);
