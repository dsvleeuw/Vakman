import type {
  BlockContentMap,
  BlockId,
  ContentBlockId,
  SectorData,
} from '../types';
import { ADDONS, type AddonDef } from './addons';

/**
 * The blocks a craftsman can put on his own website.
 *
 * Every block is an add-on from `data/addons.ts`: that file keeps the label,
 * the description, the group and the price, so there is exactly one place
 * where a block is described and what it costs. This file adds the two things
 * the add-on list does not know: what the block renders, and which copy it
 * starts with.
 *
 * The `before-after` add-on is deliberately absent: the before/after slider
 * belongs to the portfolio section and is rendered with the projects.
 */
export type BlockKind = 'tool' | 'content';

export interface BlockDef {
  id: BlockId;
  /** The add-on this block belongs to (label, group, price). */
  addon: AddonDef;
  /**
   * `tool` blocks read their data from the sector and have no editable copy
   * (price calculator, postcode check, booking calendar, trade tool).
   * `content` blocks carry text the craftsman can change.
   */
  kind: BlockKind;
  /** On every preset unless the craftsman switches it off. */
  defaultOn: boolean;
}

/** Blocks that are on by default, in the order they appear on the page. */
export const DEFAULT_BLOCK_ORDER: BlockId[] = [
  'price-calculator',
  'area-checker',
  'trade-tool',
  'booking-calendar',
];

function addon(id: string): AddonDef {
  const found = ADDONS.find((entry) => entry.id === id);
  if (!found) throw new Error(`Onbekende add-on: ${id}`);
  return found;
}

export const BLOCKS: BlockDef[] = [
  { id: 'trust-bar', addon: addon('trust-bar'), kind: 'content', defaultOn: false },
  { id: 'guarantees', addon: addon('guarantees'), kind: 'content', defaultOn: false },
  { id: 'testimonial', addon: addon('testimonial'), kind: 'content', defaultOn: false },
  { id: 'team-member', addon: addon('team-member'), kind: 'content', defaultOn: false },
  { id: 'project-stats', addon: addon('project-stats'), kind: 'content', defaultOn: false },
  { id: 'opening-hours', addon: addon('opening-hours'), kind: 'content', defaultOn: false },
  { id: 'availability', addon: addon('availability'), kind: 'content', defaultOn: false },
  { id: 'promotion', addon: addon('promotion'), kind: 'content', defaultOn: false },
  { id: 'service-areas', addon: addon('service-areas'), kind: 'content', defaultOn: false },
  { id: 'contact-cta', addon: addon('contact-cta'), kind: 'content', defaultOn: false },
  { id: 'price-calculator', addon: addon('price-calculator'), kind: 'tool', defaultOn: true },
  { id: 'area-checker', addon: addon('area-checker'), kind: 'tool', defaultOn: true },
  { id: 'booking-calendar', addon: addon('booking-calendar'), kind: 'tool', defaultOn: true },
  { id: 'trade-tool', addon: addon('trade-tool'), kind: 'tool', defaultOn: true },
];

export const BLOCK_IDS: BlockId[] = BLOCKS.map((block) => block.id);

export function getBlock(id: BlockId): BlockDef | undefined {
  return BLOCKS.find((block) => block.id === id);
}

export function isBlockId(value: unknown): value is BlockId {
  return typeof value === 'string' && (BLOCK_IDS as string[]).includes(value);
}

export function isContentBlockId(value: unknown): value is ContentBlockId {
  return (
    typeof value === 'string' &&
    (BLOCKS.filter((block) => block.kind === 'content').map((block) => block.id) as string[]).includes(
      value
    )
  );
}

/**
 * The blocks a craftsman gets: the default ones plus the add-ons he picked in
 * the wizard. Picked blocks are appended, so the order stays predictable until
 * he rearranges it himself.
 */
export function mergeBlocks(base: BlockId[], picked: string[]): BlockId[] {
  // `before-after` is not a block: it belongs to the portfolio section.
  const known = picked.filter(isBlockId);
  const extra = known.filter((id) => !base.includes(id));
  return [...base, ...extra];
}

/* -------------------------------------------------------------------------- *
 * Default copy per block
 * -------------------------------------------------------------------------- */

