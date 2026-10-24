import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../utils/rateLimit';
import { handleLead, type LeadDeps } from './lead';
import { createMemoryStore } from './store';

const NOW = 1_800_000_000_000;

const quoteBody = {
  kind: 'offerte',
  startedAt: NOW - 60_000,
  sector: 'loodgieter',
  styleIndex: 2,
  plan: 'basis',
  addons: ['price-calculator', 'trust-bar'],
  services: ['Lekkage verhelpen'],
  form: { biz: 'Lekvrij', owner: 'Sanne Jansen', phone: '06 12345678', city: 'Hoofddorp', email: 'sanne@example.nl' },
  channel: 'E-mail',
  appointment: { date: 'maandag 2 november', slot: 'Ochtend' },
};

const contactBody = {
  kind: 'contact',
  startedAt: NOW - 60_000,
  site: { biz: 'Lekvrij', sector: 'loodgieter' },
  name: 'Piet',
  phone: '0612345678',
  message: 'Mijn kraan lekt al een week.',
};

function deps(overrides: Partial<LeadDeps> = {}) {
  const leads = createMemoryStore();
  const quotes = createMemoryStore();
  const logs: string[] = [];
  return {
    leads,
    quotes,
    logs,
    deps: {
      env: {},
      leads,
      quotes,
      siteUrl: 'https://klusbaas.test',
      now: () => NOW,
      log: (message: string) => logs.push(message),
      rateLimiter: createRateLimiter({ limit: 100, windowMs: 1000 }),
      fetchImpl: async () => {
        throw new Error('should not fetch');
      },
      ...overrides,
    } satisfies LeadDeps,
  };
}

test('handleLead saves the lead and previews mails without an API key', async () => {
  const { deps: d, leads, logs } = deps();
  const result = await handleLead(contactBody, d);
  assert.equal(result.status, 200);
  assert.equal(result.body.mode, 'preview');
  assert.equal(leads.data.size, 1);
  assert.ok(logs.some((line) => line.includes('PREVIEW') && line.includes('Contactformulier')));
});

test('handleLead mails the team and the customer via Resend', async () => {
  const calls: { to: string[]; reply_to?: string; attachments?: { filename: string; content: string }[]; text: string }[] = [];
  const { deps: d, quotes } = deps({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' },
    fetchImpl: async (_url, init) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response('{}', { status: 200 });
    },
  });
  const result = await handleLead(quoteBody, d);
  assert.equal(result.body.mode, 'sent');
  assert.equal(result.body.customerEmailSent, true);
  assert.deepEqual(calls.map((call) => call.to[0]), ['team@example.nl', 'sanne@example.nl']);
  assert.equal(calls[0].reply_to, 'sanne@example.nl');

  // Numbered, stored, attached to both mails and linked with a private token.
  assert.equal(result.body.reference, 'KB-2027-0001');
  assert.match(result.body.quoteUrl ?? '', /^\/offerte\/KB-2027-0001\?token=[0-9a-f]{64}$/);
  assert.ok(quotes.data.has('KB-2027-0001'));
  assert.ok(quotes.data.get('KB-2027-0001.pdf') instanceof Uint8Array);
  for (const call of calls) {
    assert.equal(call.attachments?.[0].filename, 'Offerte-KB-2027-0001.pdf');
    assert.equal((call.attachments?.[0] as { content_type?: string }).content_type, 'application/pdf');
    assert.ok(Buffer.from(call.attachments![0].content, 'base64').subarray(0, 5).toString() === '%PDF-');
    assert.ok(call.text.includes(`https://klusbaas.test${result.body.quoteUrl}`));
  }
});

test('quote numbers count up per year and survive a taken number', async () => {
  const { deps: d, quotes } = deps();
  await quotes.set('KB-2027-0002', { taken: true });
  const first = await handleLead(quoteBody, d);
  const second = await handleLead(quoteBody, d);
  assert.equal(first.body.reference, 'KB-2027-0001');
  assert.equal(second.body.reference, 'KB-2027-0003');
});

