import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcceptConfirmationEmail, buildPaymentReminderEmail } from './leadEmail';
import { buildQuoteRecord, type QuoteRecord } from './quote';

const TOKEN = 'offertetoken1234567890';

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

test('de bevestiging noemt het offertenummer, het bedrag en de diensten', () => {
  const mail = buildAcceptConfirmationEmail(offer(), {
    quoteUrl: `https://klusbaas.nl/offerte/KB-2026-0001?token=${TOKEN}`,
  });

  assert.match(mail.subject, /Je akkoord voor offerte KB-2026-0001 is binnen/);
  assert.match(mail.text, /Hoi Jan, bedankt voor je akkoord/);
  assert.match(mail.text, /Bedrag incl\. btw: € 1\.203,95/);
  assert.match(mail.text, /- Binnenmuur schilderen/);
  assert.match(mail.text, /https:\/\/klusbaas\.nl\/offerte\/KB-2026-0001\?token=/);
  // De klant moet weten waar het heen moet, dus de link staat in de mail.
  assert.match(mail.html, /Bekijk je offerte/);
});

test('zonder betaalgegevens staat er geen bankrekening in de mail', () => {
  const mail = buildAcceptConfirmationEmail(offer(), {
    quoteUrl: `https://klusbaas.nl/offerte/KB-2026-0001?token=${TOKEN}`,
  });

  assert.doesNotMatch(mail.text, /IBAN/);
  assert.doesNotMatch(mail.text, /BETALEN/);
});

test('de betaalherinnering vraagt om het bedrag, met de IBAN en de omschrijving', () => {
  const mail = buildPaymentReminderEmail(
    { ...offer(), status: 'accepted', acceptedAt: '2026-10-29T11:00:00.000Z' },
    {
      quoteUrl: `https://klusbaas.nl/offerte/KB-2026-0001?token=${TOKEN}`,
      payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
    }
  );

  assert.match(mail.subject, /Je betaling voor offerte KB-2026-0001 is nog niet binnen/);
  assert.match(mail.text, /1\.203,95/);
  assert.match(mail.text, /NL91ABNA0417164300/);
  assert.match(mail.text, /Omschrijving: KB-2026-0001/);
  // Een nudge, geen dreigement: de site blijft live.
  assert.match(mail.text, /Je site blijft online/);
});

test('de betaalherinnering zegt wat er gebeurt als er geen betaalgegevens zijn', () => {
  const mail = buildPaymentReminderEmail(
    { ...offer(), status: 'accepted' },
    { quoteUrl: `https://klusbaas.nl/offerte/KB-2026-0001?token=${TOKEN}` }
  );

  assert.doesNotMatch(mail.text, /IBAN/);
  assert.match(mail.text, /Klusbaas stuurt je de betaalgegevens apart/);
});

test('met betaalgegevens staat de IBAN erin, met de omschrijving', () => {
  const mail = buildAcceptConfirmationEmail(offer(), {
    quoteUrl: `https://klusbaas.nl/offerte/KB-2026-0001?token=${TOKEN}`,
    payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
  });

  assert.match(mail.text, /Bankrekening \(IBAN\): NL91ABNA0417164300/);
  assert.match(mail.text, /Ten name van: Klusbaas/);
  assert.match(mail.text, /Omschrijving: KB-2026-0001/);
  // De site blijft live: dat is de belofte die de klant al heeft.
  assert.match(mail.text, /Je site blijft online/);
});
