import React from 'react';
import { ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import type { ActiveSiteData, AvailabilityContent } from '../../types';

export interface AvailabilityCardProps {
  site: ActiveSiteData;
  content: AvailabilityContent;
  bookingHref?: string;
}

export const AvailabilityCard: React.FC<AvailabilityCardProps> = ({
  site,
  content,
  bookingHref = '#afspraak',
}) => {
  return (
    <article
      className="w-full p-6 sm:p-8 border flex flex-col gap-6"
      style={{
        background: site.soft,
        borderColor: site.line,
        borderRadius: site.radiusLg,
        color: site.fg,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: site.accentText }}
        >
          Beschikbaarheid
        </span>
        <Calendar className="w-5 h-5" style={{ color: site.accentText }} aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm m-0" style={{ color: site.muted }}>
          Eerstvolgende mogelijkheid
        </p>
        <h3
          className="text-4xl sm:text-5xl font-black tracking-tight leading-none m-0"
          style={{ fontFamily: site.display, fontWeight: site.dw, letterSpacing: site.ls }}
        >
          {content.next}
        </h3>
        <p className="text-sm sm:text-base leading-relaxed m-0" style={{ color: site.muted }}>
          Plan vrijblijvend een opname of adviesgesprek voor jouw klus.
        </p>
      </div>

      <ul className="flex flex-col gap-2.5 m-0 p-0 list-none">
        {content.promises.map((promise) => (
          <li key={promise} className="flex items-center gap-2.5 text-sm font-semibold">
            <CheckCircle2
              className="w-4 h-4 shrink-0"
              style={{ color: site.accentText }}
              aria-hidden="true"
            />
            {promise}
          </li>
        ))}
      </ul>

      <a
        href={bookingHref}
        className="h-12 px-5 flex items-center justify-center gap-2 text-sm font-bold mt-auto"
        style={{
          background: site.accent,
          color: site.onAccent,
          borderRadius: site.radius,
        }}
      >
        Bekijk de mogelijkheden
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </a>
    </article>
  );
};
