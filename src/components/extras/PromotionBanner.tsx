import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ActiveSiteData, PromotionContent } from '../../types';

export interface PromotionBannerProps {
  site: ActiveSiteData;
  content: PromotionContent;
}

export const PromotionBanner: React.FC<PromotionBannerProps> = ({ site, content }) => {
  return (
    <aside
      className="relative w-full overflow-hidden p-6 sm:p-8 lg:p-10"
      style={{
        background: site.accent,
        color: site.onAccent,
        borderRadius: site.radiusLg,
      }}
      aria-label="Slimmer klussen plannen"
    >
      <div
        className="absolute -right-16 -top-24 w-64 h-64 rounded-full border-[40px] opacity-10 pointer-events-none"
        style={{ borderColor: site.onAccent }}
      />
      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-7 items-end">
        <div className="flex flex-col gap-4 max-w-2xl">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-85">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Slimmer plannen
          </span>
          <h3
            className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0"
            style={{ fontFamily: site.display, fontWeight: site.dw, letterSpacing: site.ls }}
          >
            {content.title}
          </h3>
          <p className="text-sm sm:text-base leading-relaxed m-0 opacity-90">{content.description}</p>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <a
            href="#prijs"
            className="h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold whitespace-nowrap shadow-sm"
            style={{
              background: site.bg,
              color: site.fg,
              borderRadius: site.radius,
            }}
          >
            {content.cta}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
          <span className="text-xs font-semibold opacity-80">Vrijblijvend · duidelijke prijs vooraf</span>
        </div>
      </div>
    </aside>
  );
};
