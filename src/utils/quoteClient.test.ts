import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptQuote, reportPayment } from './quoteClient';

test('acceptQuote stuurt het offertenummer, de token en de naam', async () => {
  let called = '';
  const result = await acceptQuote('KB-2026-0001', 'token123', 'Jan Jansen', async (url, init) => {
    called = `${url} ${init?.method} ${String(init?.body)}`;
    return Response.json({ ok: true, quote: { id: 'KB-2026-0001', status: 'accepted' } });
  });

  assert.equal(result.ok, true);
  assert.equal(result.quote?.status, 'accepted');
  assert.match(called, /^\/api\/quote\/accept POST /);
  assert.match(called, /"id":"KB-2026-0001"/);
  assert.match(called, /"token":"token123"/);
  assert.match(called, /"name":"Jan Jansen"/);
});

test('acceptQuote toont de fout van de server', async () => {
  const result = await acceptQuote('KB-2026-0001', 'token123', 'Jan Jansen', async () =>
    Response.json({ ok: false, error: 'Deze offerte is verlopen.' }, { status: 409 })
  );

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /verlopen/);
});

test('reportPayment stuurt het offertenummer en de token', async () => {
  let called = '';
  const result = await reportPayment('KB-2026-0001', 'token123', async (url, init) => {
    called = `${url} ${init?.method} ${String(init?.body)}`;
    return Response.json({ ok: true, quote: { id: 'KB-2026-0001', status: 'accepted' } });
  });

  assert.equal(result.ok, true);
  assert.match(called, /^\/api\/quote\/payment POST /);
  assert.match(called, /"id":"KB-2026-0001"/);
  assert.match(called, /"token":"token123"/);
});

test('reportPayment toont de fout van de server', async () => {
  const result = await reportPayment('KB-2026-0001', 'token123', async () =>
    Response.json({ ok: false, error: 'Deze offerte is al betaald.' }, { status: 400 })
  );

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /al betaald/);
});

test('acceptQuote overleeft een verbinding die wegvalt', async () => {
  const result = await acceptQuote('KB-2026-0001', 'token123', 'Jan Jansen', async () => {
    throw new TypeError('Failed to fetch');
  });

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /Geen verbinding/);
});
