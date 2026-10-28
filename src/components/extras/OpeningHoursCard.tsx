import React from 'react';
import { Clock, MessageCircle, Phone } from 'lucide-react';
import type { ActiveSiteData, OpeningHoursContent } from '../../types';
import {
  buildSiteTelUrl,
  buildSiteWhatsAppUrl,
  canShowContactButtons,
} from '../../utils/contact';

export interface OpeningHoursCardProps {
  site: ActiveSiteData;
  content: OpeningHoursContent;
}

export const OpeningHoursCard: React.FC<OpeningHoursCardProps> = ({ site, content }) => {
  const whatsAppUrl = buildSiteWhatsAppUrl(
    site.contactPhone,
    `Hallo ${site.biz}, ik wil graag een afspraak maken.`
  );

  return (
    <article
      className="w-full p-6 sm:p-8 border flex flex-col gap-6"
      style={{
        background: site.card,
        borderColor: site.line,
        borderRadius: site.radiusLg,
        color: site.fg,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 flex items-center justify-center shrink-0"
            style={{
              background: site.soft,
              color: site.accentText,
              borderRadius: site.radiusSm,
            }}
          >
            <Clock className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider m-0" style={{ color: site.muted }}>
              Bereikbaarheid
            </p>
            <h3
              className="text-2xl font-bold tracking-tight m-0"
              style={{ fontFamily: site.display, fontWeight: site.dw }}
            >
              Openingstijden
            </h3>
          </div>
        </div>
        <span
          className="hidden sm:flex items-center gap-2 px-3 h-8 text-xs font-bold whitespace-nowrap"
          style={{
            background: site.soft,
            color: site.accentText,
            borderRadius: site.radius,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Appen kan altijd
        </span>
      </div>

      <div className="flex flex-col">
        {content.hours.map((hour, index) => (
          <div
            key={hour.days}
            className="py-3.5 flex items-center justify-between gap-4 text-sm"
            style={{ borderTop: index === 0 ? 'none' : `1px solid ${site.line}` }}
          >
            <span style={{ color: site.muted }}>{hour.days}</span>
            <strong className="text-right whitespace-nowrap">{hour.time}</strong>
          </div>
        ))}
      </div>

      <p className="text-sm leading-relaxed m-0" style={{ color: site.muted }}>
        {content.note}
      </p>

      {canShowContactButtons(site) && (
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={buildSiteTelUrl(site.contactPhone)}
            className="h-12 px-5 flex items-center justify-center gap-2 text-sm font-bold"
            style={{
              background: site.accent,
              color: site.onAccent,
              borderRadius: site.radius,
            }}
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            Bel {site.phone}
          </a>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-5 flex items-center justify-center gap-2 text-sm font-bold border"
            style={{
              borderColor: site.line,
              color: site.fg,
              borderRadius: site.radius,
            }}
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Stuur een bericht
          </a>
        </div>
      )}
    </article>
  );
};
