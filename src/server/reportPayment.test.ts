import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteRecord } from '../utils/quote';
import { handleReportPayment } from './reportPayment';
import type { LeadStorage } from './storage';

const TOKEN = 'offertetoken1234567890';

function memoryStorage(quotes: QuoteRecord[]): LeadStorage {
  const map = new Map(quotes.map((quote) => [quote.id, quote]));
  return {
    async nextQuoteSequence() {
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
      const updated = { ...record, status };
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

function offer(overrides: Partial<QuoteRecord> = {}): QuoteRecord {
  return {
    id: 'KB-2026-0001',
    token: TOKEN,
    createdAt: '2026-10-29T10:00:00.000Z',
    validUntil: '2026-11-28T10:00:00.000Z',
    status: 'accepted',
    acceptedAt: '2026-10-29T11:00:00.000Z',
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
    planId: 'pro',
    planName: 'Pro',
    lines: [],
    subtotalCents: 99500,
    vatCents: 20895,
    totalCents: 120395,
    ...overrides,
  };
}

test('de klant meldt zijn betaling; Klusbaas krijgt een mail', async () => {
  const storage = memoryStorage([offer()]);
  const mails: { to: string; subject: string; text: string }[] = [];

  const result = await handleReportPayment(
    { id: 'KB-2026-0001', token: TOKEN },
    {
      storage,
      sendMail: async (mail) => {
        mails.push(mail);
        return 'sent';
      },
      notifyEmail: 'team@klusbaas.nl',
      payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
      now: () => new Date('2026-10-30T09:00:00.000Z'),
    }
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'team@klusbaas.nl');
  assert.match(mails[0].subject, /KB-2026-0001/);
  assert.match(mails[0].text, /Jan Jansen/);
  assert.match(mails[0].text, /NL91ABNA0417164300/);
  // De melding staat op de offerte; de status blijft "accepted", want alleen
  // Klusbaas markeert een offerte als betaald.
  const stored = await storage.getQuote('KB-2026-0001');
  assert.equal(stored?.status, 'accepted');
  assert.equal(stored?.paymentReportedAt, '2026-10-30T09:00:00.000Z');
});

test('zonder offertenummer, zonder token of met een fout token wordt de melding geweigerd', async () => {
  const storage = memoryStorage([offer()]);

  const noId = await handleReportPayment({ token: TOKEN }, { storage });
  assert.equal(noId.status, 400);

  const noToken = await handleReportPayment({ id: 'KB-2026-0001', token: '' }, { storage });
  assert.equal(noToken.status, 400);

  const wrongToken = await handleReportPayment({ id: 'KB-2026-0001', token: 'fout' }, { storage });
  assert.equal(wrongToken.status, 403);

  const unknown = await handleReportPayment({ id: 'KB-2026-9999', token: TOKEN }, { storage });
  assert.equal(unknown.status, 404);
});

test('een openstaande, betaalde of geannuleerde offerte wordt niet gemeld', async () => {
  const mails: { to: string }[] = [];
  const sendMail = async (mail: { to: string }) => {
    mails.push(mail);
    return 'sent';
  };

  const open = await handleReportPayment(
    { id: 'KB-2026-0001', token: TOKEN },
    { storage: memoryStorage([offer({ status: 'open' })]), sendMail }
  );
  assert.equal(open.status, 400);
  assert.match(open.body.error ?? '', /niet geaccepteerd/);

  const paid = await handleReportPayment(
    { id: 'KB-2026-0001', token: TOKEN },
    { storage: memoryStorage([offer({ status: 'paid' })]), sendMail }
  );
  assert.equal(paid.status, 400);
  assert.match(paid.body.error ?? '', /al betaald/);

  const cancelled = await handleReportPayment(
    { id: 'KB-2026-0001', token: TOKEN },
    { storage: memoryStorage([offer({ status: 'cancelled' })]), sendMail }
  );
  assert.equal(cancelled.status, 400);
  assert.equal(mails.length, 0);
});