test('a refused customer mail (Resend test mode) does not fail the lead', async () => {
  const { deps: d, leads } = deps({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' },
    fetchImpl: async (_url, init) =>
      JSON.parse(String(init.body)).to[0] === 'team@example.nl'
        ? new Response('{}', { status: 200 })
        : new Response('{"message":"You can only send testing emails to your own email address"}', { status: 403 }),
  });
  const result = await handleLead(quoteBody, d);
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.customerEmailSent, false);
  assert.deepEqual(result.body.mail, { team: 'sent', customer: 'refused' });
  const [saved] = [...leads.data.values()] as { teamEmailSent: boolean }[];
  assert.equal(saved.teamEmailSent, true);
});

test('a failed team mail is reported but the lead stays saved', async () => {
  const { deps: d, leads } = deps({
    env: { RESEND_API_KEY: 'k' },
    fetchImpl: async () => new Response('nope', { status: 500 }),
  });
  const result = await handleLead(contactBody, d);
  assert.equal(result.status, 502);
  assert.equal(leads.data.size, 1);
});

test('spam is answered with fake success and never saved', async () => {
  const { deps: d, leads } = deps();
  const bot = await handleLead({ ...contactBody, website: 'spam' }, d);
  assert.equal(bot.body.ok, true);
  const fast = await handleLead({ ...contactBody, startedAt: NOW - 100 }, d);
  assert.equal(fast.body.ok, true);
  assert.equal(leads.data.size, 0);
});

test('invalid input is a 400 and the rate limit a 429', async () => {
  const { deps: d } = deps({ rateLimiter: createRateLimiter({ limit: 1, windowMs: 60_000 }), clientKey: '1.2.3.4' });
  assert.equal((await handleLead({ ...contactBody, phone: '123' }, d)).status, 400);
  assert.equal((await handleLead(contactBody, d)).status, 200);
  assert.equal((await handleLead(contactBody, d)).status, 429);
});

test('channel WhatsApp: no customer mail, our mail carries a one-tap WhatsApp link', async () => {
  const calls: { to: string[]; text: string }[] = [];
  const { deps: d } = deps({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' },
    fetchImpl: async (_url, init) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response('{}', { status: 200 });
    },
  });
  const result = await handleLead({ ...quoteBody, channel: 'WhatsApp', form: { ...quoteBody.form, email: '' } }, d);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.delivery, { email: false, whatsapp: true });
  assert.deepEqual(calls.map((call) => call.to[0]), ['team@example.nl']);
  assert.match(calls[0].text, /Via WhatsApp sturen: https:\/\/wa\.me\/31612345678\?text=/);
});

test('channel E-mail: customer mail, no WhatsApp link for us', async () => {
  const calls: { to: string[]; text: string }[] = [];
  const { deps: d } = deps({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl' },
    fetchImpl: async (_url, init) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response('{}', { status: 200 });
    },
  });
  await handleLead(quoteBody, d);
  assert.equal(calls.length, 2);
  assert.ok(!calls[0].text.includes('wa.me'));
});

test('MAIL_TEST_RECIPIENT sends the customer mail to the test inbox, marked as test', async () => {
  const calls: { to: string[]; subject: string; text: string; html: string }[] = [];
  const { deps: d } = deps({
    env: { RESEND_API_KEY: 'test', QUOTE_NOTIFY_EMAIL: 'team@example.nl', MAIL_TEST_RECIPIENT: 'team@example.nl' },
    fetchImpl: async (_url, init) => {
      calls.push(JSON.parse(String(init.body)));
      return new Response('{}', { status: 200 });
    },
  });
  const result = await handleLead(quoteBody, d);
  assert.deepEqual(result.body.mail, { team: 'sent', customer: 'sent' });
  assert.deepEqual(calls.map((call) => call.to[0]), ['team@example.nl', 'team@example.nl']);
  assert.match(calls[1].subject, /^\[TEST → sanne@example\.nl\] /);
  assert.match(calls[1].text, /^TESTMAIL: bedoeld voor sanne@example\.nl/);
  assert.ok(calls[1].html.includes('TESTMAIL: bedoeld voor sanne@example.nl'));
  assert.ok(!calls[0].subject.startsWith('[TEST'));
});
