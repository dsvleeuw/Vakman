import test from 'node:test';
import assert from 'node:assert/strict';
import { NEWSLETTER_NETWORK_ERROR, subscribeNewsletter, unsubscribeNewsletter } from './newsletterClient';

test('subscribeNewsletter posts JSON and passes the server message on', async () => {
  let seen: { url: string; body: string } | null = null;
  const result = await subscribeNewsletter({ email: 'a@b.nl', source: 'footer', website: '' }, async (url, init) => {
    seen = { url, body: String(init.body) };
    return Response.json({ ok: true, message: 'Bijna klaar!' });
  });
  assert.deepEqual(seen, { url: '/api/newsletter', body: '{"email":"a@b.nl","source":"footer","website":""}' });
  assert.deepEqual(result, { ok: true, status: 200, message: 'Bijna klaar!' });
});

test('newsletter client turns server and network errors into Dutch messages', async () => {
  const bad = await subscribeNewsletter({ email: 'x', source: 'footer' }, async () =>
    Response.json({ ok: false, error: 'Dit e-mailadres klopt niet.' }, { status: 400 })
  );
  assert.deepEqual(bad, { ok: false, status: 400, error: 'Dit e-mailadres klopt niet.' });
  const offline = await unsubscribeNewsletter('t', async () => {
    throw new Error('offline');
  });
  assert.deepEqual(offline, { ok: false, status: 0, error: NEWSLETTER_NETWORK_ERROR });
  const done = await unsubscribeNewsletter('t', async () => Response.json({ ok: true, status: 'afgemeld' }));
  assert.equal(done.result, 'afgemeld');
});
