import React, { useState } from 'react';
import type { ActiveSiteData } from '../types';
import { validatePostalCode } from '../utils/pricing';
import { ImageWithFallback } from './ImageWithFallback';

interface AreaCheckerProps {
  site: ActiveSiteData;
}

export const AreaChecker: React.FC<AreaCheckerProps> = ({ site }) => {
  const [postalCode, setPostalCode] = useState('');
  const [result, setResult] = useState<{
    isValid: boolean;
    inArea: boolean;
    message: string;
  } | null>(null);

  const handleCheck = () => {
    const res = validatePostalCode(postalCode, site.near, site.city, site.pcExample);
    setResult(res);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <section
      id="gebied"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20 border-t border-stone-200/60"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Form & Explanations */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <span className="font-mono text-xs font-semibold tracking-wider text-stone-500 uppercase">
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

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed m-0">
            Vul hieronder je postcode in. Ik werk standaard binnen een straal van
            ongeveer 25 km rondom <strong className="text-stone-900">{site.city}</strong>.
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

          {result && (
            <div
              className={`p-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                result.inArea
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : result.isValid
                  ? 'bg-amber-50 text-amber-900 border border-amber-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        {/* Right Column: Visual Radius Graphic */}
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
              <span className="text-[11px] text-white/90 font-medium mt-1">
                geen extra voorrijkosten
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
