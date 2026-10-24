import React, { useState } from 'react';
import { Phone, MessageCircle, Siren, Clock } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import { buildSiteTelUrl, buildSiteWhatsAppUrl, buildEmergencyMessage } from '../../utils/contact';

const EMERGENCY_PROBLEMS = [
  'Waterlekkage',
  'Verstopping',
  'Cv-ketel storing',
  'Gaslucht',
];

interface EmergencyButtonProps {
  site: ActiveSiteData;
}

/**
 * Loodgieter: 24/7 spoedknop. Visitors pick their problem and get a
 * one-tap call or a prefilled WhatsApp emergency message.
 */
export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ site }) => {
  const [problem, setProblem] = useState(EMERGENCY_PROBLEMS[0]);
  const waUrl = buildSiteWhatsAppUrl(
    site.contactPhone,
    buildEmergencyMessage(site.biz, problem)
  );

  return (
    <section
      id="spoed"
      className="scroll-mt-24 bg-red-600 text-white"
      aria-label="24/7 spoedservice"
    >
      <div className="max-w-7xl mx-auto py-10 sm:py-20 px-4 sm:px-8 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 items-center">
        <div className="lg:col-span-7 flex flex-col gap-5">
          <span className="inline-flex items-center gap-2 self-start h-9 px-4 rounded-full bg-white/15 backdrop-blur-sm font-mono text-xs font-bold tracking-widest uppercase">
            <Siren className="w-4 h-4" />
            24/7 spoedservice
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Lekkage of storing? Wacht niet, bel direct.
          </h2>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed m-0 max-w-xl">
            Dag en nacht bereikbaar voor acute problemen in {site.city} en
            omstreken. {site.owner.split(' ')[0]} is gemiddeld binnen 45
            minuten ter plaatse, ook in het weekend.
          </p>

          <div className="flex items-center gap-2 text-sm font-semibold text-white/95">
            <Clock className="w-4 h-4 shrink-0" />
            Gemiddelde aanrijdtijd: 45 minuten · géén torenhoge spoedtoeslag
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {EMERGENCY_PROBLEMS.map((p) => {
              const isSelected = p === problem;
              return (
                <button
                  key={p}
                  onClick={() => setProblem(p)}
                  className={`h-10 px-4 rounded-full border-2 text-sm font-bold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white text-red-700 border-white shadow-md'
                      : 'bg-transparent text-white border-white/50 hover:border-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white text-stone-900 p-7 sm:p-8 flex flex-col gap-4 shadow-2xl rounded-3xl">
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-stone-500">
            Direct contact bij spoed
          </span>
          <a
            href={buildSiteTelUrl(site.contactPhone)}
            className="h-15 py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
          >
            <Phone className="w-5 h-5" />
            Bel {site.phone}
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="h-15 py-4 px-6 rounded-2xl bg-[#25D366] hover:brightness-95 text-stone-950 font-extrabold text-lg flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp: {problem}
          </a>
          <p className="text-xs text-stone-500 leading-relaxed m-0 text-center">
            Kies je probleem hierboven; je WhatsApp-bericht staat meteen
            klaar met de juiste spoedinformatie.
          </p>
        </div>
      </div>
    </section>
  );
};
