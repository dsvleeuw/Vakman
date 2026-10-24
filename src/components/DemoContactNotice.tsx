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

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const lastClickRef = useRef<{ el: HTMLElement; time: number } | null>(null);
  const navigatingRef = useRef(false);

  onCloseRef.current = onClose;

  // Record the clicked trigger before the dialog opens so focus returns even in
  // browsers (WebKit) or synthetic `.click()` calls that do not focus `<a>`.
  useEffect(() => {
    if (open) return;
    const handleClickCapture = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest<HTMLElement>(FOCUSABLE_SELECTOR);
      if (trigger) {
        lastClickRef.current = { el: trigger, time: performance.now() };
      }
    };
    document.addEventListener('click', handleClickCapture, true);
    return () => document.removeEventListener('click', handleClickCapture, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    navigatingRef.current = false;

    const active = document.activeElement;
    const recentClick =
      lastClickRef.current && performance.now() - lastClickRef.current.time < 250
        ? lastClickRef.current.el
        : null;
    lastClickRef.current = null;

    const opener =
      recentClick ??
      (active instanceof HTMLElement &&
      active !== document.body &&
      active !== document.documentElement
        ? active
        : null);

    closeRef.current?.focus();

    const getFocusableElements = (): HTMLElement[] => {
      const dialog = dialogRef.current;
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-hidden') !== 'true' &&
          !el.closest('[aria-hidden="true"]')
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;

      const focusable = getFocusableElements();
      event.preventDefault();
      if (focusable.length === 0) {
        dialogRef.current?.focus();
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey) {
        const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
        focusable[prevIndex].focus();
      } else {
        const nextIndex =
          currentIndex === -1 || currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
        focusable[nextIndex].focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || !(event.target instanceof Node) || dialog.contains(event.target)) return;
      const focusable = getFocusableElements();
      (focusable[0] ?? closeRef.current ?? dialog).focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      if (!navigatingRef.current && opener && opener.isConnected) {
        opener.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-contact-title"
        tabIndex={-1}
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
          <X className="w-5 h-5" aria-hidden="true" />
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
          onClick={() => {
            navigatingRef.current = true;
            onClose();
          }}
          className="min-h-12 px-5 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-900 font-extrabold text-sm inline-flex items-center justify-center no-underline"
        >
          Maak dit mijn website →
        </RouteLink>
      </div>
    </div>
  );
};
