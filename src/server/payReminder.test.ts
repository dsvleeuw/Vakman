import test from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteRecord } from '../utils/quote';
import { remindPayment } from './payReminder';

const record: QuoteRecord = {
  id: 'KB-2026-0001',
  token: 'quotetoken',
  createdAt: '2026-10-29T10:00:00.000Z',
  validUntil: '2026-11-28T10:00:00.000Z',
  status: 'accepted',
  acceptedAt: '2026-10-29T11:00:00.000Z',
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

test('de betaalherinnering gaat naar de klant met het bedrag en de IBAN', async () => {
  const mails: { to: string; subject: string; text: string }[] = [];
  const result = await remindPayment(record, {
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
  assert.match(mails[0].text, /1\.203,95/);
  assert.match(mails[0].text, /NL91ABNA0417164300/);
  assert.match(mails[0].text, /Omschrijving: KB-2026-0001/);
  // De site blijft live: het is een nudge, geen dreigement.
  assert.match(mails[0].text, /Je site blijft online/);
});

test('zonder e-mailadres gaat er geen betaalherinnering', async () => {
  const result = await remindPayment(
    { ...record, customer: { ...record.customer, email: undefined } },
    { sendMail: async () => 'sent' }
  );
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /e-mailadres/);
});

test('een betaalde, geannuleerde of nog openstaande offerte krijgt geen betaalherinnering', async () => {
  const paid = await remindPayment({ ...record, status: 'paid' }, { sendMail: async () => 'sent' });
  assert.equal(paid.ok, false);
  assert.match(paid.error ?? '', /al betaald/);

  const cancelled = await remindPayment(
    { ...record, status: 'cancelled' },
    { sendMail: async () => 'sent' }
  );
  assert.equal(cancelled.ok, false);
  assert.match(cancelled.error ?? '', /geannuleerd/);

  const open = await remindPayment({ ...record, status: 'open' }, { sendMail: async () => 'sent' });
  assert.equal(open.ok, false);
  assert.match(open.error ?? '', /nog niet ja gezegd/);
});

test('zonder mailer gaat er geen betaalherinnering', async () => {
  const result = await remindPayment(record, {});
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /mailer/);
});
