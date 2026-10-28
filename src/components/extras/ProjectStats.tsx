import React from 'react';
import type { ActiveSiteData, ProjectStatsContent } from '../../types';

export interface ProjectStatsProps {
  site: ActiveSiteData;
  content: ProjectStatsContent;
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ site, content }) => {
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
      {content.stats.map((stat) => (
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
