import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptQuote, reportPayment, requestQuote } from './quoteClient';

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

test('requestQuote stuurt het pakket, de extras en de gegevens van de klant', async () => {
  let called = '';
  const result = await requestQuote(
    {
      plan: 'pro',
      addons: ['trust-bar'],
      message: 'Een eigen .nl-domein, graag.',
      sector: 'schilder',
      style: 'klassiek',
      services: ['Binnenmuur schilderen'],
      form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0612345678', city: 'Haarlem' },
    },
    async (url, init) => {
      called = `${url} ${init?.method} ${String(init?.body)}`;
      return Response.json({
        ok: true,
        quote: { id: 'KB-2026-0001', path: '/offerte/KB-2026-0001?token=x', planName: 'Pro', totalCents: 120395 },
      });
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.quote?.id, 'KB-2026-0001');
  assert.match(called, /^\/api\/quote\/request POST /);
  assert.match(called, /"plan":"pro"/);
  assert.match(called, /"addons":\["trust-bar"\]/);
  assert.match(called, /"biz":"Jansen Schilderwerken"/);
});

test('requestQuote toont de fout van de server', async () => {
  const result = await requestQuote(
    {
      plan: 'pro',
      addons: [],
      form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '', city: '' },
    },
    async () => Response.json({ ok: false, error: 'Log in om een offerte aan te vragen.' }, { status: 401 })
  );

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /Log in/);
});

test('requestQuote overleeft een verbinding die wegvalt', async () => {
  const result = await requestQuote(
    {
      plan: 'pro',
      addons: [],
      form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '', city: '' },
    },
    async () => {
      throw new TypeError('Failed to fetch');
    }
  );

  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /Geen verbinding/);
});
