import React from 'react';
import type { ActiveSiteData } from '../../types';

export interface ProjectStat {
  value: string;
  label: string;
}

export interface ProjectStatsProps {
  site: ActiveSiteData;
  stats?: ProjectStat[];
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ site, stats }) => {
  const visibleStats = stats ?? [
    { value: site.since, label: 'Actief als vakman sinds' },
    { value: `${site.reviewCount}`, label: 'Klantbeoordelingen' },
    { value: site.rating, label: 'Gemiddeld cijfer' },
    { value: '25 km', label: `Werkgebied rond ${site.city}` },
  ];

  return (
    <section
      className="w-full grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden"
      style={{
        background: site.invLine,
        color: site.bg,
        borderRadius: site.radiusLg,
      }}
      aria-label="Cijfers en ervaring"
    >
      {visibleStats.map((stat) => (
        <div
          key={stat.label}
          className="p-5 sm:p-7 flex flex-col gap-2"
          style={{ background: site.fg }}
        >
          <strong
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none tabular-nums"
            style={{ fontFamily: site.display, fontWeight: site.dw, letterSpacing: site.ls }}
          >
            {stat.value}
          </strong>
          <span className="text-xs sm:text-sm leading-snug opacity-75">{stat.label}</span>
        </div>
      ))}
    </section>
  );
};
