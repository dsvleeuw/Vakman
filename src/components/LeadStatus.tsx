import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { DEMO_CONTACT_HREF, buildMailtoUrl } from '../utils/contact';
import { PLATFORM_CONTACT } from '../data/platform';

/**
 * Hidden field bots fill in and people never see. Off-screen rather than
 * `display:none` because some bots skip hidden inputs.
 */
export const HoneypotField: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => (
  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
    <label>
      Laat dit veld leeg
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  </div>
);

/**
 * Error message with a retry and the WhatsApp fallback (built via `utils/contact.ts`).
 * Retry calls `onRetry`, or resubmits the surrounding `<form>`; without either the
 * button is hidden. The form check runs in an effect so prerendered markup stays stable.
 */
export const LeadErrorNotice: React.FC<{ message?: string; whatsappUrl?: string | null; onRetry?: () => void }> = ({
  message,
  whatsappUrl,
  onRetry,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inForm, setInForm] = useState(false);
  useEffect(() => setInForm(Boolean(ref.current?.closest('form'))), []);
  const retry = onRetry ?? (inForm ? () => ref.current?.closest('form')?.requestSubmit() : undefined);

  return (
  <div ref={ref} role="alert" className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 flex flex-col gap-3 text-left">
    <p className="m-0 text-sm font-bold text-rose-800 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      {message || 'Versturen is niet gelukt.'}
    </p>
    {retry && (
      <button
        type="button"
        onClick={retry}
        className="h-11 px-5 self-start rounded-full border-2 border-stone-500 bg-white text-stone-900 font-extrabold text-sm cursor-pointer"
      >
        Opnieuw proberen
      </button>
    )}
    {whatsappUrl && whatsappUrl !== DEMO_CONTACT_HREF ? (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="h-11 px-5 self-start rounded-full bg-[#25D366] hover:brightness-95 text-stone-950 font-extrabold text-sm inline-flex items-center gap-2 no-underline"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        Stuur het via WhatsApp
      </a>
    ) : (
      <a
        href={buildMailtoUrl(PLATFORM_CONTACT.email, 'Aanvraag versturen', 'Het versturen van mijn aanvraag via het formulier is niet gelukt. Neem alstublieft contact met mij op.')}
        className="h-11 px-5 self-start rounded-full border-2 border-stone-500 bg-white text-stone-900 font-extrabold text-sm inline-flex items-center no-underline"
      >
        Stuur je aanvraag per e-mail
      </a>
    )}
  </div>
  );
};
