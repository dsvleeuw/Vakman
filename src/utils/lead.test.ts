import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_FILL_TIME_MS, checkSpam, createLeadReference, leadContact, parseLeadRequest } from './lead';
import { buildLeadCustomerEmail, buildLeadTeamEmail } from './leadEmail';
import { createRateLimiter } from './rateLimit';

const site = { biz: 'Schildersbedrijf Jansen', sector: 'schilder', path: '/voorbeeld/schilder/modern' };

test('checkSpam rejects honeypot fills and instant submissions', () => {
  const now = 1_000_000;
  assert.equal(checkSpam({ startedAt: now - MIN_FILL_TIME_MS }, now), 'ok');
  assert.equal(checkSpam({ startedAt: now - 500 }, now), 'too-fast');
  assert.equal(checkSpam({}, now), 'too-fast');
  assert.equal(checkSpam({ startedAt: now + 10_000 }, now), 'too-fast');
  assert.equal(checkSpam({ startedAt: now - 60_000, website: 'http://spam' }, now), 'honeypot');
});

test('parseLeadRequest validates the contact form', () => {
  const ok = parseLeadRequest({ kind: 'contact', site, name: ' Sanne ', phone: '06 12345678', message: 'Drie kozijnen schilderen' });
  assert.ok(ok.ok);
  if (ok.ok && ok.lead.kind === 'contact') {
    assert.equal(ok.lead.name, 'Sanne');
    assert.equal(ok.lead.site.sector, 'schilder');
    assert.equal(ok.lead.email, undefined);
  }
  assert.equal(parseLeadRequest({ kind: 'contact', site, name: 'S', phone: '123', message: 'Drie kozijnen schilderen' }).ok, false);
  assert.equal(parseLeadRequest({ kind: 'contact', site, name: 'S', phone: '0612345678', message: 'kort' }).ok, false);
  assert.equal(
    parseLeadRequest({ kind: 'contact', site, name: 'S', phone: '0612345678', email: 'geen', message: 'Drie kozijnen schilderen' }).ok,
    false
  );
});

test('parseLeadRequest rejects unknown kinds and missing site context', () => {
  assert.equal(parseLeadRequest(null).ok, false);
  assert.equal(parseLeadRequest({ kind: 'nieuwsbrief' }).ok, false);
  assert.equal(parseLeadRequest({ kind: 'contact', name: 'S', phone: '0612345678', message: 'Drie kozijnen' }).ok, false);
});

test('parseLeadRequest handles storing, oppervlak and afspraak', () => {
  const storing = parseLeadRequest({
    kind: 'storing', site, name: 'Piet', phone: '+31 6 12345678', address: 'Dorpsstraat 1, Hoofddorp',
    faultType: 'Kortsluiting', since: 'Vandaag', urgency: 'Nu', details: '',
  });
  assert.ok(storing.ok);
  assert.equal(parseLeadRequest({ kind: 'storing', site, name: 'Piet', phone: '0612345678', address: '' }).ok, false);

  const surface = parseLeadRequest({
    kind: 'oppervlak', site, name: 'Ans', phone: '0612345678', serviceName: 'Muren sausen',
    pricePerM2: 12, surfaceM2: 13, totalPrice: 156, wallCount: 1, openings: -4,
  });
  assert.ok(surface.ok);
  if (surface.ok && surface.lead.kind === 'oppervlak') assert.equal(surface.lead.openings, 0);

  assert.ok(parseLeadRequest({ kind: 'afspraak', site, name: 'Ans', phone: '0612345678', address: 'Kerkweg 2', date: 'ma 2 nov' }).ok);
  assert.equal(parseLeadRequest({ kind: 'afspraak', site, name: 'Ans', phone: '0612345678', address: 'Kerkweg 2' }).ok, false);
});

test('lead mails carry the details and escape HTML', () => {
  const parsed = parseLeadRequest({
    kind: 'contact', site: { ...site, biz: '<i>Jansen</i>' }, name: 'Sanne', phone: '0612345678',
    email: 'sanne@example.nl', message: 'Graag <b>offerte</b> voor kozijnen',
  });
  assert.ok(parsed.ok);
  if (!parsed.ok || parsed.lead.kind === 'offerte') return;
  const team = buildLeadTeamEmail(parsed.lead, 'L-TEST01');
  assert.match(team.subject, /Contactformulier.*L-TEST01/);
  assert.match(team.text, /Telefoon: 0612345678/);
  assert.ok(team.html.includes('&lt;b&gt;offerte&lt;/b&gt;'));
  assert.ok(!team.html.includes('<i>Jansen</i>'));
  assert.match(buildLeadCustomerEmail(parsed.lead, 'L-TEST01').text, /Hoi Sanne/);
  assert.deepEqual(leadContact(parsed.lead), { name: 'Sanne', phone: '0612345678', email: 'sanne@example.nl' });
});

test('createLeadReference', () => {
  assert.match(createLeadReference(), /^L-[A-Z2-9]{6}$/);
});

test('rate limiter allows the limit per window, per key', () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(limiter.allow('a', 0), true);
  assert.equal(limiter.allow('a', 10), true);
  assert.equal(limiter.allow('a', 20), false);
  assert.equal(limiter.allow('b', 20), true);
  assert.equal(limiter.allow('a', 1001), true);
});
