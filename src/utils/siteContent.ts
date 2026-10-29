import type {
  ActiveSiteData,
  AvailabilityContent,
  CustomSite,
  BlockContentMap,
  BlockId,
  ContactCtaContent,
  ContentBlockId,
  GuaranteeContent,
  OpeningHoursContent,
  ProjectStatsContent,
  PromotionContent,
  SectorId,
  ServiceAreasContent,
  SiteContent,
  SiteText,
  StyleId,
  TeamMemberContent,
  TestimonialContent,
  TrustBarContent,
  WizardFormData,
} from '../types';
import {
  DEFAULT_BLOCK_ORDER,
  defaultBlockContent,
  defaultBlockContentMap,
  isBlockId,
  isContentBlockId,
} from '../data/blocks';
import { buildSiteText, SECTORS } from '../data/tradesData';
import { isSectorId, isStyleId } from './router';

/**
 * The content of one craftsman website: his details, the blocks on his page
 * and the words in them.
 *
 * Everything here is pure so it can be unit-tested without a browser and
 * reused by the wizard, the editor and the publisher.
 */

export const SITE_CONTENT_VERSION = 1;

/** Any of the block contents, used where the block is not known yet. */
type AnyBlockContent = BlockContentMap[ContentBlockId];

/** The content a website starts with: the trade preset, nothing filled in. */
export function defaultSiteContent(
  sectorId: SectorId,
  styleId: StyleId,
  form: WizardFormData = { biz: '', owner: '', phone: '', city: '' }
): SiteContent {
  const sector = SECTORS[sectorId];
  return {
    version: SITE_CONTENT_VERSION,
    sector: sectorId,
    styleId,
    form,
    disabledServices: {},
    blocks: [...DEFAULT_BLOCK_ORDER],
    blockContent: defaultBlockContentMap(sector),
    confirmed: [],
    text: buildSiteText(sector, form),
  };
}

function mergeText(custom: string | undefined, fallback: string): string {
  return typeof custom === 'string' && custom.trim() ? custom : fallback;
}

function mergeItems<T>(custom: T[] | undefined, fallback: T[]): T[] {
  // The editor writes a complete list, so a list is replaced as a whole.
  // That way the craftsman can also delete an item.
  return custom && custom.length > 0 ? custom : fallback;
}

/**
 * Per block: how edited copy is merged with the preset copy. An empty field
 * falls back to the preset, so a half-filled form never blanks out the page.
 */
const MERGERS: Record<
  ContentBlockId,
  (custom: AnyBlockContent, fallback: AnyBlockContent) => AnyBlockContent
> = {
  'trust-bar': (custom, fallback) => {
    const c = custom as TrustBarContent;
    const f = fallback as TrustBarContent;
    return { items: mergeItems(c.items, f.items) };
  },
  'guarantees': (custom, fallback) => {
    const c = custom as GuaranteeContent;
    const f = fallback as GuaranteeContent;
    return { items: mergeItems(c.items, f.items) };
  },
  'testimonial': (custom, fallback) => {
    const c = custom as TestimonialContent;
    const f = fallback as TestimonialContent;
    return {
      quote: mergeText(c.quote, f.quote),
      who: mergeText(c.who, f.who),
      rating: c.rating || f.rating,
    };
  },
  'team-member': (custom, fallback) => {
    const c = custom as TeamMemberContent;
    const f = fallback as TeamMemberContent;
    return {
      name: mergeText(c.name, f.name),
      role: mergeText(c.role, f.role),
      text: mergeText(c.text, f.text),
      since: mergeText(c.since, f.since),
    };
  },
  'project-stats': (custom, fallback) => {
    const c = custom as ProjectStatsContent;
    const f = fallback as ProjectStatsContent;
    return { stats: mergeItems(c.stats, f.stats) };
  },
  'opening-hours': (custom, fallback) => {
    const c = custom as OpeningHoursContent;
    const f = fallback as OpeningHoursContent;
    return {
      hours: mergeItems(c.hours, f.hours),
      note: mergeText(c.note, f.note),
    };
  },
  'availability': (custom, fallback) => {
    const c = custom as AvailabilityContent;
    const f = fallback as AvailabilityContent;
    return {
      next: mergeText(c.next, f.next),
      promises: mergeItems(c.promises, f.promises),
    };
  },
  'promotion': (custom, fallback) => {
    const c = custom as PromotionContent;
    const f = fallback as PromotionContent;
    return {
      title: mergeText(c.title, f.title),
      description: mergeText(c.description, f.description),
      cta: mergeText(c.cta, f.cta),
    };
  },
  'service-areas': (custom, fallback) => {
    const c = custom as ServiceAreasContent;
    const f = fallback as ServiceAreasContent;
    return { areas: mergeItems(c.areas, f.areas) };
  },
  'contact-cta': (custom, fallback) => {
    const c = custom as ContactCtaContent;
    const f = fallback as ContactCtaContent;
    return {
      title: mergeText(c.title, f.title),
      description: mergeText(c.description, f.description),
    };
  },
};

