import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteRecord } from '../utils/quote';
import { remindQuote } from './remindQuote';

const record: QuoteRecord = {
  id: 'KB-2026-0001',
  token: 'quotetoken',
  createdAt: '2026-10-29T10:00:00.000Z',
  validUntil: '2026-11-28T10:00:00.000Z',
  status: 'open',
  customer: {
    biz: 'Jansen Schilderwerken',
    owner: 'Jan Jansen',
    phone: '0698765432',
    city: 'Haarlem',
    email: 'jan@jansen.nl',
  },
  sector: 'schilder',
  sectorName: 'Schilder',
  styleName: 'Modern',
  services: ['Binnenmuur schilderen'],
  channel: 'E-mail',
  planId: 'pro',
  planName: 'Pro',
  lines: [],
  subtotalCents: 99500,
  vatCents: 20895,
  totalCents: 120395,
};

test('de herinnering gaat naar de klant met de link naar de offerte', async () => {
  const mails: { to: string; subject: string; text: string }[] = [];
  const result = await remindQuote(record, {
    sendMail: async (mail) => {
      mails.push(mail);
      return 'sent';
    },
    payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
    siteUrl: 'https://klusbaas.nl',
  });
  assert.equal(result.ok, true);
  assert.equal(result.mailStatus, 'sent');
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'jan@jansen.nl');
  assert.match(mails[0].subject, /KB-2026-0001/);
  assert.match(mails[0].text, /offerte\/KB-2026-0001\?token=quotetoken/);
  // Het bedrag en de IBAN staan er weer bij, zodat de klant niets hoeft op te zoeken.
  assert.match(mails[0].text, /1\.203,95/);
  assert.match(mails[0].text, /NL91ABNA0417164300/);
});

test('zonder e-mailadres gaat er geen herinnering', async () => {
  const result = await remindQuote(
    { ...record, customer: { ...record.customer, email: undefined } },
    { sendMail: async () => 'sent' }
  );
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /e-mailadres/);
});

test('een betaalde of geannuleerde offerte krijgt geen herinnering', async () => {
  const paid = await remindQuote({ ...record, status: 'paid' }, { sendMail: async () => 'sent' });
  assert.equal(paid.ok, false);
  const cancelled = await remindQuote({ ...record, status: 'cancelled' }, { sendMail: async () => 'sent' });
  assert.equal(cancelled.ok, false);
});

test('zonder mailer gaat er geen herinnering', async () => {
  const result = await remindQuote(record, {});
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /mailer/);
});
