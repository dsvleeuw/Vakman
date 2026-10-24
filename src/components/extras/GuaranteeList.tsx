import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ActiveSiteData } from '../../types';

export interface GuaranteeItem {
  title: string;
  description: string;
}

export interface GuaranteeListProps {
  site: ActiveSiteData;
  items?: GuaranteeItem[];
}

const DEFAULT_GUARANTEES: GuaranteeItem[] = [
  { title: 'Duidelijke prijs vooraf', description: 'Je weet waar je aan toe bent voordat we starten.' },
  { title: 'Garantie op vakwerk', description: 'We staan achter de kwaliteit van de oplevering.' },
  { title: 'Netjes opgeleverd', description: 'Een schone werkplek en zorg voor jouw eigendommen.' },
  { title: 'Persoonlijk contact', description: 'Eén vast aanspreekpunt tijdens de hele klus.' },
];

export const GuaranteeList: React.FC<GuaranteeListProps> = ({
  site,
  items = DEFAULT_GUARANTEES,
}) => {
  return (
    <section
      className="w-full p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8"
      style={{
        background: site.invBg,
        color: site.invFg,
        borderRadius: site.radiusLg,
      }}
      aria-label="Onze garanties"
    >
      <div className="flex flex-col gap-4">
        <span
          className="w-12 h-12 flex items-center justify-center"
          style={{
            background: site.hi,
            color: site.onHi,
            borderRadius: site.radiusSm,
          }}
        >
          <ShieldCheck className="w-6 h-6" aria-hidden="true" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: site.invMuted }}>
          Onze belofte
        </span>
        <h3
          className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0"
          style={{ fontFamily: site.display, fontWeight: site.dw, letterSpacing: site.ls }}
        >
          Goed werk. Ook achteraf geregeld.
        </h3>
        <p className="text-sm leading-relaxed m-0" style={{ color: site.invMuted }}>
          Geen kleine lettertjes, maar concrete afspraken waar je op kunt vertrouwen.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="p-5 border flex flex-col gap-3"
            style={{ borderColor: site.invLine, borderRadius: site.radius }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: site.hi }} aria-hidden="true" />
            <h4 className="font-bold text-base m-0">{item.title}</h4>
            <p className="text-xs sm:text-sm leading-relaxed m-0" style={{ color: site.invMuted }}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
