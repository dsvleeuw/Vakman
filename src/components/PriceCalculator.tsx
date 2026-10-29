import React, { useState, useEffect } from 'react';
import type { ActiveSiteData, QuizOption } from '../types';
import { calculateEstimate, formatPrice } from '../utils/pricing';
import { normalizeDutchPhone } from '../utils/contact';
import { describeDelivery } from '../utils/leadClient';
import { siteContext } from '../utils/lead';
import { useLeadForm } from '../hooks/useLeadForm';
import { HoneypotField, LeadErrorNotice } from './LeadStatus';

interface PriceCalculatorProps {
  site: ActiveSiteData;
}

/**
 * The price calculator. The visitor picks what he needs, sees the price the
 * craftsman asked for it and asks for a quote.
 *
 * The request really goes out: it is posted to `/api/lead`, stored at
 * Klusbaas in the name of the craftsman and mailed to him. A button that
 * says "aangevraagd" without anything arriving is the one thing a tradesman
 * cannot have (VISION principle 4).
 */
export const PriceCalculator: React.FC<PriceCalculatorProps> = ({ site }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, QuizOption>>({});
  const [sent, setSent] = useState(false);
  const [displayedPrice, setDisplayedPrice] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lead = useLeadForm('price-calculator');

  const questions = site.flow;
  const currentQuestion = questions[currentStep] || questions[0];
  const allAnswered = questions.every((_, idx) => !!selectedAnswers[idx]);

  // Calculate target price based on current selections
  const currentSelections = questions.map((_, idx) => selectedAnswers[idx]);
  const targetPrice = calculateEstimate(currentSelections);

  // Smooth tween animation for the price counter
  useEffect(() => {
    if (targetPrice === 0) {
      setDisplayedPrice(0);
      return;
    }

    const start = displayedPrice;
    const end = targetPrice;
    const duration = 400; // ms
    const startTime = performance.now();

    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayedPrice(Math.round(start + (end - start) * ease));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetPrice]);

  const handleSelectOption = (opt: QuizOption) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentStep]: opt,
    }));
    setSent(false);

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /** The services the visitor picked, as one line for the craftsman. */
  const pickedServices = questions
    .map((question, index) => {
      const answer = selectedAnswers[index];
      return answer ? `${question.q.replace('?', '')}: ${answer.l}` : '';
    })
    .filter(Boolean)
    .join(' | ');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(phone)) errs.phone = 'Gebruik een geldig nummer, bijv. 06 12345678';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || lead.status === 'sending') return;
    const response = await lead.submit({
      type: 'price',
      site: siteContext(site),
      fields: {
        name,
        phone,
        service: pickedServices || site.biz,
        estimate: formatPrice(targetPrice),
        message,
      },
    });
    if (response.ok) setSent(true);
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
      hasError ? 'border-rose-500' : 'border-stone-500'
    }`;

  return (
    <section
      id="prijs"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-16 transition-colors duration-400"
      style={{
        background: site.invBg,
        color: site.invFg,
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Left Column: Interactive Step Quiz */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Progress Bars */}
          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <span
                key={idx}
                className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                style={{
                  background: selectedAnswers[idx] ? site.hi : site.invLine,
                }}
              />
            ))}
          </div>

          <span
            className="font-mono text-xs font-semibold tracking-wider uppercase"
            style={{ color: site.invMuted }}
          >
            PRIJS BEREKENEN · VRAAG {currentStep + 1} VAN {questions.length}
          </span>

          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            {currentQuestion.q}
          </h2>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {currentQuestion.o.map((opt) => {
              const isSelected = selectedAnswers[currentStep]?.l === opt.l;

              return (
                <button
                  key={opt.l}
                  onClick={() => handleSelectOption(opt)}
                  className="min-h-[58px] px-5 py-3.5 border-2 text-left cursor-pointer flex justify-between items-center gap-4 transition-all duration-200 hover:translate-x-1"
                  style={{
                    borderRadius: site.radiusSm,
                    borderColor: isSelected ? site.hi : site.invLine,
                    background: isSelected ? site.hi : 'transparent',
                    color: isSelected ? site.onHi : site.invFg,
                  }}
                >
                  <span className="text-base sm:text-lg font-semibold">
                    {opt.l}
                  </span>
                  {opt.h && (
                    <span className="font-mono text-xs sm:text-sm opacity-80 whitespace-nowrap shrink-0">
                      {opt.h}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="self-start bg-transparent border-0 text-sm font-medium cursor-pointer p-0 underline hover:opacity-80 mt-1"
              style={{ color: site.invMuted }}
            >
              ← Vorige vraag
            </button>
          )}
        </div>

        {/* Right Column: Dynamic Price Summary Box */}
        <div
          className="lg:col-span-5 border rounded-3xl p-6 sm:p-8 flex flex-col gap-5 shadow-lg"
          style={{
            borderColor: site.invLine,
            borderRadius: site.radiusLg,
            background: site.card,
            color: site.fg,
          }}
        >
          <span className="font-mono text-xs font-bold text-stone-500 uppercase tracking-wider">
            JOUW PRIJSINDICATIE
          </span>

          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl sm:text-6xl font-black tracking-tight leading-none tabular-nums"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                color: site.accentText,
              }}
            >
              {targetPrice > 0 ? formatPrice(displayedPrice) : '€ —'}
            </span>
          </div>

          <p className="text-sm text-stone-600 leading-relaxed m-0">
            {targetPrice > 0
              ? site.estNote
              : 'Kies hiernaast je gewenste opties om direct een gespecificeerde prijsindicatie te zien.'}
          </p>

          {/* Selections breakdown */}
          <div
            className="flex flex-col gap-2.5 pt-4 border-t border-stone-200 text-sm"
          >
            {questions.map((q, idx) => {
              const ans = selectedAnswers[idx];
              if (!ans) return null;
              return (
                <div key={idx} className="flex justify-between gap-3">
                  <span className="text-stone-500 line-clamp-1">{q.q.replace('?', '')}:</span>
                  <span className="font-semibold text-stone-900 text-right shrink-0">
                    {ans.l}
                  </span>
                </div>
              );
            })}
          </div>

          {/* The request: name and phone, so the craftsman can call back. */}
          {sent ? (
            <div className="flex flex-col gap-2 pt-2" aria-live="polite">
              <p className="text-base font-bold m-0" style={{ color: site.fg }}>
                ✓ Je aanvraag is verstuurd.
              </p>
              <p className="text-sm text-stone-600 m-0">
                {lead.result?.reference ? `Referentie ${lead.result.reference}. ` : ''}
                {lead.result ? describeDelivery(lead.result) : ''}
              </p>
            </div>
          ) : showForm ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2" noValidate>
              <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />
              <p className="text-sm font-bold m-0" style={{ color: site.fg }}>
                Waar wil je de offerte voor?
              </p>
              <div>
                <label htmlFor="price-name" className="block text-xs font-bold mb-1" style={{ color: site.fg }}>
                  Je naam *
                </label>
                <input
                  id="price-name"
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
                <label htmlFor="price-phone" className="block text-xs font-bold mb-1" style={{ color: site.fg }}>
                  Telefoonnummer *
                </label>
                <input
                  id="price-phone"
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
              <div>
                <label htmlFor="price-message" className="block text-xs font-bold mb-1" style={{ color: site.fg }}>
                  Toelichting (optioneel)
                </label>
                <textarea
                  id="price-message"
                  rows={3}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Bijvoorbeeld: drie kozijnen aan de voorzijde."
                  className={`${inputClass()} h-auto py-3 leading-relaxed resize-y`}
                />
              </div>
              {lead.status === 'error' && <LeadErrorNotice message={lead.result?.error} />}
              <button
                type="submit"
                disabled={lead.status === 'sending'}
                className="disabled:opacity-60 h-14 px-6 rounded-full border-0 text-base font-bold cursor-pointer transition-all duration-200 shadow-sm disabled:cursor-not-allowed"
                style={{
                  borderRadius: site.radius,
                  background: site.accent,
                  color: site.onAccent,
                }}
              >
                {lead.status === 'sending' ? 'Versturen…' : 'Verstuur mijn aanvraag'}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              disabled={!allAnswered}
              className={`h-14 mt-2 px-6 rounded-full border-0 text-base font-bold cursor-pointer transition-all duration-200 shadow-sm ${
                allAnswered
                  ? 'hover:-translate-y-0.5 active:translate-y-0 opacity-100'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{
                borderRadius: site.radius,
                background: allAnswered ? site.accent : site.line,
                color: allAnswered ? site.onAccent : site.muted,
              }}
            >
              {allAnswered ? 'Vraag deze offerte direct aan →' : 'Beantwoord alle vragen voor offerte'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
