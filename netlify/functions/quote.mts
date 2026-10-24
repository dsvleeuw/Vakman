import { handleQuoteView } from '../../src/server/quotes';
import { createBlobStore } from '../../src/server/store';

/** GET /api/offerte/:id?token=…[&format=pdf] — the saved quote, only with its token. */
export default async (req: Request, context: { params?: Record<string, string> }): Promise<Response> => {
  if (req.method !== 'GET') {
    return Response.json({ ok: false, error: 'Alleen GET is toegestaan.' }, { status: 405 });
  }
  const url = new URL(req.url);
  const id = context.params?.id ?? decodeURIComponent(url.pathname.split('/').pop() ?? '');
  const result = await handleQuoteView(
    await createBlobStore('quotes'),
    id,
    url.searchParams.get('token'),
    url.searchParams.get('format')
  );
  return new Response(result.body as BodyInit, { status: result.status, headers: result.headers });
};

export const config = { path: '/api/offerte/:id' };
