import type { SectorId } from '../types';

/**
 * De stappen van een project, per vak.
 *
 * De tekst stond eerst in het component, waardoor alleen de timmerman een
 * tijdlijn had. Nu staat hij in de gegevens: elk vak kan zijn eigen
 * stappen hebben, met zijn eigen woorden en zijn eigen planning.
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

/** The timeline of one trade: a title, a line and the steps. */
export interface SectorTimeline {
  /** The headline above the steps. */
  title: string;
  /** The line under the headline. */
  lead: string;
  /** The steps themselves. */
  steps: TimelineStep[];
}

/**
 * The timelines per trade. Only the trades whose tool is the timeline show
 * one: the steps are promises, and a promise that does not apply is a lie.
 */
export const TIMELINES: Partial<Record<SectorId, SectorTimeline>> = {
  timmerman: {
    title: 'Van aanvraag tot oplevering in 2 weken.',
    lead: 'Johan houdt je tijdens elke stap op de hoogte — geen verrassingen, geen stilte.',
    steps: [
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
  },
  aannemer: {
    title: 'Van de eerste scheppen spade tot de sleutel.',
    lead: 'Ruben houdt je elke week op de hoogte, met foto’s van het werk en de planning erbij.',
    steps: [
      {
        icon: 'calendar',
        day: 'Week 1',
        title: 'Opname & bouwkundig beoordelen',
        description:
          'We lopen de woning door, bekijken de constructie en bespreken wat je wilt. Kosteloos en vrijblijvend.',
      },
      {
        icon: 'check',
        day: 'Week 2',
        title: 'Ontwerp, vergunningen & vaste prijs',
        description:
          'Je krijgt de tekening, de vergunningen en een prijs per werkzaamheid. Pas als dat klopt, gaan we bouwen.',
      },
      {
        icon: 'hammer',
        day: 'Week 3 – 4',
        title: 'Casco: fundering, muren en dak',
        description:
          'De ruwe bouw: fundering, wanden, begane dak en de eerste installaties. De woning staat er.',
      },
      {
        icon: 'paint',
        day: 'Week 5 – 7',
        title: 'Installaties & afwerking',
        description:
          'Elektra, water en verwarming, daarna stucwerk, vloeren en schilderwerk. We werken ruimte per ruimte af.',
      },
      {
        icon: 'truck',
        day: 'Week 8 – 10',
        title: 'Oplevering & opleverdocument',
        description:
          'Alles wordt doorgenomen en opgeleverd met de bijbehorende documenten, garantiemeldingen en het adresboekje.',
      },
    ],
  },
};

/**
 * The generic route, for a trade that gets the timeline without having its
 * own steps yet. A site never breaks because a step is missing.
 */
export const DEFAULT_TIMELINE: SectorTimeline = {
  title: 'Van aanvraag tot oplevering.',
  lead: 'Je houdt contact op de hoogte — geen verrassingen, geen stilte.',
  steps: [
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
  ],
};

/** The timeline of a trade, with the generic route as a fallback. */
export function timelineFor(sector: SectorId): SectorTimeline {
  return TIMELINES[sector] ?? DEFAULT_TIMELINE;
}
