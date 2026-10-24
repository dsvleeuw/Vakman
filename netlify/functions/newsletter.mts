import {
  handleNewsletterConfirm,
  handleNewsletterSignup,
  handleNewsletterUnsubscribe,
  type NewsletterDeps,
} from '../../src/server/newsletterHandler';
import { createBlobNewsletterStorage } from '../../src/server/newsletterStorage';

/**
 * Newsletter with double opt-in:
 *   POST /api/newsletter                  { email, source, website }
 *   GET  /api/newsletter/confirm?token=…  → 303 to /nieuwsbrief?status=…
 *   POST /api/newsletter/unsubscribe      { token }
 */
export default async (req: Request, context: { ip?: string }): Promise<Response> => {
  const url = new URL(req.url);
  const deps: NewsletterDeps = {
    env: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      QUOTE_FROM_EMAIL: process.env.QUOTE_FROM_EMAIL,
      RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,
    },
    storage: await createBlobNewsletterStorage(),
    siteUrl: process.env.PUBLIC_SITE_URL || url.origin,
  };
  const noStore = { 'Cache-Control': 'no-store' };
  const readJson = async (): Promise<unknown> => {
    try {
      return await req.json();
    } catch {
      return undefined;
    }
  };

  if (url.pathname === '/api/newsletter/confirm') {
    if (req.method !== 'GET') return Response.json({ ok: false, error: 'Alleen GET is toegestaan.' }, { status: 405 });
    const result = await handleNewsletterConfirm(url.searchParams.get('token'), deps);
    if (url.searchParams.get('format') === 'json') return Response.json(result, { headers: noStore });
    return new Response(null, { status: 303, headers: { Location: result.location, ...noStore } });
  }

  if (req.method !== 'POST') return Response.json({ ok: false, error: 'Alleen POST is toegestaan.' }, { status: 405 });

  if (url.pathname === '/api/newsletter/unsubscribe') {
    const result = await handleNewsletterUnsubscribe(await readJson(), deps);
    return Response.json(result.body, { status: result.status, headers: noStore });
  }

  const ip = context.ip ?? req.headers.get('x-nf-client-connection-ip') ?? '';
  const result = await handleNewsletterSignup(await readJson(), ip, deps);
  return Response.json(result.body, { status: result.status, headers: noStore });
};

export const config = { path: ['/api/newsletter', '/api/newsletter/confirm', '/api/newsletter/unsubscribe'] };