function mergeBlockContent<K extends ContentBlockId>(
  id: K,
  custom: BlockContentMap[K] | undefined,
  fallback: BlockContentMap[K]
): BlockContentMap[K] {
  if (!custom) return fallback;
  return MERGERS[id](
    custom as AnyBlockContent,
    fallback as AnyBlockContent
  ) as BlockContentMap[K];
}

/**
 * Lay the content over the generated site: the craftsman's words, the blocks
 * he switched on and the copy inside those blocks.
 */
export function applySiteContent(site: ActiveSiteData, content: SiteContent): ActiveSiteData {
  const blocks = content.blocks.filter(isBlockId);
  const blockContent: Partial<BlockContentMap> = {};
  const target = blockContent as Record<string, unknown>;

  for (const id of blocks) {
    if (!isContentBlockId(id)) continue;
    const fallback = defaultBlockContent(SECTORS[content.sector], id);
    target[id] = mergeBlockContent(id, content.blockContent[id], fallback);
  }

  const text: SiteText = content.text;
  return {
    ...site,
    kicker: mergeText(text.kicker, site.kicker),
    headline: mergeText(text.headline, site.headline),
    intro: mergeText(text.intro, site.intro),
    about: mergeText(text.about, site.about),
    cta1: mergeText(text.cta1, site.cta1),
    cta2: mergeText(text.cta2, site.cta2),
    blocks,
    blockContent,
  };
}

/**
 * Read the copy of one block, with the preset as fallback.
 */
export function blockContentOf<K extends ContentBlockId>(
  map: Partial<BlockContentMap>,
  id: K,
  fallback: BlockContentMap[K]
): BlockContentMap[K] {
  return mergeBlockContent(id, map[id], fallback);
}

/** Switch a block on (appending it) or off (removing it). */
export function setBlockEnabled(blocks: BlockId[], id: BlockId, enabled: boolean): BlockId[] {
  if (enabled) return blocks.includes(id) ? blocks : [...blocks, id];
  return blocks.filter((block) => block !== id);
}

