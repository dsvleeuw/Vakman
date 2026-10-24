import React from 'react';
import { Check, ShieldCheck, ArrowRight, MessageCircle, Wrench } from 'lucide-react';
import type { PlanId } from '../types';
import { PLANS } from '../data/plans';
import { formatPrice } from '../utils/pricing';

interface PricingSectionProps {
  /** Called with the plan the visitor clicked so it can travel in the URL. */
  onStart: (planId?: PlanId) => void;
}

/** Platform pricing for Klusbaas itself (the tradesperson's customer-facing
 *  prices live in the per-sector PriceCalculator). The plans themselves live
 *  in `data/plans.ts` so the wizard can show the chosen package too. */
const SERVICE_FEATURES = [
  'Hosting, SSL en je .nl-domein',
  'Doorontwikkeling en beveiligingsupdates',
  'Eén aanpassing per maand inbegrepen',
  'Whatsapp-support binnen één werkdag',
];

export const PricingSection: React.FC<PricingSectionProps> = ({ onStart }) => {
  return (
    <section
      id="prijzen"
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 bg-white border-y border-stone-200 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="font-mono text-xs font-bold tracking-widest text-stone-500 uppercase">
            Heldere prijzen, geen verrassingen
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 leading-tight m-0">
            Eén keer betalen. Daarna is de site van jou.
          </h2>
          <p className="text-stone-600 text-base sm:text-lg m-0 leading-relaxed">
            Drie complete pakketten, allemaal eenmalig en exclusief btw.
            Daarna kun je door met de optionele service van € 25 per maand —
            maandelijks opzegbaar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl p-7 sm:p-8 border-2 transition-all duration-300 hover:-translate-y-1.5 ${
                plan.popular
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xl md:scale-[1.03]'
                  : 'bg-stone-50 border-stone-200 shadow-sm'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-7 px-4 rounded-full bg-amber-400 text-stone-900 flex items-center text-xs font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                  Meest gekozen
                </span>
              )}

              <div className="flex flex-col gap-1.5">
                <h3
                  className={`text-2xl font-black m-0 ${
                    plan.popular ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm leading-relaxed m-0 min-h-[40px] ${
                    plan.popular ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {plan.blurb}
                </p>
              </div>

              <div className="flex items-baseline gap-1.5 mt-5">
                <span
                  className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${
                    plan.popular ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {formatPrice(plan.price)}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    plan.popular ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  eenmalig
                </span>
              </div>
              <span
                className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                  plan.popular ? 'text-amber-400' : 'text-stone-400'
                }`}
              >
                Exclusief btw
              </span>

              <ul className="flex flex-col gap-2.5 mt-6 mb-8 p-0 list-none flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm font-medium">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        plan.popular ? 'bg-amber-400 text-stone-900' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span className={plan.popular ? 'text-stone-200' : 'text-stone-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => onStart(plan.id)}
                  className={`h-13 py-3.5 px-6 rounded-full font-extrabold text-sm cursor-pointer transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-amber-400 hover:bg-amber-300 text-stone-900'
                      : 'bg-stone-900 hover:bg-stone-800 text-white'
                  }`}
                >
                  Start met {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#presets"
                  className={`h-11 px-6 rounded-full font-bold text-sm flex items-center justify-center border-2 transition-colors ${
                    plan.popular
                      ? 'border-stone-700 text-stone-200 hover:border-stone-500'
                      : 'border-stone-300 text-stone-700 hover:border-stone-500'
                  }`}
                >
                  Bekijk een demo
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Optional monthly service strip */}
        <div className="rounded-3xl border-2 border-dashed border-stone-300 bg-stone-50 p-7 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 flex flex-col gap-1">
            <span className="font-mono text-xs font-bold tracking-widest text-stone-500 uppercase flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Optioneel
            </span>
            <h3 className="text-2xl font-black text-stone-900 m-0">
              Service &amp; hosting
            </h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-stone-900 tabular-nums">
                {formatPrice(25)}
              </span>
              <span className="text-sm font-semibold text-stone-500">
                per maand, excl. btw
              </span>
            </div>
          </div>
          <ul className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-0 m-0 list-none">
            {SERVICE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm font-medium text-stone-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
                {feature}
              </li>
            ))}
          </ul>
          <div className="lg:col-span-3 flex lg:justify-end">
            <button
              onClick={() => onStart()}
              className="h-12 px-6 rounded-full border-2 border-stone-900 bg-white hover:bg-stone-900 hover:text-white text-stone-900 font-bold text-sm cursor-pointer transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Vraag het aan
            </button>
          </div>
        </div>

        {/* Ownership banner */}
        <div className="rounded-3xl bg-stone-900 text-white p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <span className="w-14 h-14 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </span>
          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="text-xl sm:text-2xl font-black m-0">
              Jij bent eigenaar van je website én de code.
            </h3>
            <p className="text-stone-300 text-sm sm:text-base m-0 leading-relaxed">
              Geen vendor lock-in. Je domein, je foto’s en je code blijven van
              jou. Stop je met de service? Dan leveren we de complete site op,
              zodat je hem altijd kunt meenemen naar een andere partij.
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-400 m-0 text-center">
          Alle eenmalige bedragen zijn exclusief btw. De maandelijkse service
          van € 25 is exclusief btw en maandelijks opzegbaar. Je complete
          website wordt binnen 2 weken opgeleverd.
        </p>
      </div>
    </section>
  );
};
