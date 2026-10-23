import React, { useState } from 'react';
import type { SectorId, WizardFormData } from '../types';
import {
  ORDER,
  SECTORS,
  STYLES,
  getUnsplashUrl,
  buildActiveSite,
} from '../data/tradesData';
import { validateWizardForm } from '../utils/pricing';
import { ImageWithFallback } from './ImageWithFallback';

interface WizardViewProps {
  initialSector: SectorId;
  initialStyleIndex: number;
  initialStep?: number;
  onGoHome: () => void;
  onViewPublishedSite: (sectorId: SectorId, styleIndex: number, form: WizardFormData) => void;
}

export const WizardView: React.FC<WizardViewProps> = ({
  initialSector,
  initialStyleIndex,
  initialStep = 0,
  onGoHome,
  onViewPublishedSite,
}) => {
  const [sector, setSector] = useState<SectorId>(initialSector);
  const [styleIndex, setStyleIndex] = useState<number>(initialStyleIndex);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  const baseSector = SECTORS[sector];

  const [formData, setFormData] = useState<WizardFormData>({
    biz: baseSector.biz,
    owner: baseSector.owner,
    phone: baseSector.phone,
    city: baseSector.city,
  });

  const [disabledServices, setDisabledServices] = useState<Record<number, boolean>>({});
  const [channel, setChannel] = useState<'WhatsApp' | 'E-mail' | 'Allebei'>('WhatsApp');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState(false);

  // Sync default form values if sector changes and user hasn't heavily modified it
  const handleSelectSector = (secId: SectorId) => {
    setSector(secId);
    const newBase = SECTORS[secId];
    setFormData({
      biz: newBase.biz,
      owner: newBase.owner,
      phone: newBase.phone,
      city: newBase.city,
    });
    setDisabledServices({});
    setErrors({});
  };

  const handleFieldChange = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (currentStep === 2) {
      const formErrors = validateWizardForm(formData);
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        return;
      }
    }

    if (currentStep === 4) {
      setIsPublished(true);
      return;
    }

    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const liveSite = buildActiveSite(sector, styleIndex, formData, disabledServices);

  const stepsMeta = ['Vak', 'Stijl', 'Gegevens', 'Diensten', 'Online'];

  return (
    <div className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
      {/* Wizard Header with Step Progress */}
      <header className="bg-white border-b border-stone-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-6 flex-wrap sticky top-0 z-20 shadow-sm">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
          aria-label="Terug naar start"
        >
          <span className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-base">
            K
          </span>
          <span className="text-xl font-extrabold tracking-tight">Klusbaas</span>
        </button>

        {/* Step Bullets */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {stepsMeta.map((title, idx) => {
            const isCompleted = idx < currentStep || isPublished;
            const isCurrent = idx === currentStep && !isPublished;

            return (
              <div key={title} className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-2'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold hidden sm:inline ${
                    isCurrent ? 'text-stone-900' : 'text-stone-500'
                  }`}
                >
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Split Layout: Form on Left, Live Sticky Preview on Right */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7 flex flex-col gap-6 max-w-xl">
          {/* STEP 1: Vak kiezen */}
          {currentStep === 0 && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 1 VAN 5
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Wat is jouw vak?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Kies je vakgebied. Wij laden meteen geschikte diensten, tarieven en
                fotografie in.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {ORDER.map((secId) => {
                  const sec = SECTORS[secId];
                  const isSelected = secId === sector;
                  const thumb = getUnsplashUrl(sec.pool[0], 400);

                  return (
                    <button
                      key={secId}
                      onClick={() => handleSelectSector(secId)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer p-0 shadow-sm transition-all hover:scale-[1.03] ${
                        isSelected
                          ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2 scale-[1.02]'
                          : 'border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      <ImageWithFallback
                        src={thumb}
                        alt={sec.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <span className="absolute left-3 bottom-3 text-white font-extrabold text-base sm:text-lg">
                        {sec.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Stijl kiezen */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 2 VAN 5
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Welke stijl past bij jou?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Kies uit vijf unieke ontwerpen. Rechts zie je meteen het resultaat
                met jouw gekozen vak.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {STYLES.map((st, idx) => {
                  const isSelected = idx === styleIndex;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStyleIndex(idx)}
                      className={`p-4 rounded-2xl border-2 bg-white text-left cursor-pointer flex items-center justify-between gap-4 transition-all ${
                        isSelected
                          ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-1 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-stone-400">
                          0{idx + 1}
                        </span>
                        <h3
                          className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 m-0"
                          style={{ fontFamily: st.display }}
                        >
                          {st.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-500 m-0 line-clamp-1">
                          {st.desc}
                        </p>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Gegevens invoeren */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 3 VAN 5
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Jouw bedrijfsgegevens
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Vul hieronder je contactgegevens in. Zodra je typt, werkt het live
                voorbeeld rechts meteen bij.
              </p>

              <div className="flex flex-col gap-4 pt-2">
                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Bedrijfsnaam
                  </label>
                  <input
                    type="text"
                    value={formData.biz}
                    onChange={(e) => handleFieldChange('biz', e.target.value)}
                    placeholder="bijv. Houtwerk De Vries"
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.biz ? 'border-rose-500' : 'border-stone-200'
                    }`}
                  />
                  {errors.biz && (
                    <span className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.biz}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Jouw voor- en achternaam
                  </label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => handleFieldChange('owner', e.target.value)}
                    placeholder="bijv. Jan de Vries"
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.owner ? 'border-rose-500' : 'border-stone-200'
                    }`}
                  />
                  {errors.owner && (
                    <span className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.owner}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Telefoonnummer (voor offertes)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.phone ? 'border-rose-500' : 'border-stone-200'
                    }`}
                  />
                  {errors.phone && (
                    <span className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Plaats / Standplaats
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="bijv. Utrecht"
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.city ? 'border-rose-500' : 'border-stone-200'
                    }`}
                  />
                  {errors.city && (
                    <span className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Diensten selecteren */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 4 VAN 5
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Welke diensten bied je aan?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Vink de werkzaamheden aan die je uitvoert. Deze verschijnen direct
                op je website.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {baseSector.services.map((sv, idx) => {
                  const isEnabled = !disabledServices[idx];

                  return (
                    <button
                      key={sv.n}
                      onClick={() => {
                        setDisabledServices((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }));
                      }}
                      className={`p-4 rounded-xl border-2 bg-white text-left cursor-pointer flex items-center justify-between gap-4 transition-all ${
                        isEnabled
                          ? 'border-stone-900 shadow-sm'
                          : 'border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isEnabled ? 'bg-stone-900 text-white' : 'bg-stone-200'
                          }`}
                        >
                          {isEnabled ? '✓' : ''}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-stone-900 m-0">
                            {sv.n}
                          </h3>
                          <span className="text-xs text-stone-500">{sv.p}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        {isEnabled ? 'Actief' : 'Verborgen'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Publiceren & Klaar */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6">
              {!isPublished ? (
                <>
                  <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                    STAP 5 VAN 5
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                    Klaar om online te gaan!
                  </h1>
                  <p className="text-stone-600 text-sm sm:text-base m-0">
                    Controleer je domeinnaam en kies via welk kanaal je nieuwe
                    klanten wilt ontvangen.
                  </p>

                  <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-500 uppercase block mb-1">
                        Gereserveerd .nl domein
                      </span>
                      <span className="font-mono text-lg font-bold text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg inline-block">
                        {liveSite.domain}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-stone-500 uppercase block mb-2">
                        Offertes ontvangen via:
                      </span>
                      <div className="flex gap-2">
                        {(['WhatsApp', 'E-mail', 'Allebei'] as const).map((ch) => (
                          <button
                            key={ch}
                            onClick={() => setChannel(ch)}
                            className={`h-11 px-4 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                              channel === ch
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-transparent text-stone-700 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400 block">Vakman:</span>
                        <strong className="text-stone-800">{formData.owner}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block">Werkgebied:</span>
                        <strong className="text-stone-800">
                          {formData.city} + 25km
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Celebration published screen */
                <div className="bg-white p-8 rounded-3xl border border-stone-200 flex flex-col items-center text-center gap-5 shadow-xl animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-3xl shadow-lg pulse-glow">
                    ✓
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 m-0">
                    Gefeliciteerd! Je site staat live.
                  </h1>
                  <p className="text-stone-600 text-base max-w-md m-0">
                    Jouw professionele website voor{' '}
                    <strong>{formData.biz}</strong> is gepubliceerd op{' '}
                    <span className="font-mono font-bold text-stone-900 underline">
                      {liveSite.domain}
                    </span>
                    .
                  </p>
                  <div className="pt-3 w-full flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() =>
                        onViewPublishedSite(sector, styleIndex, formData)
                      }
                      className="h-14 px-8 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-transform hover:-translate-y-0.5"
                    >
                      Bekijk je live website →
                    </button>
                    <button
                      onClick={onGoHome}
                      className="h-14 px-6 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer"
                    >
                      Terug naar Klusbaas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          {!isPublished && (
            <div className="flex items-center gap-3 pt-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="h-14 px-6 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-base cursor-pointer transition-colors"
                >
                  ← Terug
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 h-14 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-all hover:-translate-y-0.5"
              >
                {currentStep === 4 ? 'Publiceer mijn website direct 🚀' : 'Volgende stap →'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Real-time Live Interactive Preview */}
        <div className="lg:col-span-5 sticky top-24 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-mono font-semibold text-stone-500">
            <span>LIVE INTERACTIEF VOORBEELD</span>
            <span>{STYLES[styleIndex].name}</span>
          </div>

          {/* Mini Browser Window Mockup */}
          <div
            className="rounded-2xl overflow-hidden border border-stone-300/80 shadow-2xl transition-all duration-300 flex flex-col"
            style={{
              background: liveSite.bg,
              color: liveSite.fg,
            }}
          >
            {/* Browser top pill */}
            <div className="bg-stone-200/90 border-b border-stone-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-stone-600">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              </div>
              <span className="font-semibold text-stone-800">{liveSite.domain}</span>
              <span className="opacity-0">•••</span>
            </div>

            {/* Mini Site Content */}
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* Mini Brand & Nav */}
              <div className="flex justify-between items-center pb-2 border-b border-black/10">
                <span
                  className="font-bold text-base sm:text-lg tracking-tight"
                  style={{ fontFamily: liveSite.display }}
                >
                  {liveSite.biz}
                </span>
                <span
                  className="px-2.5 py-1 text-[10px] font-bold rounded-full"
                  style={{
                    background: liveSite.accent,
                    color: liveSite.onAccent,
                  }}
                >
                  {liveSite.city}
                </span>
              </div>

              {/* Mini Hero Graphic */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden shadow-sm">
                <ImageWithFallback
                  src={liveSite.img.hero}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute left-3 right-3 bottom-3 text-white">
                  <span
                    className="text-base sm:text-lg font-bold leading-tight block"
                    style={{ fontFamily: liveSite.display }}
                  >
                    {liveSite.headline}
                  </span>
                  <span className="text-[11px] opacity-80 mt-1 block">
                    Vakman: {liveSite.owner}
                  </span>
                </div>
              </div>

              {/* Mini Services List */}
              <div className="grid grid-cols-2 gap-2">
                {liveSite.services.slice(0, 4).map((sv) => (
                  <div
                    key={sv.n}
                    className="p-2.5 rounded-lg border text-xs flex flex-col justify-between min-h-[54px]"
                    style={{
                      background: liveSite.card,
                      borderColor: liveSite.line,
                    }}
                  >
                    <span className="font-bold line-clamp-1">{sv.n}</span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: liveSite.accentText }}
                    >
                      {sv.p}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mini Footer Bar */}
              <div
                className="p-3 rounded-xl flex items-center justify-between text-xs font-bold"
                style={{
                  background: liveSite.accent,
                  color: liveSite.onAccent,
                }}
              >
                <span>{liveSite.callLabel}</span>
                <span>Offerte →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
