import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNewsletterConfirmEmail,
  isNewsletterPageStatus,
  isNewsletterToken,
  isPendingExpired,
  normalizeEmail,
  parseNewsletterSignup,
  type SubscriberRecord,
} from './newsletter';

test('parseNewsletterSignup normalises, validates and spots the honeypot', () => {
  assert.deepEqual(parseNewsletterSignup({ email: ' Jan@Voorbeeld.NL ', source: 'footer' }), {
    kind: 'ok',
    email: 'jan@voorbeeld.nl',
    source: 'footer',
  });
  assert.deepEqual(parseNewsletterSignup({ email: 'jan@voorbeeld.nl', source: 'iets' }), {
    kind: 'ok',
    email: 'jan@voorbeeld.nl',
    source: 'nieuwsbrief',
  });
  assert.equal(parseNewsletterSignup({ email: '' }).kind, 'invalid');
  assert.equal(parseNewsletterSignup({ email: 'jan@' }).kind, 'invalid');
  assert.equal(parseNewsletterSignup({ email: `${'a'.repeat(160)}@x.nl` }).kind, 'invalid');
  assert.equal(parseNewsletterSignup('tekst').kind, 'invalid');
  assert.equal(parseNewsletterSignup({ email: 'jan@voorbeeld.nl', website: 'x' }).kind, 'spam');
  assert.equal(normalizeEmail('  A@B.NL '), 'a@b.nl');
});

test('tokens and page statuses are recognised strictly', () => {
  assert.equal(isNewsletterToken('a'.repeat(32)), true);
  assert.equal(isNewsletterToken('a'.repeat(31)), false);
  assert.equal(isNewsletterToken('a'.repeat(31) + '/'), false);
  assert.equal(isNewsletterToken(null), false);
  assert.equal(isNewsletterPageStatus('bevestigd'), true);
  assert.equal(isNewsletterPageStatus('hack'), false);
});

test('pending signups expire after 30 days', () => {
  const record: SubscriberRecord = {
    email: 'a@b.nl',
    status: 'pending',
    token: 't'.repeat(32),
    createdAt: '2026-01-01T00:00:00Z',
    requestedAt: '2026-01-01T00:00:00Z',
    source: 'footer',
    consentText: 'ja',
  };
  assert.equal(isPendingExpired(record, new Date('2026-01-30T00:00:00Z')), false);
  assert.equal(isPendingExpired(record, new Date('2026-02-01T00:00:00Z')), true);
  assert.equal(isPendingExpired({ ...record, status: 'subscribed' }, new Date('2027-01-01T00:00:00Z')), false);
});

test('confirmation mail has the confirm button, unsubscribe and privacy links', () => {
  const mail = buildNewsletterConfirmEmail('https://klusbaas.nl/', 'T'.repeat(32));
  assert.match(mail.subject, /Bevestig je aanmelding/);
  assert.ok(mail.html.includes(`href="https://klusbaas.nl/api/newsletter/confirm?token=${'T'.repeat(32)}"`));
  assert.ok(mail.html.includes('Ja, meld me aan'));
  assert.ok(mail.html.includes(`https://klusbaas.nl/afmelden?token=${'T'.repeat(32)}`));
  assert.ok(mail.html.includes('https://klusbaas.nl/privacy'));
  assert.ok(mail.html.includes('klusbaas-logo-email.png'));
  assert.match(mail.text, /Afmelden: https:\/\/klusbaas\.nl\/afmelden\?token=/);
});
