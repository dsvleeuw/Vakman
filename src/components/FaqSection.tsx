import React, { useState } from 'react';
import type { FaqItem } from '../types';

interface FaqSectionProps {
  faqs?: FaqItem[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    q: 'Hoe snel staat mijn website online?',
    a: 'Binnen 15 minuten. Je kiest je vak, vult je bedrijfsnaam, telefoonnummer en werkgebied in en je site is direct bereikbaar met een eigen .nl domeinnaam.',
  },
  {
    q: 'Hoe komen offerteaanvragen en afspraken binnen?',
    a: 'Aanvragen komen rechtstreeks op je mobiel binnen via WhatsApp of e-mail. Je kunt afspraken bovendien direct laten synchroniseren met je Google Calendar.',
  },
  {
    q: 'Kan ik de prijzen en diensten later aanpassen?',
    a: 'Ja, absoluut. Via het Klusbaas-dashboard kun je op elk moment diensten toevoegen, tarieven wijzigen of nieuwe werkfoto’s uploaden.',
  },
  {
    q: 'Heb ik een KvK-nummer nodig om te starten?',
    a: 'Nee, je kunt alvast starten en je concept-website inrichten. Zodra je officieel start vul je je KvK-nummer in voor de vermelding in de footer.',
  },
  {
    q: 'Kan ik offertes automatisch opslaan in Google Drive?',
    a: 'Ja! Als je inlogt met je Google-account worden alle berekende offerteoverzichten automatisch als tekst/PDF opgeslagen in jouw Google Drive.',
  },
];

export const FaqSection: React.FC<FaqSectionProps> = ({
  faqs = DEFAULT_FAQS,
  title = 'Veelgestelde vragen',
  subtitle = 'Alles wat je wilt weten over Klusbaas websites en afspraken.',
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
            FAQ & HEBDEN
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 m-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-stone-600 text-base sm:text-lg m-0">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="border border-stone-200 rounded-2xl bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left border-0 bg-transparent cursor-pointer flex justify-between items-center gap-4 font-bold text-lg text-stone-900"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 font-mono text-sm">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-stone-600 text-base leading-relaxed border-t border-stone-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
