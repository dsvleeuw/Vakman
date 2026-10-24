import React from 'react';
import { CalendarDays, Hammer, ClipboardCheck, Truck } from 'lucide-react';
import type { ActiveSiteData } from '../../types';

interface ProjectTimelineProps {
  site: ActiveSiteData;
}

const TIMELINE_STEPS = [
  {
    icon: CalendarDays,
    day: 'Dag 1 – 2',
    title: 'Intake & inmeten',
    description:
      'Gratis bezoek op locatie. We nemen de wensen door en meten alles tot op de millimeter in.',
  },
  {
    icon: ClipboardCheck,
    day: 'Dag 3 – 5',
    title: 'Vaste offerte & bestelling',
    description:
      'Je ontvangt een heldere offerte met vaste prijs. Na akkoord bestellen we het hout en beslag.',
  },
  {
    icon: Hammer,
    day: 'Dag 6 – 9',
    title: 'Productie & montage',
    description:
      'Het maatwerk wordt in de werkplaats gemaakt en vervolgens bij jou thuis gemonteerd.',
  },
  {
    icon: Truck,
    day: 'Dag 10 – 14',
    title: 'Oplevering & controle',
    description:
      'Samen lopen we alles na. Pas als jij tevreden bent, gelden we de klus als opgeleverd.',
  },
];

/**
 * Timmerman: projecttijdlijn. Makes the two-week delivery promise
 * concrete and shows exactly what happens after the first contact.
 */
export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ site }) => {
  return (
    <section
      id="tijdlijn"
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
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
              Van aanvraag tot oplevering in 2 weken.
            </h2>
          </div>
          <span className="text-sm font-medium text-stone-500 max-w-xs">
            {site.owner.split(' ')[0]} houdt je tijdens elke stap op de hoogte —
            geen verrassingen, geen stilte.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.day}
                className="relative border p-6 flex flex-col gap-3 shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
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
      </div>
    </section>
  );
};
