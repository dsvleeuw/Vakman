/**
 * Uploading a photo of the craftsman's own work.
 *
 * The photo is made smaller in the browser first (a canvas), so a phone
 * photo of 5 MB becomes a photo of a few hundred kilobytes. After that it
 * goes to `/api/media`, which keeps it and hands back the address where it
 * is served.
 */

/** The widest photo we upload; a bigger one is scaled down. */
export const MAX_PHOTO_WIDTH = 1600;

/** The quality of the photo we upload. */
export const PHOTO_QUALITY = 0.82;

export interface UploadResult {
  ok: boolean;
  /** The address where the photo is served. */
  url?: string;
  error?: string;
}

/**
 * A photo as a data URL, made smaller in the browser. Returns null when the
 * browser cannot read the file.
 */
export async function photoToDataUrl(
  file: File,
  maxWidth = MAX_PHOTO_WIDTH,
  quality = PHOTO_QUALITY
): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  const scale = Math.min(1, maxWidth / (bitmap.width || maxWidth));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return null;
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}

/** Send a photo to the server and return the address it is served on. */
export async function uploadPhoto(file: File): Promise<UploadResult> {
  const data = await photoToDataUrl(file);
  if (!data) {
    return { ok: false, error: 'Deze foto konden we niet lezen. Kies een jpg- of png-foto.' };
  }
  try {
    const response = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const result = (await response.json()) as { ok?: boolean; url?: string; error?: string };
    if (!response.ok || !result.ok || !result.url) {
      return { ok: false, error: result.error ?? 'Het uploaden is niet gelukt.' };
    }
    return { ok: true, url: result.url };
  } catch {
    return { ok: false, error: 'Het uploaden is niet gelukt. Controleer je internetverbinding.' };
  }
}
