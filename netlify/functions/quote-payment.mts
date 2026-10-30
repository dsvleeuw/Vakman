import { createAccountMailer } from '../../src/server/accountMailer';
import { paymentDetailsFromEnv } from '../../src/server/payment';
import { handleReportPayment } from '../../src/server/reportPayment';
import { createBlobStorage } from '../../src/server/storage';

/**
 * POST /api/quote/payment: the customer says he transferred the money.
 *
 * The body is `{ id, token }`: the token from the offer link proves the
 * offer is the customer's. Klusbaas gets a mail so he can check his bank
 * statement; only he marks the offer as paid.
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
  const result = await handleReportPayment(body, {
    storage: await createBlobStorage(),
    sendMail: createAccountMailer(process.env, log),
    notifyEmail: process.env.QUOTE_NOTIFY_EMAIL,
    siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
    ...(payment ? { payment } : {}),
    log,
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/quote/payment' };
