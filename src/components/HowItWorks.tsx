import React from 'react';
import { SECTORS, STYLES } from '../data/tradesData';

interface HowItWorksProps {
  onStart: () => void;
}

/**
 * The three steps on the page: what the customer does, in plain words.
 *
 * These are promises. The site goes live right away, on its own address;
 * an own `.nl` domain is registered per order, not at the click of a
 * button.
 */
export const STEPS = [
  {
    n: '01',
    t: 'Kies je vak en stijl',
    d: `${Object.keys(SECTORS).length} vakken, elk met ${STYLES.length} stijlen. Diensten, prijzen en foto’s staan meteen klaar.`,
  },
  {
    n: '02',
    t: 'Vul je gegevens in',
    d: 'Je bedrijfsnaam, telefoonnummer en werkgebied. Dat doe je gewoon op je smartphone in 2 minuten.',
  },
  {
    n: '03',
    t: 'Direct online',
    d: 'Je site staat meteen online, op een eigen adres en met je eigen telefoonnummer. Aanvragen komen binnen per mail of via WhatsApp.',
  },
];

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStart }) => {
  return (
    <section
      id="hoe-het-werkt"
      className="bg-stone-900 text-stone-100 py-16 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <span className="font-mono text-xs font-semibold tracking-wider text-stone-400 uppercase">
            GEEN PROGRAMMEUR NODIG
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-xl m-0">
            Geen computergedoe. Gewoon online.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((st) => (
            <div
              key={st.n}
              className="border border-stone-700/80 rounded-2xl p-7 flex flex-col gap-3 bg-stone-800/40 hover:bg-stone-800/80 transition-all duration-300 hover:-translate-y-1"
            >
              <span className="font-mono text-xs font-bold text-amber-400">
                {st.n}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight m-0 text-white">
                {st.t}
              </h3>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed m-0">
                {st.d}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <button
            onClick={onStart}
            className="h-14 px-8 rounded-full border-0 bg-white hover:bg-stone-100 text-stone-900 text-base font-extrabold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md"
          >
            Start je website →
          </button>
        </div>
      </div>
    </section>
  );
};
