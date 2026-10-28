export type SectorId =
  | 'timmerman'
  | 'hovenier'
  | 'schilder'
  | 'loodgieter'
  | 'elektricien'
  | 'stukadoor'
  | 'overige';

/**
 * Smart, trade-specific conversion tool rendered on the demo website.
 * Each preset gets at most one tool tuned to how that trade gets work.
 */
export type TradeToolId =
  | 'emergency'
  | 'fault-report'
  | 'm2-calculator'
  | 'timeline';

export type StyleId = 'klassiek' | 'modern' | 'krachtig' | 'donker' | 'minimaal';

export type LayoutType = 'split' | 'bleed' | 'bold' | 'editorial' | 'mosaic';

export interface StyleDef {
  id: StyleId;
  name: string;
  layout: LayoutType;
  desc: string;
  display: string;
  dw: number;
  ls: string;
}

export interface ServiceItem {
  n: string;
  d: string;
  p: string;
  nr?: string;
}

export interface WorkProject {
  t: string;
  c: string;
  y: string;
  img?: string;
}

export interface ReviewItem {
  q: string;
  who: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface BeforeAfterProject {
  title: string;
  location: string;
  beforeImg: string;
  afterImg: string;
  description: string;
}

export interface QuizOption {
  l: string;
  h: string;
  b?: number;
  a?: number;
}

export interface QuizQuestion {
  q: string;
  o: QuizOption[];
}

export interface SectorData {
  id: SectorId;
  name: string;
  biz: string;
  owner: string;
  city: string;
  phone: string;
  near: string[];
  pcExample: string;
  hD: number;
  hB: number;
  cf: number;
  vivid?: string;
  vividLight?: boolean;
  since: string;
  rating: string;
  reviewCount: number;
  pool: string[];
  kicker: string;
  headline: string;
  intro: string;
  cta1: string;
  cta2: string;
  about: string;
  servicesTitle: string;
  services: ServiceItem[];
  marks: string[];
  workNote: string;
  work: WorkProject[];
  beforeAfter?: BeforeAfterProject[];
  /** Optional smart conversion component specific to this trade. */
  tool?: TradeToolId;
  faqs?: FaqItem[];
  flow: QuizQuestion[];
  estNote: string;
  reviews: ReviewItem[];
}

export interface AppointmentBooking {
  id: string;
  sectorId: SectorId;
  bizName: string;
  serviceName: string;
  dateStr: string;
  timeSlot: 'Ochtend (08:30 - 12:00)' | 'Middag (12:30 - 16:00)' | 'Avond (16:30 - 19:30)';
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  notes?: string;
  /** Channel the visitor picked for the quote (WhatsApp / E-mail / Allebei). */
  channel?: QuoteChannel;
  /** Whether the visitor explicitly asked to sync the appointment. */
  calendarSyncRequested?: boolean;
  googleCalendarEventId?: string;
  googleDriveFileId?: string;
  createdAt: number;
}

export interface Palette {
  bg: string;
  card: string;
  fg: string;
  muted: string;
  line: string;
  soft: string;
  accent: string;
  onAccent: string;
  accentText: string;
  invBg: string;
  invFg: string;
  invMuted: string;
  invLine: string;
  hi: string;
  onHi: string;
  dot?: string;
  radius: string;
  radiusSm: string;
  radiusLg: string;
  hdrA: string;
}

/* -------------------------------------------------------------------------- *
 * Blocks: the parts of a craftsman website that can be switched on, ordered
 * and filled in by the craftsman himself.
 * -------------------------------------------------------------------------- */

export type BlockId =
  | 'trust-bar'
  | 'guarantees'
  | 'testimonial'
  | 'team-member'
  | 'project-stats'
  | 'opening-hours'
  | 'availability'
  | 'promotion'
  | 'service-areas'
  | 'contact-cta'
  | 'price-calculator'
  | 'area-checker'
  | 'booking-calendar'
  | 'trade-tool';

/** The icon a trust-bar item shows. Fixed set, so the editor stays simple. */
export type TrustIcon = 'shield' | 'clock' | 'pin' | 'star' | 'check' | 'award' | 'leaf' | 'tool';

export interface TrustBarItem {
  icon: TrustIcon;
  title: string;
  text: string;
}

export interface TrustBarContent {
  items: TrustBarItem[];
}

export interface GuaranteeItem {
  title: string;
  description: string;
}

export interface GuaranteeContent {
  items: GuaranteeItem[];
}

export interface TestimonialContent {
  quote: string;
  who: string;
  rating: number;
}

export interface TeamMemberContent {
  name: string;
  role: string;
  text: string;
  since: string;
}

export interface ProjectStatItem {
  value: string;
  label: string;
}

export interface ProjectStatsContent {
  stats: ProjectStatItem[];
}

export interface BusinessHour {
  days: string;
  time: string;
}

export interface OpeningHoursContent {
  hours: BusinessHour[];
  note: string;
}

export interface AvailabilityContent {
  next: string;
  promises: string[];
}

export interface PromotionContent {
  title: string;
  description: string;
  cta: string;
}

export interface ServiceAreasContent {
  areas: string[];
}

export interface ContactCtaContent {
  title: string;
  description: string;
}

/**
 * Editable copy per content block. The four tools (price calculator, postcode
 * check, booking calendar, trade tool) read their data from the sector and
 * therefore have no content of their own.
 */
export interface BlockContentMap {
  'trust-bar': TrustBarContent;
  'guarantees': GuaranteeContent;
  'testimonial': TestimonialContent;
  'team-member': TeamMemberContent;
  'project-stats': ProjectStatsContent;
  'opening-hours': OpeningHoursContent;
  'availability': AvailabilityContent;
  'promotion': PromotionContent;
  'service-areas': ServiceAreasContent;
  'contact-cta': ContactCtaContent;
}

/** Block ids that carry editable copy. */
export type ContentBlockId = keyof BlockContentMap;

/** The copy of the page itself, so a craftsman can write his own headline. */
export interface SiteText {
  kicker: string;
  headline: string;
  intro: string;
  about: string;
  cta1: string;
  cta2: string;
}

/**
 * Everything that makes one craftsman's website his own: his details, the
 * services he offers, which blocks are on the page and what they say.
 */
export interface SiteContent {
  version: 1;
  sector: SectorId;
  styleId: StyleId;
  form: WizardFormData;
  disabledServices: Record<number, boolean>;
  /** Enabled blocks, in the order they appear on the page. */
  blocks: BlockId[];
  /** Editable copy per content block. */
  blockContent: Partial<BlockContentMap>;
  /** Editable copy of the page itself. */
  text: SiteText;
}

export interface ActiveSiteData extends SectorData, Palette {
  display: string;
  dw: number;
  ls: string;
  styleName: string;
  styleId: StyleId;
  layout: LayoutType;
  img: {
    hero: string;
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
  };
  nameLower: string;
  domain: string;
  bizLetter: string;
  callLabel: string;
  /**
   * The number call/WhatsApp buttons may link to: the owner's own number or
   * the Klusbaas demo number. `null` on a demo without `VITE_DEMO_PHONE`;
   * buttons then show the demo notice instead of dialling the sample number.
   */
  contactPhone: string | null;
  /**
   * True when the site belongs to a customer instead of Klusbaas: a published
   * site or the craftsman's own editor. Such a site never shows the Klusbaas
   * demo number and never shows the demo notice.
   */
  isCustomerSite: boolean;
  /** KvK number of the company. Only shown when the owner entered a real one. */
  kvk: string | null;
  ownerFirstUpper: string;
  hdrBg: string;
  hiText: string;
  /** Blocks on this page, in order. Set by `applySiteContent`. */
  blocks: BlockId[];
  /** Editable copy per block. Set by `applySiteContent`. */
  blockContent: Partial<BlockContentMap>;
}

export interface WizardFormData {
  biz: string;
  owner: string;
  phone: string;
  city: string;
  /** Where the quote is mailed. Optional so older saved drafts still load. */
  email?: string;
  /** KvK number of the company. Only filled in when the owner has one. */
  kvk?: string;
}

/** How a visitor wants to receive their quote. */
export type QuoteChannel = 'WhatsApp' | 'E-mail' | 'Allebei';

/** The three one-off platform packages (see `data/plans.ts`). */
export type PlanId = 'basis' | 'pro' | 'premium';

/**
 * Everything the wizard has collected so far. Kept in `App` (and mirrored in
 * sessionStorage) so navigating to the site preview and back does not throw
 * away what the user already typed.
 */
export interface WizardDraft {
  sector: SectorId;
  styleIndex: number;
  form: WizardFormData | null;
  disabledServices: Record<number, boolean>;
  /** Add-on component ids from `data/addons.ts`. */
  addons?: string[];
  /** Channel picked for the quote (WhatsApp / E-mail / Allebei). */
  channel?: QuoteChannel;
  /** True once the visitor explicitly chose a trade (or arrived with ?vak=). */
  sectorChosen?: boolean;
}

/**
 * What is kept for a craftsman who filled in his own site: his details, the
 * blocks on his page and the services he switched off.
 */
export interface CustomSite {
  form: WizardFormData;
  /** Blocks on his page, in order. */
  blocks: BlockId[];
  /** Services he switched off, by index in the trade preset. */
  disabledServices: Record<number, boolean>;
}

/**
 * A site the customer published: it lives on its own address
 * (`/site/<slug>`) and is edited through the management link
 * (`/mijn-site/<slug>?token=…`).
 */
export interface PublishedSiteRecord {
  /** The public address of the site: `/site/<slug>`. */
  slug: string;
  /** Secret token of the management link. Never shown on the public page. */
  token: string;
  sector: SectorId;
  styleId: StyleId;
  form: WizardFormData;
  channel: 'WhatsApp' | 'E-mail' | 'Allebei';
  disabledServices: Record<number, boolean>;
  /** The blocks the customer chose, in the order they appear on the page. */
  blocks: BlockId[];
  /** The copy per block. */
  blockContent: Partial<BlockContentMap>;
  /** The copy of the page itself. */
  text: SiteText;
  /** When the site was first published. */
  timestamp: number;
  /** When the site was last changed. */
  updatedAt: number;
}

/**
 * What the public page needs to draw a site. The management token stays out
 * of it: this is what any visitor can read.
 */
export type PublicPublishedSite = Omit<
  PublishedSiteRecord,
  'token' | 'channel' | 'timestamp' | 'updatedAt'
> & { updatedAt: number };
