import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Leaf,
  MapPin,
  ShieldCheck,
  Star,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { ActiveSiteData, TrustBarContent, TrustIcon } from '../../types';

export interface TrustBarProps {
  site: ActiveSiteData;
  content: TrustBarContent;
}

const ICONS: Record<TrustIcon, LucideIcon> = {
  shield: ShieldCheck,
  clock: Clock,
  pin: MapPin,
  star: Star,
  check: CheckCircle2,
  award: Award,
  leaf: Leaf,
  tool: Wrench,
};

export const TrustBar: React.FC<TrustBarProps> = ({ site, content }) => {
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
        {content.items.map(({ icon, title, text }) => {
          const Icon = ICONS[icon] ?? ShieldCheck;
          return (
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
          );
        })}
      </div>
    </section>
  );
};
