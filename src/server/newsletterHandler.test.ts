import test from 'node:test';
import assert from 'node:assert/strict';
import type { DeliveryResult, OutgoingMail } from './mailer';
import {
  SIGNUP_MESSAGE,
  handleNewsletterConfirm,
  handleNewsletterSignup,
  handleNewsletterUnsubscribe,
  type NewsletterDeps,
} from './newsletterHandler';
import { createMemoryNewsletterStorage } from './newsletterStorage';

const TOKEN_A = 'A'.repeat(32);
const TOKEN_B = 'B'.repeat(32);

function setup(overrides: Partial<NewsletterDeps> = {}) {
  const storage = createMemoryNewsletterStorage();
  const sent: OutgoingMail[] = [];
  const calls: { url: string; init: RequestInit }[] = [];
  const tokens = [TOKEN_A, TOKEN_B];
  let now = new Date('2026-10-24T10:00:00Z');
  const deps: NewsletterDeps = {
    env: {},
    storage,
    siteUrl: 'https://klusbaas.test',
    sendMail: async (mail): Promise<DeliveryResult> => {
      sent.push(mail);
      return { to: mail.to, status: 'preview' };
    },
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response('{}', { status: 200 });
    },
    log: () => undefined,
    now: () => now,
    createToken: () => tokens.shift() ?? 'Z'.repeat(32),
    allowRequest: () => true,
    ...overrides,
  };
  return { deps, storage, sent, calls, setNow: (date: Date) => (now = date) };
}

test('signup stores a pending subscriber and mails a confirmation link', async () => {
  const { deps, storage, sent } = setup();
  const result = await handleNewsletterSignup({ email: '  Piet@Example.NL ', source: 'footer' }, 'ip', deps);
  assert.equal(result.status, 200);
  assert.equal(result.body.message, SIGNUP_MESSAGE);
  const record = await storage.getByEmail('piet@example.nl');
  assert.equal(record?.status, 'pending');
  assert.equal(record?.source, 'footer');
  assert.ok(record?.consentText.includes('Afmelden kan altijd'));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'piet@example.nl');
  assert.ok(sent[0].text.includes(`https://klusbaas.test/api/newsletter/confirm?token=${TOKEN_A}`));
  assert.ok(sent[0].html.includes(`https://klusbaas.test/afmelden?token=${TOKEN_A}`));
  assert.ok(sent[0].html.includes('https://klusbaas.test/privacy'));
});

test('signup rejects bad input, fakes success for the honeypot and rate limits', async () => {
  const { deps, sent, storage } = setup();
  assert.equal((await handleNewsletterSignup({ email: 'geen-adres' }, 'ip', deps)).status, 400);
  assert.equal((await handleNewsletterSignup(null, 'ip', deps)).status, 400);
  const spam = await handleNewsletterSignup({ email: 'bot@example.nl', website: 'http://spam' }, 'ip', deps);
  assert.equal(spam.status, 200);
  assert.equal(storage.records.size, 0);
  assert.equal(sent.length, 0);

  const limited = setup({ allowRequest: () => false });
  assert.equal((await handleNewsletterSignup({ email: 'a@example.nl' }, 'ip', limited.deps)).status, 429);
});

test('confirm subscribes once, adds the Resend contact and handles bad tokens', async () => {
  const { deps, storage, calls } = setup({ env: { RESEND_API_KEY: 're_test', RESEND_AUDIENCE_ID: 'aud_1' } });
  await handleNewsletterSignup({ email: 'piet@example.nl' }, 'ip', deps);
  const first = await handleNewsletterConfirm(TOKEN_A, deps);
  assert.deepEqual(first, { status: 'bevestigd', location: '/nieuwsbrief?status=bevestigd' });
  assert.equal((await storage.getByEmail('piet@example.nl'))?.status, 'subscribed');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/audiences/aud_1/contacts');
  assert.equal(calls[0].init.method, 'POST');

  assert.equal((await handleNewsletterConfirm(TOKEN_A, deps)).status, 'al-bevestigd');
  assert.equal((await handleNewsletterConfirm('kort', deps)).status, 'ongeldig');
  assert.equal((await handleNewsletterConfirm(TOKEN_B, deps)).status, 'ongeldig');
  assert.equal((await handleNewsletterConfirm(null, deps)).status, 'ongeldig');
});

test('an already confirmed address gets no new mail; an expired signup gets a new token', async () => {
  const { deps, sent } = setup();
  await handleNewsletterSignup({ email: 'piet@example.nl' }, 'ip', deps);
  await handleNewsletterConfirm(TOKEN_A, deps);
  const again = await handleNewsletterSignup({ email: 'piet@example.nl' }, 'ip', deps);
  assert.equal(again.body.message, SIGNUP_MESSAGE);
  assert.equal(sent.length, 1);

  const other = setup();
  await handleNewsletterSignup({ email: 'jan@example.nl' }, 'ip', other.deps);
  other.setNow(new Date('2026-12-01T10:00:00Z'));
  assert.equal((await handleNewsletterConfirm(TOKEN_A, other.deps)).status, 'verlopen');
  await handleNewsletterSignup({ email: 'jan@example.nl' }, 'ip', other.deps);
  assert.ok(other.sent[1].text.includes(TOKEN_B));
  assert.equal((await handleNewsletterConfirm(TOKEN_A, other.deps)).status, 'ongeldig');
  assert.equal((await handleNewsletterConfirm(TOKEN_B, other.deps)).status, 'bevestigd');
});

test('unsubscribe marks the subscriber and updates the Resend contact', async () => {
  const { deps, storage, calls } = setup({ env: { RESEND_API_KEY: 're_test', RESEND_AUDIENCE_ID: 'aud_1' } });
  await handleNewsletterSignup({ email: 'piet@example.nl' }, 'ip', deps);
  await handleNewsletterConfirm(TOKEN_A, deps);
  const result = await handleNewsletterUnsubscribe({ token: TOKEN_A }, deps);
  assert.deepEqual(result, { status: 200, body: { ok: true, status: 'afgemeld' } });
  assert.equal((await storage.getByEmail('piet@example.nl'))?.status, 'unsubscribed');
  assert.equal(calls.at(-1)?.url, 'https://api.resend.com/audiences/aud_1/contacts/piet%40example.nl');
  assert.equal(calls.at(-1)?.init.method, 'PATCH');

  assert.equal((await handleNewsletterUnsubscribe({ token: TOKEN_A }, deps)).body.status, 'al-afgemeld');
  assert.equal((await handleNewsletterUnsubscribe({ token: 'x' }, deps)).status, 400);
  assert.equal((await handleNewsletterUnsubscribe({ token: TOKEN_B }, deps)).status, 404);
  // A confirmation link no longer works after unsubscribing.
  assert.equal((await handleNewsletterConfirm(TOKEN_A, deps)).status, 'ongeldig');
});

test('without an API key the confirmation runs in preview mode', async () => {
  const { deps } = setup({ sendMail: undefined });
  const logs: string[] = [];
  deps.log = (message) => logs.push(message);
  const result = await handleNewsletterSignup({ email: 'piet@example.nl' }, 'ip', deps);
  assert.equal(result.body.mode, 'preview');
  assert.ok(logs.some((line) => line.includes('PREVIEW -> p***@example.nl')));
  assert.ok(logs.every((line) => !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line)));
  assert.ok(logs.every((line) => !line.includes('https://klusbaas.test/api/newsletter/confirm')));
});
