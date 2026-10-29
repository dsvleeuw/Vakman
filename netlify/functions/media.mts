import { handleGetMedia, handleUploadMedia } from '../../src/server/mediaHandler';
import { createBlobMediaStorage } from '../../src/server/storage';

/**
 * POST /api/media: store a photo of the craftsman's own work.
 * GET  /api/media?key=…: serve a stored photo.
 *
 * The photos live in the Blobs store `media` and are served from there, so
 * a customer site can show the work of its owner without any other service.
 */
export default async (req: Request): Promise<Response> => {
  const storage = await createBlobMediaStorage();

  if (req.method === 'GET') {
    const params = new URL(req.url).searchParams;
    const result = await handleGetMedia(params, { storage });
    if (result.status !== 200 || !result.body) {
      return Response.json({ ok: false }, { status: result.status });
    }
    return new Response(result.body as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        // A photo never changes under the same name.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Alleen POST is toegestaan.' }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Ongeldige JSON.' }, { status: 400 });
  }

  const result = await handleUploadMedia(body, { storage });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/media' };
