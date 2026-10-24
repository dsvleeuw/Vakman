import test from 'node:test';
import assert from 'node:assert/strict';
import { LEAD_NETWORK_ERROR, postLead } from './leadClient';

test('postLead returns the reference on success', async () => {
  const result = await postLead({ kind: 'contact' }, async (url, init) => {
    assert.equal(url, '/api/lead');
    assert.equal(init.method, 'POST');
    return Response.json({ ok: true, mode: 'preview', reference: 'L-ABC234', customerEmailSent: false });
  });
  assert.deepEqual(
    { ok: result.ok, ...(result.ok ? { reference: result.reference, preview: result.preview } : {}) },
    { ok: true, reference: 'L-ABC234', preview: true }
  );
});

test('postLead surfaces the server error message', async () => {
  const result = await postLead({}, async () => Response.json({ ok: false, error: 'Ongeldig telefoonnummer.' }, { status: 400 }));
  assert.deepEqual(result, { ok: false, error: 'Ongeldig telefoonnummer.' });
});

test('postLead maps network failures and non-JSON replies to Dutch errors', async () => {
  const offline = await postLead({}, async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.deepEqual(offline, { ok: false, error: LEAD_NETWORK_ERROR });
  const html = await postLead({}, async () => new Response('<html>404</html>', { status: 404 }));
  assert.equal(html.ok, false);
});
