import React, { useState } from 'react';
import type { ActiveSiteData, FaqItem } from '../types';

interface FaqSectionProps {
  faqs?: FaqItem[];
  title?: string;
  subtitle?: string;
  /** Palette of the generated site this section renders on. Without it the
   *  heading falls back to the fixed stone theme of the marketing pages. */
  site?: ActiveSiteData;
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
    a: 'Ja. In je eigen site-editor zet je diensten aan of uit, schrijf je teksten van jezelf en kies je welke onderdelen op je site staan. De website staat meteen voor je klaar, zonder wachttijd.',
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
  site,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 scroll-mt-20">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <span
            className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase"
            style={site ? { color: site.muted } : undefined}
          >
            Goed om te weten
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 m-0"
            style={site ? { color: site.fg } : undefined}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-stone-600 text-base sm:text-lg m-0"
              style={site ? { color: site.muted } : undefined}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const hiddenOnMobile = idx >= 3 && !showAll;

            return (
              <div
                key={idx}
                className={`${
                  hiddenOnMobile ? 'hidden sm:block' : 'block'
                } border border-stone-200 rounded-2xl bg-white overflow-hidden transition-all duration-200`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left border-0 bg-transparent cursor-pointer flex justify-between items-center gap-4 font-bold text-base sm:text-lg text-stone-900"
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
                    className="px-5 sm:px-6 pb-5 sm:pb-6 text-stone-600 text-base leading-relaxed border-t border-stone-100 pt-4"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {faqs.length > 3 && !showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="sm:hidden self-center min-h-11 px-5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm cursor-pointer inline-flex items-center gap-2"
          >
            Toon alle {faqs.length} vragen →
          </button>
        )}
      </div>
    </section>
  );
};
