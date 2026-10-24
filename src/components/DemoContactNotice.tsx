import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Route } from '../utils/router';
import { RouteLink } from './RouteLink';

interface DemoContactNoticeProps {
  open: boolean;
  onClose: () => void;
  /** Where "Maak dit mijn website" goes, usually /start/gegevens. */
  wizardRoute: Route;
}

/**
 * Shown when a visitor taps call or WhatsApp on a demo site that has no safe
 * number (no `VITE_DEMO_PHONE`): the sample numbers may belong to strangers,
 * so instead of dialling we explain the demo and point to the wizard.
 */
export const DemoContactNotice: React.FC<DemoContactNoticeProps> = ({
  open,
  onClose,
  wizardRoute,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-contact-title"
        className="relative w-full max-w-sm rounded-2xl bg-white text-stone-900 p-6 shadow-2xl flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className="absolute top-2 right-2 w-11 h-11 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 id="demo-contact-title" className="text-xl font-black leading-tight pr-10 m-0">
          Dit is een demo — zo komen klanten bij jou binnen
        </h2>
        <p className="text-sm text-stone-600 m-0">
          Op jouw eigen website belt of appt deze knop direct naar jouw nummer. Vul je
          gegevens in en zie het meteen met jouw naam.
        </p>
        <RouteLink
          route={wizardRoute}
          onClick={onClose}
          className="min-h-12 px-5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-sm inline-flex items-center justify-center no-underline"
        >
          Maak dit mijn website →
        </RouteLink>
      </div>
    </div>
  );
};
