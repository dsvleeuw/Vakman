import React, { useState } from 'react';
import type { ActiveSiteData } from '../types';
import { validatePostalCode } from '../utils/pricing';
import { normalizeDutchPhone } from '../utils/contact';
import { siteContext } from '../utils/lead';
import { useLeadForm } from '../hooks/useLeadForm';
import { ImageWithFallback } from './ImageWithFallback';
import { HoneypotField, LeadErrorNotice } from './LeadStatus';

interface AreaCheckerProps {
  site: ActiveSiteData;
}

/**
 * The postcode check: does the craftsman come to this address?
 *
 * On a published page it works with the work area of the craftsman, never
 * with the area of the trade example. The postcode always reaches him, so a
 * visitor who is told "yes" is not left waiting for a call that never
 * comes (VISION principle 4).
 */
export const AreaChecker: React.FC<AreaCheckerProps> = ({ site }) => {
  const [postalCode, setPostalCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    isValid: boolean;
    inArea: boolean;
    message: string;
  } | null>(null);
  const lead = useLeadForm('area-checker');

  // A published page answers with the work area of the craftsman. The demo
  // keeps the area of the sector it shows.
  const customer = Boolean(site.published);

  const check = () => {
    const res = validatePostalCode(postalCode, site.near, site.city, site.pcExample);
    // On a published page the wording is the craftsman's: no promise about
    // how fast he comes, and an example postcode of nobody.
    const message = customer
      ? !res.isValid
        ? 'Vul een geldige postcode in, bijvoorbeeld 1234 AB.'
        : res.inArea
          ? `Ja, je postcode valt in mijn werkgebied rond ${site.city}. Ik neem contact met je op over de mogelijkheden.`
          : 'Je postcode valt buiten het gebied waar ik werk. Bel of app me gerust, dan kijk ik of ik toch kan langskomen.'
      : res.message;
    setResult({ ...res, message });
    return res;
  };

  const handleCheck = () => {
    const res = check();
    if (!res.isValid) return;
    // The craftsman hears about the postcode, so a visitor who is told
    // "yes" also gets a call.
    void lead.submit({
      type: 'area',
      site: siteContext(site),
      fields: { postcode: postalCode, name, phone },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(phone)) errs.phone = 'Gebruik een geldig nummer, bijv. 06 12345678';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    handleCheck();
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
      hasError ? 'border-rose-500' : 'border-stone-500'
    }`;

  return (
    <section
      id="gebied"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20 border-t border-stone-200/60"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Form & Explanations */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <span
            className="font-mono text-xs font-semibold tracking-wider uppercase"
            style={{ color: site.muted }}
          >
            WERKGEBIED CHECKEN
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Kom ik bij jou op locatie?
          </h2>

          <p
            className="text-base sm:text-lg leading-relaxed m-0"
            style={{ color: site.muted }}
          >
            {customer ? (
              <>
                Ik werk in <strong style={{ color: site.fg }}>{site.city}</strong> en
                omgeving. Vul je postcode in en laat je nummer achter, dan weet ik
                meteen of ik bij je kan langskomen.
              </>
            ) : (
              <>
                Vul hieronder je postcode in. Ik werk standaard binnen een straal van
                ongeveer 25 km rondom <strong style={{ color: site.fg }}>{site.city}</strong>.
              </>
            )}
          </p>

          <div className="flex gap-2.5 flex-wrap pt-1">
            <input
              type="text"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value.toUpperCase());
                setResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={site.pcExample}
              maxLength={7}
              className="h-14 w-48 px-4 rounded-xl border-2 border-stone-900 bg-white text-stone-900 font-mono font-bold text-lg uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-stone-900"
              aria-label="Postcode"
            />
            <button
              onClick={handleCheck}
              className="h-14 px-7 rounded-xl border-0 bg-stone-900 hover:bg-stone-800 text-white text-base font-bold cursor-pointer transition-colors duration-200"
            >
              Check beschikbaarheid
            </button>
          </div>

          {customer && (
            <div className="flex flex-col gap-3 pt-1">
              <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="area-name"
                    className="block text-xs font-bold mb-1"
                    style={{ color: site.fg }}
                  >
                    Je naam *
                  </label>
                  <input
                    id="area-name"
                    type="text"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="bijv. Sanne de Jong"
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <span role="alert" className="text-xs text-rose-600 font-bold block mt-1">
                      {errors.name}
                    </span>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="area-phone"
                    className="block text-xs font-bold mb-1"
                    style={{ color: site.fg }}
                  >
                    Telefoonnummer *
                  </label>
                  <input
                    id="area-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="06 12 34 56 78"
                    className={inputClass(errors.phone)}
                  />
                  {errors.phone && (
                    <span role="alert" className="text-xs text-rose-600 font-bold block mt-1">
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={lead.status === 'sending'}
                className="disabled:opacity-60 self-start h-12 px-5 rounded-xl border-0 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold cursor-pointer transition-colors duration-200"
              >
                {lead.status === 'sending' ? 'Versturen…' : 'Stuur mijn postcode'}
              </button>
              {lead.status === 'error' && <LeadErrorNotice message={lead.result?.error} />}
            </div>
          )}

          {result && (
            <div
              className={`p-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                result.inArea
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : result.isValid
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
              aria-live="polite"
            >
              {result.message}
            </div>
          )}
        </div>

        {/* Right Column: the area of the craftsman */}
        {customer ? (
          <div
            className="lg:col-span-6 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center gap-4 shadow-md"
            style={{
              background: site.card,
              borderRadius: site.radiusLg,
              border: `1px solid ${site.line}`,
            }}
          >
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
            <span className="h-10 px-4 rounded-full bg-white text-stone-900 flex items-center font-bold text-sm shadow">
              {site.city} en omgeving
            </span>
            <p className="text-sm text-stone-600 m-0 max-w-xs leading-relaxed">
              Vul je postcode in. Ik laat je weten of ik bij je kan langskomen.
            </p>
          </div>
        ) : (
          <div
            className="lg:col-span-6 aspect-[16/11] rounded-3xl overflow-hidden relative shadow-md bg-stone-200"
            style={{ borderRadius: site.radiusLg }}
          >
            <ImageWithFallback
              src={site.img.c}
              alt={`Werkgebied ${site.city}`}
              className="w-full h-full object-cover filter saturate-[0.85]"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-6">
              <div className="w-56 h-56 rounded-full border-2 border-white/90 bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 pulse-glow shadow-2xl">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 mb-2 shadow" />
                <span className="h-8 px-3.5 rounded-full bg-white text-stone-900 flex items-center font-bold text-sm shadow">
                  {site.city} + 25 km
                </span>
                <span className="text-xs text-white/90 font-medium mt-1">
                  geen extra voorrijkosten
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