const DEFAULTS: Record<
  ContentBlockId,
  (sector: SectorData) => BlockContentMap[ContentBlockId]
> = {
  'trust-bar': (sector) => ({
    items: [
      {
        icon: 'shield',
        title: sector.marks[0] ?? 'Gecertificeerd vakbedrijf',
        text: `Erkend in ${sector.city} en omgeving`,
      },
      {
        icon: 'star',
        title: `${sector.rating} uit 5`,
        text: `${sector.reviewCount} klantbeoordelingen`,
      },
      {
        icon: 'clock',
        title: 'Snelle reactie',
        text: 'Meestal binnen één uur antwoord',
      },
      {
        icon: 'pin',
        title: `Actief in ${sector.city}`,
        text: 'Ook in de omliggende regio',
      },
    ],
  }),
  'guarantees': () => ({
    items: [
      {
        title: 'Duidelijke prijs vooraf',
        description: 'Je weet waar je aan toe bent voordat we starten.',
      },
      {
        title: 'Garantie op vakwerk',
        description: 'We staan achter de kwaliteit van de oplevering.',
      },
      {
        title: 'Netjes opgeleverd',
        description: 'Een schone werkplek en zorg voor jouw eigendommen.',
      },
      {
        title: 'Persoonlijk contact',
        description: 'Eén vast aanspreekpunt tijdens de hele klus.',
      },
    ],
  }),
  'testimonial': (sector) => ({
    quote: sector.reviews[0]?.q ?? 'Geweldig werk, precies zoals afgesproken.',
    who: sector.reviews[0]?.who ?? 'Klant uit de regio',
    rating: Number.parseFloat(sector.rating) || 5,
  }),
  'team-member': (sector) => ({
    name: sector.owner,
    role: `Vakman & eigenaar van ${sector.biz}`,
    text: 'Ik denk vanaf het eerste gesprek met je mee en blijf zelf betrokken tot de klus netjes is opgeleverd.',
    since: sector.since,
  }),
  'project-stats': (sector) => ({
    stats: [
      { value: sector.since, label: 'Actief als vakman sinds' },
      { value: `${sector.reviewCount}`, label: 'Klantbeoordelingen' },
      { value: sector.rating, label: 'Gemiddeld cijfer' },
      { value: '25 km', label: `Werkgebied rond ${sector.city}` },
    ],
  }),
  'opening-hours': () => ({
    hours: [
      { days: 'Maandag – vrijdag', time: '07:30 – 17:30' },
      { days: 'Zaterdag', time: '09:00 – 13:00' },
      { days: 'Zondag', time: 'Gesloten' },
    ],
    note: 'Buiten deze tijden kun je gewoon een bericht achterlaten. Je krijgt zo snel mogelijk reactie.',
  }),
  'availability': () => ({
    next: 'Deze week',
    promises: ['Opname op locatie', 'Offerte binnen 2 werkdagen', 'Startdatum in overleg'],
  }),
  'promotion': () => ({
    title: 'Meerdere klussen? Zet ze op één lijst.',
    description:
      'We bekijken de werkzaamheden samen en maken één helder voorstel. Zo houd je grip op planning, prijs en uitvoering.',
    cta: 'Vraag een voorstel aan',
  }),
  'service-areas': (sector) => ({
    areas: [sector.city, ...sector.near],
  }),
  'contact-cta': () => ({
    title: 'Een heldere prijs voor jouw klus?',
    description:
      'Beantwoord een paar korte vragen en ontvang een realistische inschatting. Liever persoonlijk contact? Bel ons gerust.',
  }),
};

/**
 * The copy a block starts with for a given trade. The craftsman can change
 * every word in the editor; this is only the starting point.
 */
export function defaultBlockContent<K extends ContentBlockId>(
  sector: SectorData,
  id: K
): BlockContentMap[K] {
  return DEFAULTS[id](sector) as BlockContentMap[K];
}

/** Default copy for every content block of a trade. */
export function defaultBlockContentMap(sector: SectorData): Partial<BlockContentMap> {
  const entries = (Object.keys(DEFAULTS) as ContentBlockId[]).map((id) => [
    id,
    defaultBlockContent(sector, id),
  ]);
  return Object.fromEntries(entries) as Partial<BlockContentMap>;
}
