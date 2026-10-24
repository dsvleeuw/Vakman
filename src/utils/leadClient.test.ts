import test from 'node:test';
import assert from 'node:assert/strict';
import { NETWORK_ERROR, describeDelivery, submitLead } from './leadClient';
import { quotePdfHref } from './quote';

test('submitLead returns the server body on success', async () => {
  const result = await submitLead({ type: 'contact' }, async (url, init) => {
    assert.equal(url, '/api/lead');
    assert.equal(init.method, 'POST');
    return Response.json({ ok: true, reference: 'L-ABCDEF' });
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.reference, 'L-ABCDEF');
});

test('submitLead turns server errors and network failures into Dutch messages', async () => {
  const invalid = await submitLead({}, async () =>
    Response.json({ ok: false, error: 'Ongeldig telefoonnummer.', field: 'phone' }, { status: 400 })
  );
  assert.deepEqual([invalid.ok, invalid.status, invalid.error, invalid.field], [false, 400, 'Ongeldig telefoonnummer.', 'phone']);

  const html = await submitLead({}, async () => new Response('<html>502</html>', { status: 502 }));
  assert.equal(html.ok, false);
  assert.equal(html.error, NETWORK_ERROR);

  const offline = await submitLead({}, async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.deepEqual([offline.ok, offline.status], [false, 0]);
});

test('describeDelivery explains what happened to the confirmation mail', () => {
  const base = { ok: true, status: 200 };
  const team = { to: 'team@x.nl', status: 'sent' as const };
  assert.match(describeDelivery({ ...base, delivery: { team, customer: { to: 'a@b.nl', status: 'sent' } } }), /a@b\.nl/);
  assert.match(describeDelivery({ ...base, delivery: { team, customer: { to: 'a@b.nl', status: 'failed' } } }), /binnen/);
  assert.match(describeDelivery({ ...base, delivery: { team, customer: { to: 'a@b.nl', status: 'preview' } } }), /Testmodus/);
  assert.match(describeDelivery(base), /ontvangen/);
});

test('quotePdfHref builds the PDF link from a quote path', () => {
  assert.equal(
    quotePdfHref('/offerte/KB-2026-0001?token=a%2Bb'),
    '/api/quote?id=KB-2026-0001&token=a%2Bb&format=pdf'
  );
});
