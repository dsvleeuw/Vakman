import { handleLead } from '../../src/server/lead';
import { createBlobStore } from '../../src/server/store';

/** POST /api/lead — every form in the app: save the lead, mail us and the visitor. */
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
  const result = await handleLead(body, {
    env: {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      QUOTE_FROM_EMAIL: process.env.QUOTE_FROM_EMAIL,
      QUOTE_NOTIFY_EMAIL: process.env.QUOTE_NOTIFY_EMAIL,
      MAIL_TEST_RECIPIENT: process.env.MAIL_TEST_RECIPIENT,
    },
    leads: await createBlobStore('leads'),
    quotes: await createBlobStore('quotes'),
    // Quote links in mails: PUBLIC_SITE_URL, else the site's main address
    // (Netlify's URL, also on deploy previews, where quotes live in the same store).
    siteUrl: process.env.PUBLIC_SITE_URL || process.env.URL || 'https://vakmanschap.netlify.app',
    clientKey: context.ip,
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/lead' };
