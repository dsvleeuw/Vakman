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
  ownerFirstUpper: string;
  hdrBg: string;
  hiText: string;
}

export interface WizardFormData {
  biz: string;
  owner: string;
  phone: string;
  city: string;
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
}

export interface PublishedSiteRecord {
  sector: SectorId;
  styleIndex: number;
  form: WizardFormData;
  channel: 'WhatsApp' | 'E-mail' | 'Allebei';
  disabledServices: Record<number, boolean>;
  timestamp: number;
}
