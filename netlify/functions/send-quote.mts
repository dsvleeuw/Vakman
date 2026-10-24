import { handleSendQuote } from '../../src/server/sendQuote';

/** POST /api/send-quote — e-mails a wizard quote to Klusbaas and the customer. */
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
  const result = await handleSendQuote(body, {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    QUOTE_FROM_EMAIL: process.env.QUOTE_FROM_EMAIL,
    QUOTE_NOTIFY_EMAIL: process.env.QUOTE_NOTIFY_EMAIL,
  });
  return Response.json(result.body, { status: result.status });
};

export const config = { path: '/api/send-quote' };
