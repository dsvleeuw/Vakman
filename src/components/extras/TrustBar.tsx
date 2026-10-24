import React from 'react';
import { Clock, MapPin, ShieldCheck, Star } from 'lucide-react';
import type { ActiveSiteData } from '../../types';

export interface TrustBarProps {
  site: ActiveSiteData;
}

export const TrustBar: React.FC<TrustBarProps> = ({ site }) => {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Verzekerd & gecertificeerd',
      text: 'Vakwerk zonder verrassingen',
    },
    {
      icon: Clock,
      title: 'Snelle reactie',
      text: 'Meestal binnen één uur antwoord',
    },
    {
      icon: MapPin,
      title: `Actief in ${site.city}`,
      text: 'Ook in de omliggende regio',
    },
    {
      icon: Star,
      title: `${site.rating} uit 5`,
      text: `${site.reviewCount} klantbeoordelingen`,
    },
  ];

  return (
    <section aria-label="Vertrouwen en service" className="w-full">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden border"
        style={{
          background: site.line,
          borderColor: site.line,
          borderRadius: site.radiusLg,
        }}
      >
        {items.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="flex items-start gap-3.5 p-5 sm:p-6"
            style={{ background: site.card, color: site.fg }}
          >
            <span
              className="w-10 h-10 flex items-center justify-center shrink-0"
              style={{
                background: site.soft,
                color: site.accentText,
                borderRadius: site.radiusSm,
              }}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-1">
              <strong className="text-sm leading-snug">{title}</strong>
              <span className="text-xs leading-relaxed" style={{ color: site.muted }}>
                {text}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
