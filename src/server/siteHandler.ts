import type {
  BlockId,
  ContentBlockId,
  PublishedSiteRecord,
  PublicPublishedSite,
  SectorId,
  SiteContent,
  StyleId,
} from '../types';
import { isBlockId, isContentBlockId } from '../data/blocks';
import { isSectorId, isStyleId } from '../utils/router';
import { sanitizeSiteContent } from '../utils/siteContent';
import { siteChecklist } from '../utils/publishedContent';
import { buildPublishMail } from '../utils/accountMail';
import type { SiteStorage } from './storage';
import { createToken, tokensMatch } from './tokens';

/**
 * `POST /api/site` and `GET /api/site`, shared by the Netlify Function and
 * the Vite dev middleware.
 *
 * A published site has a public address (`/site/<slug>`) and a management
 * link (`/mijn-site/<slug>?token=…`). The token is the only way to change
 * the site, so it is checked on every write and never sent to a visitor.
 */

export interface SiteHandlerResult<T> {
  status: number;
  body: T;
}

export interface PublishSiteBody {
  /** The site to change. Without a slug a new site is created. */
  slug?: string;
  /** The management token. Required as soon as a slug is given. */
  token?: string;
  sector: SectorId;
  styleId: StyleId;
  form: {
    biz: string;
    owner: string;
    phone: string;
    city: string;
    email?: string;
    kvk?: string;
  };
  disabledServices: Record<number, boolean>;
  blocks: BlockId[];
  blockContent: SiteContent['blockContent'];
  confirmed?: ContentBlockId[];
  text: SiteContent['text'];
}

export interface PublishSiteResponse {
  ok: boolean;
  slug?: string;
  token?: string;
  /** The public address of the site. */
  url?: string;
  /** The private address to edit the site. */
  manageUrl?: string;
  created?: boolean;
  error?: string;
  field?: string;
}

export interface SiteHandlerDeps {
  storage: SiteStorage;
  /** Origin of the site, used in the links we hand back. */
  siteUrl: string;
  /** The logged-in account, if there is one. It owns the sites it publishes. */
  ownerId?: string;
  /** The e-mail address of the owner, when he is logged in. */
  ownerEmail?: string;
  /**
   * Sends the welcome mail after the first publish. Without it no mail is
   * sent; the site is published all the same.
   */
  sendMail?: (mail: { to: string; subject: string; text: string; html: string }) => Promise<string>;
  now?: () => number;
  createToken?: () => string;
  log?: (message: string) => void;
}

const MAX_SLUG_LENGTH = 60;

/**
 * A readable address from a business name: "Jansen Schilderwerken" becomes
 * "jansen-schilderwerken".
 */
export function slugify(value: string): string {
  const base = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
  return base || 'mijn-site';
}

