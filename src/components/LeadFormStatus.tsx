import React from 'react';
import { AlertTriangle, MessageCircle } from 'lucide-react';

/**
 * Hidden field only bots fill in. Off-screen rather than display:none, since
 * some bots skip invisible inputs; real visitors and screen readers skip it.
 */
export const LeadHoneypot: React.FC<{ inputRef: React.RefObject<HTMLInputElement | null> }> = ({ inputRef }) => (
  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
    <label>
      Laat dit veld leeg
      <input ref={inputRef} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
    </label>
  </div>
);

interface LeadErrorProps {
  error: string;
  /** wa.me link with the same message, so the lead is never lost. */
  whatsappUrl?: string | null;
  onWhatsAppClick?: () => void;
}

/** Error state of a lead form, with a WhatsApp fallback when one is available. */
export const LeadError: React.FC<LeadErrorProps> = ({ error, whatsappUrl, onWhatsAppClick }) => (
  <div role="alert" className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50 text-sm text-rose-900 flex flex-col gap-3">
    <span className="font-bold flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      {error}
    </span>
    {whatsappUrl && whatsappUrl.startsWith('https://wa.me/') && (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        onClick={onWhatsAppClick}
        className="h-11 rounded-full bg-[#25D366] text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 no-underline"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        Stuur het via WhatsApp
      </a>
    )}
  </div>
);
