import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteRecord } from '../utils/quote';
import { buildQuoteRecord } from '../utils/quote';
import { handleAcceptQuote } from './acceptQuote';
import type { LeadStorage } from './storage';

const TOKEN = 'offertetoken1234567890';

/** The offers in memory. */
function memoryStorage(quotes: QuoteRecord[]): LeadStorage {
  const map = new Map(quotes.map((quote) => [quote.id, quote]));
  return {
    async nextQuoteSequence(year) {
      return map.size + 1;
    },
    async saveQuote(record) {
      map.set(record.id, record);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return map.get(id) ?? null;
    },
    async getQuotePdf() {
      return null;
    },
    async saveLead(reference) {
      return `memory:${reference}`;
    },
    async listLeads() {
      return [];
    },
    async listQuotes() {
      return [...map.values()];
    },
    async updateQuoteStatus(id, status) {
      const record = map.get(id);
      if (!record) return null;
      const updated: QuoteRecord = {
        ...record,
        status,
        ...(status === 'paid' ? { paidAt: new Date().toISOString() } : { paidAt: undefined }),
        ...(status === 'accepted' ? { acceptedAt: new Date().toISOString() } : { acceptedAt: undefined }),
      };
      map.set(id, updated);
      return updated;
    },
    async linkQuoteToAccount(id, accountId) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, accountId };
      map.set(id, updated);
      return updated;
    },
    async extendQuote(id, validUntil) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, validUntil };
      map.set(id, updated);
      return updated;
    },
    async markPaymentReported(id, reportedAt) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, paymentReportedAt: reportedAt };
      map.set(id, updated);
      return updated;
    },
    async updateQuoteDelivery(id, delivery) {
      const record = map.get(id);
      if (!record) return null;
      const updated = { ...record, delivery };
      map.set(id, updated);
      return updated;
    },
  };
}

function offer(): QuoteRecord {
  return buildQuoteRecord({
    id: 'KB-2026-0001',
    token: TOKEN,
    now: '2026-10-29T10:00:00.000Z',
    planId: 'pro',
    addons: [],
    customer: {
      biz: 'Jansen Schilderwerken',
      owner: 'Jan Jansen',
      phone: '0612345678',
      city: 'Haarlem',
      email: 'jan@jansen.nl',
    },
    sector: 'schilder',
    sectorName: 'Schilder',
    styleName: 'Vakwerk',
    services: ['Binnenmuur schilderen'],
    channel: 'E-mail',
  });
}

test('de klant kan de offerte accepteren; de status wordt "accepted"', async () => {
  const storage = memoryStorage([offer()]);
  const mails: { to: string; subject: string; text: string }[] = [];

  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    {
      storage,
      sendMail: async (mail) => {
        mails.push(mail);
        return { to: mail.to, status: 'sent' };
      },
      notifyEmail: 'team@klusbaas.nl',
      siteUrl: 'https://klusbaas.nl',
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.quote?.status, 'accepted');
  const stored = await storage.getQuote('KB-2026-0001');
  assert.equal(stored?.status, 'accepted');
  assert.ok(stored?.acceptedAt, 'het moment van accepteren staat in de offerte');
  // Klusbaas moet het weten.
  const toTeam = mails.filter((mail) => mail.to === 'team@klusbaas.nl');
  assert.equal(toTeam.length, 1);
  assert.match(toTeam[0].subject, /KB-2026-0001/);
  assert.match(toTeam[0].text, /Jan Jansen/);
  // En de klant krijgt een bevestiging: zijn "ja" is het duurzaamste bewijs.
  const toCustomer = mails.filter((mail) => mail.to === 'jan@jansen.nl');
  assert.equal(toCustomer.length, 1);
  assert.match(toCustomer[0].subject, /KB-2026-0001/);
  assert.match(toCustomer[0].text, /offerte\/KB-2026-0001\?token=offertetoken1234567890/);
  assert.match(toCustomer[0].text, /1\.203,95/);
});

