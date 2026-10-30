import { createAccountMailer } from '../../src/server/accountMailer';
import { paymentDetailsFromEnv } from '../../src/server/payment';
import { handleQuoteRequest } from '../../src/server/quoteRequest';
import {
  createBlobAccountStorage,
  createBlobSiteStorage,
  createBlobStorage,
} from '../../src/server/storage';

/**
 * POST /api/quote/request: the customer asks for an offer in his own site
 * editor.
 *
 * The session cookie says who is asking; the body says which package he
 * wants. The answer is a real offer (number, PDF, price) that lands in his
 * account, plus the request that Klusbaas sees in his overview.
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
  const payment = paymentDetailsFromEnv(process.env);
  const result = await handleQuoteRequest(
    body,
    {
      accounts: await createBlobAccountStorage(),
      leads: await createBlobStorage(),
      sites: await createBlobSiteStorage(),
      sendMail: createAccountMailer(process.env, log),
      notifyEmail: process.env.QUOTE_NOTIFY_EMAIL,
      siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
      ...(payment ? { payment } : {}),
      log,
    },
    req.headers.get('cookie')
  );
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/quote/request' };
