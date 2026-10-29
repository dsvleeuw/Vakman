import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import type { QuoteRecord } from '../utils/quote';
import { invoiceDetailsFromEnv, invoiceNumberFor } from './invoice';
import { renderInvoicePdf } from './invoicePdf';
import { sendPaidNotice } from './paidNotice';

/**
 * De tekst uit een PDF van pdf-lib. De letters staan als hex-tekenreeksen in
 * een gecomprimeerde stream, dus: ontleed de stream en lees de hex.
 */
function pdfText(pdf: Uint8Array): string {
  const raw = Buffer.from(pdf).toString('binary');
  const words: string[] = [];
  let index = raw.indexOf('stream');
  while (index !== -1) {
    const start = index + 'stream'.length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) break;
    const chunk = raw.slice(start, end).replace(/^[\r\n]+/, '');
    try {
      const inflated = zlib.inflateSync(Buffer.from(chunk, 'binary')).toString('binary');
      for (const match of inflated.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        words.push(Buffer.from(match[1], 'hex').toString('binary'));
      }
    } catch {
      // Geen tekst-stream; de volgende proberen.
    }
    index = raw.indexOf('stream', end);
  }
  return words.join('\n');
}

const record: QuoteRecord = {
  id: 'KB-2026-0001',
  token: 'quotetoken',
  createdAt: '2026-10-29T10:00:00.000Z',
  validUntil: '2026-11-28T10:00:00.000Z',
  status: 'paid',
  paidAt: '2026-10-30T09:00:00.000Z',
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
  lines: [
    { id: 'plan-pro', label: 'Website-pakket Pro', amountCents: 99500, included: false, kind: 'plan' },
  ],
  subtotalCents: 99500,
  vatCents: 20895,
  totalCents: 120395,
};

test('de factuurnummer volgt de offerte', () => {
  assert.equal(invoiceNumberFor('KB-2026-0007'), 'F-2026-0007');
  assert.equal(invoiceNumberFor('KB-2026-12'), 'F-2026-12');
});

test('de factuurgegevens komen uit de omgeving', () => {
  const details = invoiceDetailsFromEnv({
    INVOICE_NAME: 'Klusbaas VOF',
    INVOICE_ADDRESS: 'Industrieweg 3, 2131 JE Hoofddorp',
    INVOICE_KVK: '87654321',
    INVOICE_VAT: 'NL003456789B01',
    INVOICE_EMAIL: 'factuur@klusbaas.nl',
  });
  assert.equal(details.name, 'Klusbaas VOF');
  assert.equal(details.address, 'Industrieweg 3, 2131 JE Hoofddorp');
  assert.equal(details.kvk, '87654321');
  assert.equal(details.vat, 'NL003456789B01');
  assert.equal(details.email, 'factuur@klusbaas.nl');
});

test('zonder omgevingsvariabelen blijven de factuurgegevens leeg', () => {
  const details = invoiceDetailsFromEnv({});
  assert.equal(details.name, 'Klusbaas');
  assert.equal(details.address, undefined);
  assert.equal(details.kvk, undefined);
  assert.equal(details.vat, undefined);
  assert.equal(details.email, undefined);
});

test('de factuur noemt de klant, het bedrag en de betaaldatum', async () => {
  const pdf = await renderInvoicePdf(record, {
    invoice: {
      name: 'Klusbaas VOF',
      address: 'Industrieweg 3, 2131 JE Hoofddorp',
      kvk: '87654321',
      vat: 'NL003456789B01',
      email: 'factuur@klusbaas.nl',
    },
    payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
  });
  assert.equal(Buffer.from(pdf.slice(0, 4)).toString(), '%PDF');
  const text = pdfText(pdf);
  assert.match(text, /FACTUUR/);
  assert.match(text, /F-2026-0001/);
  assert.match(text, /Jansen Schilderwerken/);
  assert.match(text, /Jan Jansen/);
  assert.match(text, /1\.203,95/);
  assert.match(text, /KVK|KvK/);
  assert.match(text, /NL91ABNA0417164300/);
  // De betaaldatum staat op de factuur.
  assert.match(text, /30 oktober 2026/);
});

test('de factuur mailt naar de klant met de PDF erbij', async () => {
  const mails: { to: string; subject: string; attachments?: { filename: string }[] }[] = [];
  const status = await sendPaidNotice(record, {
    sendMail: async (mail) => {
      mails.push(mail);
      return 'sent';
    },
    invoice: { name: 'Klusbaas' },
    payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
    paidAt: '2026-10-30T09:00:00.000Z',
  });
  assert.equal(status, 'sent');
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'jan@jansen.nl');
  assert.match(mails[0].subject, /KB-2026-0001/);
  assert.equal(mails[0].attachments?.[0].filename, 'Factuur-F-2026-0001.pdf');
});

test('zonder e-mailadres wordt er geen factuur gemaild', async () => {
  const status = await sendPaidNotice(
    { ...record, customer: { ...record.customer, email: undefined } },
    { sendMail: async () => 'sent', invoice: { name: 'Klusbaas' } }
  );
  assert.equal(status, 'geen e-mailadres');
});

test('zonder factuurgegevens wordt er geen factuur gemaild', async () => {
  const status = await sendPaidNotice(record, { sendMail: async () => 'sent' });
  assert.equal(status, 'geen factuurgegevens');
});
