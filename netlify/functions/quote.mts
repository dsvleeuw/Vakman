import { handleGetQuote, quoteLookupResponse } from '../../src/server/leadHandler';
import { createBlobStorage } from '../../src/server/storage';

/** GET /api/quote?id=KB-2026-0001&token=…[&format=pdf]: view a stored quote. */
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return Response.json({ ok: false, error: 'Alleen GET is toegestaan.' }, { status: 405 });
  }
  const result = await handleGetQuote(new URL(req.url).searchParams, await createBlobStorage());
  return quoteLookupResponse(result);
};

export const config = { path: '/api/quote' };
