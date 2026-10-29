import { createAccountMailer } from '../../src/server/accountMailer';
import { handleAdmin } from '../../src/server/adminHandler';
import { createBlobAdminStorage } from '../../src/server/adminStorage';
import { invoiceDetailsFromEnv } from '../../src/server/invoice';
import { paymentDetailsFromEnv } from '../../src/server/payment';
import { createBlobAccountStorage, createBlobSiteStorage, createBlobStorage } from '../../src/server/storage';
import { createRateLimiter } from '../../src/utils/lead';

/**
 * POST /api/admin: the Klusbaas overview.
 *
 * Behind the password from `ADMIN_PASSWORD`. Without that variable the
 * overview cannot be opened at all.
 */
// Brute force op het beheerderswachtwoord: max 10 pogingen per kwartier per IP.
const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

export default async (req: Request, context: { ip?: string }): Promise<Response> => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'Alleen POST is toegestaan.' }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Ongeldige JSON.' }, { status: 400 });
  }

  const payment = paymentDetailsFromEnv(process.env);
  const invoice = invoiceDetailsFromEnv(process.env);
  const result = await handleAdmin(
    body,
    {
      env: { ADMIN_PASSWORD: process.env.ADMIN_PASSWORD },
      allowRequest: (key, now) => loginLimiter(key, now),
      ip: context.ip ?? req.headers.get('x-nf-client-connection-ip') ?? undefined,
      sessions: await createBlobAdminStorage(),
      sites: await createBlobSiteStorage(),
      leads: await createBlobStorage(),
      accounts: await createBlobAccountStorage(),
      // Een offerte die Klusbaas zelf schrijft gaat per mail naar de klant,
      // met de PDF erbij en de betaalgegevens.
      sendMail: createAccountMailer(process.env),
      ...(payment ? { payment } : {}),
      // Klusbaas' eigen gegevens, voor op de factuur.
      invoice,
      siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
    },
    req.headers.get('cookie'),
    true
  );

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (result.setCookie) headers['Set-Cookie'] = result.setCookie;
  if (result.clearCookie) headers['Set-Cookie'] = result.clearCookie;
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
};

export const config = { path: '/api/admin' };
