import React from 'react';
import { ArrowRight, BadgeCheck, MapPin } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

export interface TeamMemberCardProps {
  site: ActiveSiteData;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ site }) => {
  const ownerFirst = site.owner.split(' ')[0];

  return (
    <article
      className="w-full grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] overflow-hidden border"
      style={{
        background: site.card,
        borderColor: site.line,
        borderRadius: site.radiusLg,
        color: site.fg,
      }}
    >
      <div className="h-56 sm:h-auto sm:min-h-72" style={{ background: site.soft }}>
        <ImageWithFallback
          src={site.img.hero}
          alt={`${site.owner} van ${site.biz}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: site.accentText }}
          >
            Jouw vaste aanspreekpunt
          </span>
          <h3
            className="text-3xl font-bold tracking-tight m-0"
            style={{ fontFamily: site.display, fontWeight: site.dw }}
          >
            {site.owner}
          </h3>
          <p className="text-sm font-semibold m-0" style={{ color: site.muted }}>
            Vakman & eigenaar van {site.biz}
          </p>
        </div>

        <p className="text-sm sm:text-base leading-relaxed m-0" style={{ color: site.muted }}>
          “Ik denk vanaf het eerste gesprek met je mee en blijf zelf betrokken tot de klus netjes is opgeleverd.”
        </p>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
          <span className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" style={{ color: site.accentText }} aria-hidden="true" />
            Vakman sinds {site.since}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: site.accentText }} aria-hidden="true" />
            {site.city} en omgeving
          </span>
        </div>

        <a
          href="#contact"
          className="self-start h-11 px-5 flex items-center gap-2 text-sm font-bold border mt-auto"
          style={{
            borderColor: site.line,
            color: site.fg,
            borderRadius: site.radius,
          }}
        >
          Maak kennis met {ownerFirst}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
};
