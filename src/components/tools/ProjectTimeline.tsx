import React, { useState } from 'react';
import { CalendarDays, Hammer, ClipboardCheck, Truck, PaintRoller, Leaf } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import { timelineFor, type TimelineIcon } from '../../data/timeline';

interface ProjectTimelineProps {
  site: ActiveSiteData;
}

/**
 * The icon of a step. The name of the icon stands in the data, the drawing
 * itself stays here.
 */
const ICONS: Record<TimelineIcon, React.ComponentType<{ className?: string }>> = {
  calendar: CalendarDays,
  check: ClipboardCheck,
  hammer: Hammer,
  truck: Truck,
  paint: PaintRoller,
  leaf: Leaf,
};

/**
 * Timmerman: projecttijdlijn. Makes the two-week delivery promise
 * concrete and shows exactly what happens after the first contact.
 */
export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ site }) => {
  const [showAll, setShowAll] = useState(false);
  // De titel, de toelichting en de stappen komen uit de gegevens van het
  // vak, niet uit dit component.
  const timeline = timelineFor(site.id);
  const steps = timeline.steps;

  return (
    <section
      id="tijdlijn"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-semibold tracking-wider uppercase text-stone-500">
              Projecttijdlijn
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                letterSpacing: site.ls,
              }}
            >
              {timeline.title}
            </h2>
          </div>
          <span className="text-sm font-medium text-stone-500 max-w-xs">{timeline.lead}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const Icon = ICONS[step.icon] ?? CalendarDays;
            return (
              <div
                key={step.day}
                className={`${
                  idx >= 2 && !showAll ? 'hidden sm:flex' : 'flex'
                } relative border p-6 flex-col gap-3 shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300`}
                style={{
                  background: site.card,
                  borderColor: site.line,
                  borderRadius: site.radiusLg,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: site.soft,
                      color: site.accentText,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: site.muted }}
                  >
                    0{idx + 1}
                  </span>
                </div>
                <span
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: site.accentText }}
                >
                  {step.day}
                </span>
                <h3
                  className="text-lg font-bold leading-tight m-0"
                  style={{
                    fontFamily: site.display,
                    fontWeight: site.dw,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed m-0"
                  style={{ color: site.muted }}
                >
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {!showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="sm:hidden self-start min-h-11 px-5 border font-bold text-sm cursor-pointer inline-flex items-center gap-2"
            style={{
              background: site.card,
              borderColor: site.line,
              color: site.fg,
              borderRadius: site.radius,
            }}
          >
            Toon alle {steps.length} stappen →
          </button>
        )}
      </div>
    </section>
  );
};
