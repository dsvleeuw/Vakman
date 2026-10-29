import { randomBytes } from 'node:crypto';
import { createRateLimiter } from '../utils/lead';

/**
 * Photos of the craftsman.
 *
 * A published site shows the work of the craftsman, not the stock photos of
 * the trade. The photos he uploads are kept in the Blobs store `media` and
 * served by the media function; in development they land in `.data/media`.
 * Only real photos are allowed: no SVG, no scripts, and a size limit so one
 * big file cannot fill the store.
 */

/** The largest photo we accept, in bytes. */
export const MAX_MEDIA_BYTES = 1_500_000;

/** The image types we accept, with the extension they get. */
export const MEDIA_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface MediaStorage {
  /** Store a photo under its key; returns where it ended up. */
  saveMedia(key: string, data: Uint8Array, contentType: string): Promise<string>;
  /** Read a photo back, with the type it was stored with. */
  getMedia(key: string): Promise<{ data: Uint8Array; contentType: string } | null>;
}

/** The content type of a stored photo, from its extension. */
export function contentTypeFor(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/** A key is a random name with a known extension: nothing else is served. */
export function isValidMediaKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{6,64}\.(jpg|png|webp)$/.test(value);
}

/**
 * Read a data URL ("data:image/jpeg;base64,…") as bytes plus its type. The
 * type must be a photo we accept and the photo must stay under the limit.
 */
export function readDataUrl(
  value: unknown
): { ok: true; data: Uint8Array; contentType: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || !value.startsWith('data:')) {
    return { ok: false, error: 'Geen foto ontvangen.' };
  }
  const comma = value.indexOf(',');
  if (comma < 0) return { ok: false, error: 'Geen foto ontvangen.' };
  const header = value.slice(5, comma);
  const contentType = header.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!MEDIA_TYPES[contentType]) {
    return { ok: false, error: 'Alleen jpg-, png- en webp-foto’s zijn toegestaan.' };
  }
  const base64 = value.slice(comma + 1);
  // The length of the base64 tells us the size before we decode it.
  if (base64.length > Math.ceil((MAX_MEDIA_BYTES * 4) / 3) + 16) {
    return { ok: false, error: 'De foto is te groot. Kies een kleinere foto.' };
  }
  let data: Uint8Array;
  try {
    data = new Uint8Array(Buffer.from(base64, 'base64'));
  } catch {
    return { ok: false, error: 'De foto kon niet gelezen worden.' };
  }
  if (data.length === 0) return { ok: false, error: 'De foto is leeg.' };
  if (data.length > MAX_MEDIA_BYTES) {
    return { ok: false, error: 'De foto is te groot. Kies een kleinere foto.' };
  }
  return { ok: true, data, contentType };
}

/** A new key for a photo: random name, the extension of its type. */
export function newMediaKey(contentType: string): string {
  const extension = MEDIA_TYPES[contentType] ?? 'jpg';
  return `${randomBytes(8).toString('hex')}.${extension}`;
}

export interface MediaHandlerResult {
  status: number;
  body: unknown;
}

/** How many photos one client may upload per hour. */
export const MEDIA_UPLOADS_PER_HOUR = 30;

/**
 * One rate limiter for the whole process. In a serverless function it lives
 * per warm instance, which is enough to stop one script from filling the
 * store; it is not a distributed quota.
 */
const uploadLimiter = createRateLimiter({
  limit: MEDIA_UPLOADS_PER_HOUR,
  windowMs: 60 * 60 * 1000,
});

/**
 * POST /api/media: store a photo and hand back the address where it is
 * served. The body is `{ data: "data:image/jpeg;base64,…" }`.
 */
export async function handleUploadMedia(
  body: unknown,
  deps: { storage: MediaStorage; clientKey?: string; now?: number }
): Promise<MediaHandlerResult> {
  // Het uploaden is open voor iedereen, dus er zit een grens op: zonder
  // limiet kan een script de fotostore vol zetten.
  const now = deps.now ?? Date.now();
  if (!uploadLimiter(deps.clientKey ?? 'onbekend', now)) {
    return {
      status: 429,
      body: { ok: false, error: 'Te veel foto’s geüpload. Probeer het later opnieuw.' },
    };
  }
  const source = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const parsed = readDataUrl(source.data);
  if (!parsed.ok) {
    return { status: 400, body: { ok: false, error: parsed.error } };
  }
  const key = newMediaKey(parsed.contentType);
  await deps.storage.saveMedia(key, parsed.data, parsed.contentType);
  return {
    status: 200,
    body: { ok: true, key, url: `/api/media?key=${key}` },
  };
}

/**
 * GET /api/media?key=…: serve a photo. The key is checked, so nothing but a
 * photo can be served this way.
 */
export async function handleGetMedia(
  params: URLSearchParams,
  deps: { storage: MediaStorage }
): Promise<{ status: number; body: Uint8Array | null; contentType: string }> {
  const key = params.get('key') ?? '';
  if (!isValidMediaKey(key)) {
    return { status: 400, body: null, contentType: 'application/json' };
  }
  const photo = await deps.storage.getMedia(key);
  if (!photo) return { status: 404, body: null, contentType: 'application/json' };
  return { status: 200, body: photo.data, contentType: photo.contentType };
}