export function isValidSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{2,}$/.test(value) && !value.startsWith('-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check what the customer sent. Only a complete site with a real phone
 * number may be published: a published page is a public claim.
 */
export function validatePublishBody(
  body: unknown
): { ok: true; data: PublishSiteBody } | { ok: false; error: string; field?: string } {
  if (!isRecord(body)) return { ok: false, error: 'Ongeldige aanvraag.' };

  const sector = body.sector;
  if (typeof sector !== 'string' || !isSectorId(sector)) {
    return { ok: false, error: 'Kies een vak.', field: 'sector' };
  }
  const styleId = body.styleId;
  if (typeof styleId !== 'string' || !isStyleId(styleId)) {
    return { ok: false, error: 'Kies een stijl.', field: 'styleId' };
  }

  const form = isRecord(body.form) ? body.form : {};
  const biz = typeof form.biz === 'string' ? form.biz.trim() : '';
  const owner = typeof form.owner === 'string' ? form.owner.trim() : '';
  const phone = typeof form.phone === 'string' ? form.phone.trim() : '';
  const city = typeof form.city === 'string' ? form.city.trim() : '';
  if (!biz) return { ok: false, error: 'Vul je bedrijfsnaam in.', field: 'biz' };
  if (!owner) return { ok: false, error: 'Vul je naam in.', field: 'owner' };
  if (!city) return { ok: false, error: 'Vul je plaats in.', field: 'city' };
  if (!phone) {
    return {
      ok: false,
      error: 'Vul je telefoonnummer in: zonder nummer kunnen je klanten je niet bellen.',
      field: 'phone',
    };
  }

  const blocks = Array.isArray(body.blocks)
    ? body.blocks.filter(isBlockId)
    : [];
  const blockContent = isRecord(body.blockContent)
    ? (body.blockContent as SiteContent['blockContent'])
    : {};

  const confirmed = Array.isArray(body.confirmed)
    ? body.confirmed.filter(isContentBlockId)
    : [];

  const text = (isRecord(body.text) ? body.text : {}) as unknown as SiteContent['text'];

  const disabledServices: Record<number, boolean> = {};
  if (isRecord(body.disabledServices)) {
    for (const [key, value] of Object.entries(body.disabledServices)) {
      const index = Number.parseInt(key, 10);
      if (Number.isInteger(index) && index >= 0 && value === true) disabledServices[index] = true;
    }
  }

  return {
    ok: true,
    data: {
      ...(typeof body.slug === 'string' && body.slug ? { slug: body.slug } : {}),
      ...(typeof body.token === 'string' && body.token ? { token: body.token } : {}),
      sector,
      styleId,
      form: {
        biz,
        owner,
        phone,
        city,
        ...(typeof form.email === 'string' && form.email.trim() ? { email: form.email.trim() } : {}),
        ...(typeof form.kvk === 'string' && form.kvk.trim() ? { kvk: form.kvk.trim() } : {}),
      },
      disabledServices,
      blocks,
      blockContent,
      confirmed,
      text: { ...text },
    },
  };
}

/**
 * Save a site. Without a slug a new site is created with a fresh token; with
 * a slug the token has to match, otherwise the change is refused.
 */
export async function handlePublishSite(
  body: unknown,
  deps: SiteHandlerDeps
): Promise<SiteHandlerResult<PublishSiteResponse>> {
  const parsed = validatePublishBody(body);
  if (!parsed.ok) {
    return { status: 400, body: { ok: false, error: parsed.error, field: parsed.field } };
  }
  const data = parsed.data;
  const now = deps.now ? deps.now() : Date.now();
  const makeToken = deps.createToken ?? createToken;

  let slug = data.slug;
  let token = data.token;
  let created = false;

  if (slug) {
    if (!isValidSlug(slug)) {
      return { status: 400, body: { ok: false, error: 'Ongeldige adressering.' } };
    }
    const existing = await deps.storage.getSite(slug);
    if (!existing) {
      return { status: 404, body: { ok: false, error: 'Deze site bestaat niet meer.' } };
    }
    // The management link works, and so does the account of the owner: the
    // token is a fallback for a site that was published before accounts.
    const ownsSite = Boolean(deps.ownerId) && existing.ownerId === deps.ownerId;
    if ((!token || !tokensMatch(existing.token, token)) && !ownsSite) {
      return {
        status: 403,
        body: { ok: false, error: 'Je beheerlink klopt niet meer. Neem contact op met Klusbaas.' },
      };
    }
    // The token that comes in is only a key to the door, never a new key:
    // the token of the site stays the same, so a link that works keeps
    // working.
    token = existing.token;
  } else {
    // A new site gets a free address: jansen-schilderwerken, then -2, -3 …
    const base = slugify(data.form.biz);
    slug = base;
    let counter = 1;
    while (await deps.storage.getSite(slug)) {
      counter += 1;
      slug = `${base}-${counter}`;
    }
    token = makeToken();
    created = true;
  }

  const record: PublishedSiteRecord = {
    slug,
    token: token as string,
    ...(deps.ownerId ? { ownerId: deps.ownerId } : {}),
    sector: data.sector,
    styleId: data.styleId,
    form: data.form,
    channel: 'WhatsApp',
    disabledServices: data.disabledServices,
    blocks: data.blocks,
    blockContent: data.blockContent,
    confirmed: data.confirmed,
    text: data.text,
    timestamp: now,
    updatedAt: now,
  };

  await deps.storage.saveSite(record);

  // Na de eerste publicatie krijgt de vakman een mail: zijn adres, wat er
  // werkt en wat hij nog even moet nakijken. Zonder mailer gaat de site gewoon
  // live; de mail is een extra, geen voorwaarde.
  if (created) {
    await sendWelcomeMail(record, deps);
  }

  return {
    status: 200,
    body: {
      ok: true,
      slug,
      token: record.token,
      url: `${deps.siteUrl}/site/${slug}`,
      manageUrl: `${deps.siteUrl}/mijn-site/${slug}?token=${record.token}`,
      created,
    },
  };
}

/** The welcome mail after the first publish. */
async function sendWelcomeMail(record: PublishedSiteRecord, deps: SiteHandlerDeps): Promise<void> {
  const to = deps.ownerEmail ?? record.form.email;
  if (!to || !deps.sendMail) return;
  const checklist = siteChecklist({
    version: 1,
    sector: record.sector,
    styleId: record.styleId,
    form: record.form,
    disabledServices: record.disabledServices,
    blocks: record.blocks,
    blockContent: record.blockContent,
    ...(record.confirmed ? { confirmed: record.confirmed } : {}),
    text: record.text,
  });
  const mail = buildPublishMail({
    biz: record.form.biz || record.slug,
    siteUrl: `${deps.siteUrl}/site/${record.slug}`,
    manageUrl: `${deps.siteUrl}/mijn-site/${record.slug}?token=${record.token}`,
    checklist: checklist.map((item) => ({ label: item.label, hint: item.hint })),
  });
  try {
    const status = await deps.sendMail({ to, ...mail });
    deps.log?.(`[site] welkomstmail naar ${to}: ${status}`);
  } catch (error) {
    deps.log?.(`[site] welkomstmail mislukt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** The parts of a site any visitor may see. The token never leaves here. */
export function toPublicSite(record: PublishedSiteRecord): PublicPublishedSite {
  const { token, channel, timestamp, ownerId, ...rest } = record;
  void token;
  void channel;
  void timestamp;
  // The owner id stays on the server: a visitor has no use for it.
  void ownerId;
  return { ...rest, form: { ...rest.form } };
}

/**
 * `GET /api/site?slug=…[&token=…]`
 *
 * Without a token the visitor gets the public site. With the management
 * token the owner also gets the e-mail address and the channel.
 */
export async function handleGetSite(
  params: URLSearchParams,
  storage: SiteStorage,
  ownerId?: string
): Promise<SiteHandlerResult<PublishSiteResponse & { site?: PublicPublishedSite }>> {
  const slug = params.get('slug') ?? '';
  const token = params.get('token') ?? '';
  if (!isValidSlug(slug)) {
    return { status: 400, body: { ok: false, error: 'Ongeldige adressering.' } };
  }
  const record = await storage.getSite(slug);
  if (!record) {
    return { status: 404, body: { ok: false, error: 'Deze site bestaat niet (meer).' } };
  }
  const ownsSite = Boolean(ownerId) && record.ownerId === ownerId;
  if (token) {
    if (!tokensMatch(record.token, token)) {
      return { status: 403, body: { ok: false, error: 'Je beheerlink klopt niet.' } };
    }
    return { status: 200, body: { ok: true, site: { ...toPublicSite(record), form: record.form } } };
  }
  if (ownsSite) {
    // The owner sees the full record, e-mail address and all.
    return { status: 200, body: { ok: true, site: { ...toPublicSite(record), form: record.form } } };
  }
  return { status: 200, body: { ok: true, site: toPublicSite(record) } };
}

/**
 * The content of a published site, cleaned up: only known blocks, only text
 * that belongs there.
 */
export function contentOfSite(record: PublishedSiteRecord): SiteContent | null {
  const content = sanitizeSiteContent({
    version: 1,
    sector: record.sector,
    styleId: record.styleId,
    form: record.form,
    disabledServices: record.disabledServices,
    blocks: record.blocks,
    blockContent: record.blockContent,
    confirmed: record.confirmed,
    text: record.text,
  });
  return content;
}

export { isContentBlockId };
