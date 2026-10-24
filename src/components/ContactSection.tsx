import React, { useState } from 'react';
import { MessageCircle, Phone, CheckCircle2, Send } from 'lucide-react';
import type { ActiveSiteData } from '../types';
import {
  buildWhatsAppUrl,
  buildTelUrl,
  buildContactMessage,
  normalizeDutchPhone,
} from '../utils/contact';
import { track } from '../utils/analytics';

interface ContactSectionProps {
  site: ActiveSiteData;
}

/**
 * Contact strategy D from the market research: WhatsApp is the primary,
 * low-threshold channel (tradespeople live on it all day); a short form
 * is the alternative for visitors who prefer not to open WhatsApp
 * themselves. The form prefills a WhatsApp message so no backend is
 * needed and every lead still lands in one inbox.
 */
export const ContactSection: React.FC<ContactSectionProps> = ({ site }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const ownerFirst = site.owner.split(' ')[0];
  const directWhatsApp = buildWhatsAppUrl(
    site.phone,
    `Hallo ${site.biz}! Ik wil graag meer informatie over een klus.`
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(phone)) {
      errs.phone = 'Gebruik een geldig nummer, bijv. 06 12345678 of +31 6 12345678';
    }
    if (message.trim().length < 10) {
      errs.message = 'Omschrijf je klus in minimaal 10 tekens';
    }
    setErrors(errs);
    const firstInvalid = ['name', 'phone', 'message'].find((field) => errs[field]);
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setWaUrl(
      buildWhatsAppUrl(
        site.phone,
        buildContactMessage(site.biz, { name, phone, message })
      )
    );
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
      hasError ? 'border-rose-500' : 'border-stone-500'
    }`;

  return (
    <section
      id="contact"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-7 sm:gap-10">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-semibold tracking-wider uppercase text-stone-500">
            Contact
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Stuur {ownerFirst} een bericht.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Primary channel: WhatsApp */}
          <div className="lg:col-span-5 bg-[#25D366] text-white rounded-3xl p-7 sm:p-9 flex flex-col gap-5 shadow-lg">
            <span className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black m-0">WhatsApp — snelste antwoord</h3>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed m-0">
                {ownerFirst} reageert meestal binnen een uur, ook ’s avonds.
                Stuur een foto van de klus mee en je krijgt sneller een
                realistische inschatting.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm font-semibold text-white/95 m-0 p-0 list-none">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Geen wachtmuziek of keuzemenu
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Foto’s en locatie direct meesturen
              </li>
            </ul>
            <a
              href={directWhatsApp}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('whatsapp_click', { source: 'contact-card' })}
              className="mt-auto h-14 px-6 rounded-full bg-white text-[#128C4B] font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              Open WhatsApp
            </a>
            <a
              href={buildTelUrl(site.phone)}
              className="h-12 px-6 rounded-full border-2 border-white/70 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-white/10"
            >
              <Phone className="w-4 h-4" />
              Of bel {site.phone}
            </a>
          </div>

          {!mobileFormOpen && !waUrl && (
            <button
              type="button"
              onClick={() => setMobileFormOpen(true)}
              className="sm:hidden min-h-12 px-5 border font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2"
              style={{
                background: site.card,
                borderColor: site.line,
                color: site.fg,
                borderRadius: site.radius,
              }}
            >
              Liever het contactformulier invullen? →
            </button>
          )}

          {/* Alternative channel: short contact form */}
          <div
            className={`${
              mobileFormOpen || waUrl ? 'flex' : 'hidden sm:flex'
            } lg:col-span-7 border p-6 sm:p-9 shadow-sm flex-col`}
            style={{
              background: site.card,
              borderColor: site.line,
              borderRadius: site.radiusLg,
            }}
          >
            {waUrl ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-8 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg pulse-glow">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-stone-900 m-0">
                  Je bericht staat klaar.
                </h3>
                <p className="text-stone-600 text-sm max-w-md m-0">
                  Open WhatsApp om je bericht aan {site.biz} te versturen.
                  Daarna heb je het gesprek gewoon in je eigen WhatsApp staan.
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-14 px-8 rounded-full bg-[#25D366] hover:brightness-95 text-white font-extrabold text-base flex items-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  Verstuur via WhatsApp
                </a>
                <button
                  onClick={() => setWaUrl(null)}
                  className="text-xs font-bold text-stone-500 underline bg-transparent border-0 cursor-pointer"
                >
                  Wijzig je bericht
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                <h3 className="text-xl font-bold text-stone-900 m-0">
                  Liever een formulier?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-bold text-stone-700 mb-1">
                      Je naam *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((p) => ({ ...p, name: '' }));
                      }}
                      placeholder="bijv. Sanne de Jong"
                      className={inputClass(errors.name)}
                    />
                    {errors.name && (
                      <span id="contact-name-error" role="alert" className="text-xs text-rose-600 font-bold block mt-1">
                        {errors.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-bold text-stone-700 mb-1">
                      Telefoonnummer *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      aria-required="true"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder="06 12 34 56 78"
                      className={inputClass(errors.phone)}
                    />
                    {errors.phone && (
                      <span id="contact-phone-error" role="alert" className="text-xs text-rose-600 font-bold block mt-1">
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="contact-message" className="block text-xs font-bold text-stone-700 mb-1">
                    Waar kunnen we je mee helpen? *
                  </label>
                  <textarea
                    id="contact-message"
                    aria-required="true"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setErrors((p) => ({ ...p, message: '' }));
                    }}
                    rows={5}
                    placeholder="Omschrijf kort je klus, bijvoorbeeld: drie kozijnen aan de voorzijde schilderen."
                    className={`w-full flex-1 p-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
                      errors.message ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.message && (
                    <span id="contact-message-error" role="alert" className="text-xs text-rose-600 font-bold block mt-1">
                      {errors.message}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-14 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
                >
                  <Send className="w-5 h-5" />
                  Verstuur naar {ownerFirst}
                </button>
                <p className="text-xs text-stone-400 leading-relaxed m-0 text-center">
                  Dit formulier opent WhatsApp met je bericht klaarstaan — je
                  hoeft alleen op versturen te drukken.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
