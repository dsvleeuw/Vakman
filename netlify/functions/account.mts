import { handleAccount } from '../../src/server/accountHandler';
import { createAccountMailer } from '../../src/server/accountMailer';
import { paymentDetailsFromEnv } from '../../src/server/payment';
import { createBlobAccountStorage, createBlobSiteStorage, createBlobStorage } from '../../src/server/storage';
import { createRateLimiter } from '../../src/utils/lead';

/**
 * POST /api/account: register, login, logout, or ask who is logged in.
 *
 * The session lives in an httpOnly cookie; the browser never sees the
 * session id in JavaScript.
 */
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });
const registerLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

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

  const accounts = await createBlobAccountStorage();
  const sites = await createBlobSiteStorage();
  const leads = await createBlobStorage();
  const payment = paymentDetailsFromEnv(process.env);
  const sendMail = createAccountMailer(process.env);
  const result = await handleAccount(
    body,
    {
      accounts,
      sites,
      leads,
      sendMail,
      siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
      // De offertes van de klant staan in dezelfde opslag als de aanvragen.
      quotes: leads,
      ...(payment ? { payment } : {}),
      allowRequest: (key, now) =>
        key.startsWith('account-login-')
          ? loginLimiter(key, now)
          : registerLimiter(key, now),
    },
    req.headers.get('cookie'),
    true
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (result.setCookie) headers['Set-Cookie'] = result.setCookie;
  if (result.clearCookie) headers['Set-Cookie'] = result.clearCookie;
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
};

export const config = { path: '/api/account' };
