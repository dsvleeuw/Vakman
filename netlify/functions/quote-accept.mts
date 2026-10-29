import { createAcceptMailer, handleAcceptQuote } from '../../src/server/acceptQuote';
import { createBlobStorage } from '../../src/server/storage';

/**
 * POST /api/quote/accept: the customer says yes on the offer page.
 *
 * The body is `{ id, token, name }`: the token from the offer link proves
 * the offer is the customer's. The offer gets the status `accepted` and
 * Klusbaas gets a mail with the details.
 */
export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Alleen POST is toegestaan.' }, { status: 405 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Ongeldige JSON.' }, { status: 400 });
  }
  const log = (message: string) => console.log(message);
  const result = await handleAcceptQuote(body, {
    storage: await createBlobStorage(),
    sendMail: createAcceptMailer(process.env, log),
    notifyEmail: process.env.QUOTE_NOTIFY_EMAIL,
    fromEmail: process.env.QUOTE_FROM_EMAIL,
    siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
    log,
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/quote/accept' };