test('de klant krijgt de betaalgegevens in zijn bevestiging', async () => {
  const storage = memoryStorage([offer()]);
  const mails: { to: string; subject: string; text: string }[] = [];

  await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    {
      storage,
      sendMail: async (mail) => {
        mails.push(mail);
        return { to: mail.to, status: 'sent' };
      },
      payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
    }
  );

  const toCustomer = mails.find((mail) => mail.to === 'jan@jansen.nl');
  assert.ok(toCustomer, 'de klant krijgt een bevestiging');
  assert.match(toCustomer.text, /NL91ABNA0417164300/);
  assert.match(toCustomer.text, /Omschrijving: KB-2026-0001/);
});

test('zonder e-mailadres van de klant gaat er geen bevestiging naar hem', async () => {
  const storage = memoryStorage([{ ...offer(), customer: { ...offer().customer, email: undefined } }]);
  const mails: { to: string }[] = [];

  await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    {
      storage,
      sendMail: async (mail) => {
        mails.push(mail);
        return { to: mail.to, status: 'sent' };
      },
    }
  );

  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'thomascliphero@gmail.com');
});

test('een verlopen offerte kan niet geaccepteerd worden', async () => {
  const storage = memoryStorage([offer()]);
  // De offerte is geldig tot 28 november 2026; de klant kijkt in december.
  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    { storage, now: () => new Date('2026-12-01T10:00:00.000Z') }
  );
  assert.equal(result.status, 409);
  assert.match(result.body.error ?? '', /verlopen/);
  const stored = await storage.getQuote('KB-2026-0001');
  assert.equal(stored?.status, 'open');
});

test('zonder naam, zonder token of met een fout token wordt de acceptatie geweigerd', async () => {
  const storage = memoryStorage([offer()]);

  const noName = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: '  ' },
    { storage }
  );
  assert.equal(noName.status, 400);
  assert.equal(noName.body.field, 'name');

  const noToken = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: '', name: 'Jan Jansen' },
    { storage }
  );
  assert.equal(noToken.status, 400);

  const wrongToken = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: 'fout', name: 'Jan Jansen' },
    { storage }
  );
  assert.equal(wrongToken.status, 403);

  const unknown = await handleAcceptQuote(
    { id: 'KB-2026-9999', token: TOKEN, name: 'Jan Jansen' },
    { storage }
  );
  assert.equal(unknown.status, 404);

  // Niets van dat alles mag de offerte hebben veranderd.
  const stored = await storage.getQuote('KB-2026-0001');
  assert.equal(stored?.status, 'open');
});

test('een geannuleerde offerte kan niet geaccepteerd worden', async () => {
  const cancelled: QuoteRecord = { ...offer(), status: 'cancelled' };
  const storage = memoryStorage([cancelled]);

  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    { storage }
  );

  assert.equal(result.status, 409);
});

test('een al betaalde offerte blijft betaald', async () => {
  const paid: QuoteRecord = { ...offer(), status: 'paid', paidAt: '2026-10-29T12:00:00.000Z' };
  const storage = memoryStorage([paid]);

  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    { storage }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.quote?.status, 'paid');
});

test('zonder mailer wordt de offerte wel geaccepteerd', async () => {
  const storage = memoryStorage([offer()]);

  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    { storage }
  );

  assert.equal(result.status, 200);
  assert.equal((await storage.getQuote('KB-2026-0001'))?.status, 'accepted');
});

test('een mislukte mail maakt de acceptatie niet ongedaan', async () => {
  const storage = memoryStorage([offer()]);

  const result = await handleAcceptQuote(
    { id: 'KB-2026-0001', token: TOKEN, name: 'Jan Jansen' },
    {
      storage,
      sendMail: async () => {
        throw new Error('resend is down');
      },
    }
  );

  assert.equal(result.status, 200);
  assert.equal((await storage.getQuote('KB-2026-0001'))?.status, 'accepted');
});
