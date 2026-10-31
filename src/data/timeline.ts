import type { SectorId } from '../types';

/**
 * De stappen van een project, per vak.
 *
 * De tekst stond eerst in het component, waardoor alleen de timmerman een
 * tijdlijn had. Nu staat hij in de gegevens: elk vak kan zijn eigen
 * stappen hebben, met zijn eigen woorden. De belofte in de pakketten
 * ("binnen twee weken") blijft hetzelfde, de route ernaartoe verschilt per
 * vak.
 */

/** Het icoon bij een stap. De tekening zelf blijft in het component. */
export type TimelineIcon = 'calendar' | 'check' | 'hammer' | 'truck' | 'paint' | 'leaf';

export interface TimelineStep {
  /** Which icon belongs to this step. */
  icon: TimelineIcon;
  /** When this step happens, in the words of the trade. */
  day: string;
  /** The name of the step. */
  title: string;
  /** What happens in this step. */
  description: string;
}

/**
 * The steps per trade. Only the trades whose tool is the timeline show one:
 * the steps are promises, and a promise that does not apply is a lie.
 */
export const TIMELINES: Partial<Record<SectorId, TimelineStep[]>> = {
  timmerman: [
    {
      icon: 'calendar',
      day: 'Dag 1 – 2',
      title: 'Intake & inmeten',
      description:
        'Gratis bezoek op locatie. We nemen de wensen door en meten alles tot op de millimeter in.',
    },
    {
      icon: 'check',
      day: 'Dag 3 – 5',
      title: 'Vaste offerte & bestelling',
      description:
        'Je ontvangt een heldere offerte met vaste prijs. Na akkoord bestellen we het hout en beslag.',
    },
    {
      icon: 'hammer',
      day: 'Dag 6 – 9',
      title: 'Productie & montage',
      description:
        'Het maatwerk wordt in de werkplaats gemaakt en vervolgens bij jou thuis gemonteerd.',
    },
    {
      icon: 'truck',
      day: 'Dag 10 – 14',
      title: 'Oplevering & controle',
      description:
        'Samen lopen we alles na. Pas als jij tevreden bent, gelden we de klus als opgeleverd.',
    },
  ],
};

/**
 * The steps of a trade. A trade without its own steps gets the generic
 * route, so a site never breaks because a step is missing.
 */
export function timelineSteps(sector: SectorId): TimelineStep[] {
  return (
    TIMELINES[sector] ?? [
      {
        icon: 'calendar',
        day: 'Dag 1 – 2',
        title: 'Kennen & opnemen',
        description: 'We bekijken de klus, luisteren naar wat jij wilt en meten alles wat nodig is.',
      },
      {
        icon: 'check',
        day: 'Dag 3 – 5',
        title: 'Vaste offerte',
        description: 'Je krijgt een offerte met een vaste prijs. Pas bij akkoord gaan we aan het werk.',
      },
      {
        icon: 'hammer',
        day: 'Dag 6 – 9',
        title: 'Uitvoeren',
        description: 'We voeren het werk uit met aandacht voor je woning en voor de afwerking.',
      },
      {
        icon: 'truck',
        day: 'Dag 10 – 14',
        title: 'Opleveren',
        description: 'We lopen alles samen na. Jij hoeft alleen te zeggen of het goed is.',
      },
    ]
  );
}
