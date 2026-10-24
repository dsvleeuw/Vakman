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
    a: 'Je concept staat binnen 15 minuten online: je kiest je vak, vult je bedrijfsnaam, telefoonnummer en werkgebied in en je site is direct bereikbaar met een eigen .nl-domeinnaam. De complete oplevering, inclusief controle van teksten, foto’s en vindbaarheid, volgt binnen 2 werkweken.',
  },
  {
    q: 'Wat kost een website bij Klusbaas?',
    a: 'Er zijn drie eenmalige pakketten van € 595, € 995 en € 1.795, allemaal exclusief btw. Daarna is er een optionele service voor hosting, updates en support van € 25 per maand (excl. btw), die maandelijks opzegbaar is.',
  },
  {
    q: 'Ben ik eigenaar van mijn website?',
    a: 'Ja, volledig. Jij blijft eigenaar van de website, de code, je domeinnaam en je foto’s. Er is geen vendor lock-in: stop je met de service, dan leveren we de complete site op zodat je hem kunt meenemen naar een andere partij.',
  },
  {
    q: 'Hoe komen offerteaanvragen en afspraken binnen?',
    a: 'WhatsApp is het belangrijkste kanaal: aanvragen komen met een vooringevuld bericht rechtstreeks op je mobiel binnen, en er is altijd een kort contactformulier als alternatief. Afspraken kun je bovendien direct laten synchroniseren met je Google Calendar.',
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
  {
    q: 'Kan ik de maandelijkse service opzeggen?',
    a: 'Ja, de service van € 25 per maand is maandelijks opzegbaar. Je website blijft daarna van jou; we leveren desnoods de complete code en je domeinnaam op, zonder opzegboete.',
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
            Goed om te weten
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
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                >
                  <span>{faq.q}</span>
                  <span
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 font-mono text-sm"
                    aria-hidden="true"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-question-${idx}`}
                    className="px-6 pb-6 text-stone-600 text-base leading-relaxed border-t border-stone-100 pt-4"
                  >
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
