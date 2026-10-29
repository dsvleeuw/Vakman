import { handleLead } from '../../src/server/leadHandler';
import { createBlobSiteStorage, createBlobStorage } from '../../src/server/storage';

/** POST /api/lead: every form (wizard quote, afspraak, contact, storing, m²). */
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
  const result = await handleLead(body, context.ip ?? req.headers.get('x-nf-client-connection-ip') ?? '', {
    env: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      QUOTE_FROM_EMAIL: process.env.QUOTE_FROM_EMAIL,
      QUOTE_NOTIFY_EMAIL: process.env.QUOTE_NOTIFY_EMAIL,
      MAIL_TEST_RECIPIENT: process.env.MAIL_TEST_RECIPIENT,
    },
    storage: await createBlobStorage(),
    // Met de sites kan een aanvraag op een gepubliceerde klantsite naar de
    // vakman zelf gaan, in plaats van naar Klusbaas.
    sites: await createBlobSiteStorage(),
    // Netlify sets URL to the production site URL; links in mails must never point at a preview or function host.
    siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin,
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/lead' };
