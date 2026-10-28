import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { ActiveSiteData, ServiceAreasContent } from '../../types';

export interface ServiceAreaChipsProps {
  site: ActiveSiteData;
  content: ServiceAreasContent;
}

export const ServiceAreaChips: React.FC<ServiceAreaChipsProps> = ({ site, content }) => {
  const visibleAreas = content.areas.slice(0, 9);

  return (
    <section
      className="w-full p-6 sm:p-8 border flex flex-col gap-6"
      style={{
        background: site.card,
        borderColor: site.line,
        borderRadius: site.radiusLg,
        color: site.fg,
      }}
      aria-label="Werkgebied"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="w-11 h-11 flex items-center justify-center shrink-0"
            style={{
              background: site.soft,
              color: site.accentText,
              borderRadius: site.radiusSm,
            }}
          >
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider m-0 mb-1" style={{ color: site.muted }}>
              Dichtbij en snel ter plaatse
            </p>
            <h3
              className="text-2xl sm:text-3xl font-bold tracking-tight m-0"
              style={{ fontFamily: site.display, fontWeight: site.dw }}
            >
              Actief in {site.city} en omgeving
            </h3>
          </div>
        </div>
        <span
          className="self-start px-3 h-8 flex items-center text-xs font-bold whitespace-nowrap"
          style={{ background: site.soft, color: site.accentText, borderRadius: site.radius }}
        >
          ± 25 km
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {visibleAreas.map((area) => (
          <span
            key={area}
            className="h-10 px-4 inline-flex items-center gap-2 text-sm font-semibold border"
            style={{
              background: site.soft,
              borderColor: site.line,
              borderRadius: site.radius,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: site.accent }} />
            {area}
          </span>
        ))}
      </div>

      <a
        href="#gebied"
        className="self-start flex items-center gap-2 text-sm font-bold hover:opacity-75"
        style={{ color: site.accentText }}
      >
        Controleer jouw postcode
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </section>
  );
};
