import type {
  BlockContentMap,
  ContentBlockId,
  PublicPublishedSite,
  SectorId,
  SiteText,
  StyleId,
  WizardFormData,
} from '../types';

/**
 * The client's side of publishing a site.
 *
 * The browser talks to `/api/site`: it publishes a site and reads one back.
 * Nothing is stored in the browser alone any more; the localStorage copy is
 * a draft, the published site is the real one.
 */

export interface PublishSiteInput {
  /** The site to change. Without a slug a new site is created. */
  slug?: string;
  /** The management token, needed to change an existing site. */
  token?: string;
  sector: SectorId;
  styleId: StyleId;
  form: WizardFormData;
  disabledServices: Record<number, boolean>;
  blocks: string[];
  blockContent: Partial<BlockContentMap>;
  /** The blocks the craftsman confirmed as his own text. */
  confirmed?: ContentBlockId[];
  text: SiteText;
}

export interface PublishSiteResult {
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

export interface FetchSiteResult {
  ok: boolean;
  site?: PublicPublishedSite;
  error?: string;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await response.json();
    return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Publish the site, or change it when the slug and token are given. */
export async function publishSite(input: PublishSiteInput): Promise<PublishSiteResult> {
  try {
    const response = await fetch('/api/site', {
      method: 'POST',
      // The session cookie travels with the request, so a logged-in
      // customer owns the site he publishes.
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await readJson(response);
    return data as unknown as PublishSiteResult;
  } catch {
    return { ok: false, error: 'Publiceren lukte niet. Controleer je internetverbinding.' };
  }
}

/** Read a published site. The token is only needed for the owner. */
export async function fetchPublishedSite(
  slug: string,
  token?: string
): Promise<FetchSiteResult> {
  try {
    const params = new URLSearchParams({ slug });
    if (token) params.set('token', token);
    const response = await fetch(`/api/site?${params.toString()}`, {
      credentials: 'same-origin',
    });
    const data = await readJson(response);
    if (!response.ok) {
      return { ok: false, error: (data.error as string) ?? 'Deze site is niet gevonden.' };
    }
    return { ok: true, site: data.site as unknown as PublicPublishedSite };
  } catch {
    return { ok: false, error: 'De site kon niet worden geladen.' };
  }
}