/** Move a block one position up or down. Out-of-range moves change nothing. */
export function moveBlock(blocks: BlockId[], id: BlockId, delta: number): BlockId[] {
  const index = blocks.indexOf(id);
  if (index === -1) return blocks;
  const target = index + delta;
  if (target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Move a block to another position, used while dragging it to a new place. */
export function moveBlockTo(blocks: BlockId[], id: BlockId, targetIndex: number): BlockId[] {
  const index = blocks.indexOf(id);
  if (index === -1) return blocks;
  const target = Math.max(0, Math.min(blocks.length - 1, targetIndex));
  if (target === index) return blocks;
  const next = [...blocks];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Read content that came from storage or a URL. Anything unexpected is
 * ignored, so a half-written or outdated document never breaks the site.
 */
export function sanitizeSiteContent(raw: unknown): SiteContent | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== SITE_CONTENT_VERSION) return null;
  if (!isSectorId(typeof raw.sector === 'string' ? raw.sector : undefined)) return null;

  const form = isRecord(raw.form)
    ? {
        biz: asString(raw.form.biz),
        owner: asString(raw.form.owner),
        phone: asString(raw.form.phone),
        city: asString(raw.form.city),
        ...(typeof raw.form.email === 'string' ? { email: raw.form.email } : {}),
      }
    : { biz: '', owner: '', phone: '', city: '' };

  const disabledServices: Record<number, boolean> = {};
  if (isRecord(raw.disabledServices)) {
    for (const [key, value] of Object.entries(raw.disabledServices)) {
      const index = Number.parseInt(key, 10);
      if (Number.isFinite(index) && value === true) disabledServices[index] = true;
    }
  }

  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.filter(isBlockId)
    : [...DEFAULT_BLOCK_ORDER];

  const blockContent: Partial<BlockContentMap> = {};
  const target = blockContent as Record<string, unknown>;
  if (isRecord(raw.blockContent)) {
    for (const [key, value] of Object.entries(raw.blockContent)) {
      if (isContentBlockId(key) && isRecord(value)) {
        target[key] = value;
      }
    }
  }

  const confirmed: ContentBlockId[] = Array.isArray(raw.confirmed)
    ? raw.confirmed.filter(isContentBlockId)
    : [];

  const text: SiteText = isRecord(raw.text)
    ? {
        kicker: asString(raw.text.kicker),
        headline: asString(raw.text.headline),
        intro: asString(raw.text.intro),
        about: asString(raw.text.about),
        cta1: asString(raw.text.cta1),
        cta2: asString(raw.text.cta2),
      }
    : { kicker: '', headline: '', intro: '', about: '', cta1: '', cta2: '' };

  return {
    version: SITE_CONTENT_VERSION,
    sector: raw.sector as SectorId,
    styleId: isStyleId(typeof raw.styleId === 'string' ? raw.styleId : undefined)
      ? (raw.styleId as StyleId)
      : 'klassiek',
    form,
    disabledServices,
    blocks,
    blockContent,
    confirmed,
    text,
  };
}

/** Confirm a block as the craftsman's own text, or take the confirmation back. */
export function setBlockConfirmed(
  confirmed: ContentBlockId[] | undefined,
  id: ContentBlockId,
  isConfirmed: boolean
): ContentBlockId[] {
  const list = confirmed ?? [];
  if (isConfirmed) return list.includes(id) ? list : [...list, id];
  return list.filter((entry) => entry !== id);
}

/**
 * Read a stored custom site. Both the current shape and the older one (where
 * only the four wizard fields were saved) are accepted, so nobody loses his
 * site when the app is updated.
 */
export function sanitizeCustomSite(raw: unknown): CustomSite | null {
  if (!isRecord(raw)) return null;

  const form: WizardFormData = isRecord(raw.form)
    ? {
        biz: asString(raw.form.biz),
        owner: asString(raw.form.owner),
        phone: asString(raw.form.phone),
        city: asString(raw.form.city),
        ...(typeof raw.form.email === 'string' ? { email: raw.form.email } : {}),
      }
    : {
        biz: asString(raw.biz),
        owner: asString(raw.owner),
        phone: asString(raw.phone),
        city: asString(raw.city),
        ...(typeof raw.email === 'string' ? { email: raw.email } : {}),
      };

  const disabledServices: Record<number, boolean> = {};
  if (isRecord(raw.disabledServices)) {
    for (const [key, value] of Object.entries(raw.disabledServices)) {
      const index = Number.parseInt(key, 10);
      if (Number.isFinite(index) && value === true) disabledServices[index] = true;
    }
  }

  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.filter(isBlockId)
    : [...DEFAULT_BLOCK_ORDER];

  return { form, blocks, disabledServices };
}

/** The content of a craftsman's own site, ready to apply to a generated site. */
export function contentForCustomSite(
  custom: CustomSite,
  sectorId: SectorId,
  styleId: StyleId
): SiteContent {
  const base = defaultSiteContent(sectorId, styleId, custom.form);
  return {
    ...base,
    disabledServices: custom.disabledServices,
    blocks: custom.blocks.length > 0 ? custom.blocks : base.blocks,
  };
}
