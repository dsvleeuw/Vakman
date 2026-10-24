import React from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { DEMO_CONTACT_HREF } from '../utils/contact';

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

/** Error message with the WhatsApp fallback (built via `utils/contact.ts`). */
export const LeadErrorNotice: React.FC<{ message?: string; whatsappUrl?: string | null }> = ({
  message,
  whatsappUrl,
}) => (
  <div role="alert" className="rounded-xl border-2 border-rose-200 bg-rose-50 p-4 flex flex-col gap-3 text-left">
    <p className="m-0 text-sm font-bold text-rose-800 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      {message || 'Versturen is niet gelukt.'}
    </p>
    {whatsappUrl && whatsappUrl !== DEMO_CONTACT_HREF && (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="h-11 px-5 self-start rounded-full bg-[#25D366] hover:brightness-95 text-white font-extrabold text-sm inline-flex items-center gap-2 no-underline"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        Stuur het via WhatsApp
      </a>
    )}
  </div>
);
