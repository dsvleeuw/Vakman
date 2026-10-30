import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import type { Account, PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';
import { createOfferForCustomer } from './adminOffer';
import type { AccountMail } from './accountMailer';
import type { AccountStorage, LeadStorage, SiteStorage } from './storage';

/** A published site in memory. */
function memorySites(sites: PublishedSiteRecord[] = []): SiteStorage {
  const map = new Map(sites.map((site) => [site.slug, site]));
  return {
    async saveSite(record) {
      map.set(record.slug, record);
      return `memory:${record.slug}`;
    },
    async getSite(slug) {
      return map.get(slug) ?? null;
    },
    async listSites() {
      return [...map.values()];
    },
    async deleteSite(slug: string) {
      map.delete(slug);
    },
  };
}

/** The offers in memory, with the PDF that was saved with them. */
function memoryStorage(
  quotes: QuoteRecord[] = [],
  storedLeads: StoredLead[] = []
): LeadStorage & { pdfs: Map<string, Uint8Array> } {
  const quoteMap = new Map(quotes.map((quote) => [quote.id, quote]));
  const pdfs = new Map<string, Uint8Array>();
  return {
    pdfs,
    async nextQuoteSequence(year) {
      return quoteMap.size + 1;
    },
    async saveQuote(record, pdf) {
      quoteMap.set(record.id, record);
      pdfs.set(record.id, pdf);
      return { json: 'memory', pdf: 'memory' };
    },
    async getQuote(id) {
      return quoteMap.get(id) ?? null;
    },
    async getQuotePdf(id) {
      return pdfs.get(id) ?? null;
    },
    async saveLead(reference) {
      return `memory:${reference}`;
    },
    async listLeads() {
      return storedLeads;
    },
    async updateLeadStatus() {
      return null;
    },
    async listQuotes() {
      return [...quoteMap.values()];
    },
    async updateQuoteStatus(id, status) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, status };
      quoteMap.set(id, updated);
      return updated;
    },
    async linkQuoteToAccount(id, accountId) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, accountId };
      quoteMap.set(id, updated);
      return updated;
    },
    async extendQuote(id, validUntil) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, validUntil };
      quoteMap.set(id, updated);
      return updated;
    },
    async markPaymentReported(id, reportedAt) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, paymentReportedAt: reportedAt };
      quoteMap.set(id, updated);
      return updated;
    },
    async updateQuoteDelivery(id, delivery) {
      const record = quoteMap.get(id);
      if (!record) return null;
      const updated = { ...record, delivery };
      quoteMap.set(id, updated);
      return updated;
    },
    async deleteQuote() {
      return;
    },
    async anonymizeQuote() {
      return null;
    },
    async deleteLead() {
      return;
    },
  };
}

function memoryAccounts(accounts: Account[] = []): AccountStorage {
  const map = new Map(accounts.map((account) => [account.id, account]));
  return {
    async getAccount(id) {
      return map.get(id) ?? null;
    },
    async getAccountByEmail(email) {
      return [...map.values()].find((account) => account.email === email) ?? null;
    },
    async listAccounts() {
      return [...map.values()];
    },
    async saveAccount(account) {
      map.set(account.id, account);
      return `memory:${account.id}`;
    },
    async saveSession() {
      return 'memory';
    },
    async getSession() {
      return null;
    },
    async deleteSession() {},
    async deleteAccount() {},
    async listSessionsOf() {
      return [];
    },
  };
}

const account: Account = {
  id: 'account-1',
  email: 'jan@jansen.nl',
  passwordHash: 'hash',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

const publishedSite: PublishedSiteRecord = {
  slug: 'jansen-schilderwerken',
  token: 'tokentokentoken',
  ownerId: 'account-1',
  sector: 'schilder',
  styleId: 'modern',
  form: { biz: 'Jansen Schilderwerken', owner: 'Jan Jansen', phone: '0698765432', city: 'Haarlem' },
  channel: 'E-mail',
  disabledServices: {},
  blocks: [],
  blockContent: {},
  text: {
    kicker: 'Schilderen',
    headline: 'De muur',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Werk',
    cta2: 'Offerte',
  },
  services: [{ n: 'Binnenmuur schilderen', d: 'Per kamer', amount: 650 }],
  timestamp: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
};

function deps(overrides: Partial<Parameters<typeof createOfferForCustomer>[1]> = {}) {
  const leads = memoryStorage();
  const mails: AccountMail[] = [];
  return {
    leads,
    mails,
    deps: {
      leads,
      sites: memorySites([publishedSite]),
      accounts: memoryAccounts([account]),
      sendMail: async (mail: AccountMail) => {
        mails.push(mail);
        return 'sent';
      },
      now: () => Date.UTC(2026, 9, 29, 10, 0, 0),
      createToken: () => 'offertetoken',
      siteUrl: 'https://klusbaas.nl',
      ...overrides,
    },
  };
}

test('Klusbaas maakt een offerte voor een klant met een account en een site', async () => {
  const { deps: d, mails } = deps();

  const result = await createOfferForCustomer(
    {
      email: 'jan@jansen.nl',
      accountId: 'account-1',
      siteSlug: 'jansen-schilderwerken',
      plan: 'pro',
      addons: ['trust-bar'],
    },
    d
  );

  assert.equal(result.ok, true);
  assert.equal(result.quote?.id, 'KB-2026-0001');
  assert.equal(result.quote?.planName, 'Pro');
  assert.equal(result.quote?.mailed, true);
  assert.match(result.quote?.path ?? '', /^\/offerte\/KB-2026-0001\?token=offertetoken$/);

  // De offerte staat in het account van de klant.
  const quotes = await d.leads.listQuotes();
  assert.equal(quotes.length, 1);
  assert.equal(quotes[0].accountId, 'account-1');
  // Zijn gegevens komen uit zijn site, niet uit de vraag.
  assert.equal(quotes[0].customer.biz, 'Jansen Schilderwerken');
  assert.equal(quotes[0].customer.owner, 'Jan Jansen');
  assert.equal(quotes[0].customer.city, 'Haarlem');
  assert.equal(quotes[0].sectorName, 'Schilder');
  assert.deepEqual(quotes[0].services, ['Binnenmuur schilderen']);
  // Het pakket en de extra's staan op de offerte.
  assert.equal(quotes[0].planId, 'pro');
  assert.ok(quotes[0].lines.some((line) => line.id === 'trust-bar'));
});

test('de klant krijgt de offerte per mail, met de PDF erbij', async () => {
  const { deps: d, mails, leads } = deps();

  await createOfferForCustomer(
    {
      email: 'jan@jansen.nl',
      accountId: 'account-1',
      siteSlug: 'jansen-schilderwerken',
      plan: 'basis',
    },
    d
  );

  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'jan@jansen.nl');
  assert.match(mails[0].subject, /KB-2026-0001/);
  assert.match(mails[0].text, /offerte/i);
  assert.match(mails[0].text, /https:\/\/klusbaas\.nl\/offerte\/KB-2026-0001/);
  assert.equal(mails[0].attachments?.length, 1);
  assert.equal(mails[0].attachments?.[0].filename, 'Offerte-KB-2026-0001.pdf');
  assert.ok((mails[0].attachments?.[0].content.length ?? 0) > 100);
  // De PDF is ook opgeslagen, zodat de klant hem later kan downloaden.
  const pdf = await leads.getQuotePdf('KB-2026-0001');
  assert.ok(pdf && pdf.length > 100);
});

test('zonder e-mailadres of pakket wordt de offerte geweigerd', async () => {
  const { deps: d } = deps();

  const noMail = await createOfferForCustomer({ plan: 'pro' }, d);
  assert.equal(noMail.ok, false);
  assert.equal(noMail.field, 'email');

  const noPlan = await createOfferForCustomer({ email: 'jan@jansen.nl' }, d);
  assert.equal(noPlan.ok, false);
  assert.equal(noPlan.field, 'plan');

  const nothing = await createOfferForCustomer({}, d);
  assert.equal(nothing.ok, false);
});

test('een e-mailadres dat niet bij het account hoort wordt geweigerd', async () => {
  const { deps: d } = deps();

  const result = await createOfferForCustomer(
    { email: 'iemand@anders.nl', accountId: 'account-1', plan: 'pro' },
    d
  );

  assert.equal(result.ok, false);
  assert.equal(result.field, 'email');
});

test('zonder site vult Klusbaas de klantgegevens zelf in', async () => {
  const { deps: d } = deps();

  const result = await createOfferForCustomer(
    {
      email: 'nieuw@klant.nl',
      plan: 'basis',
      biz: 'De Vakman BV',
      owner: 'Piet de Vakman',
      phone: '0612345678',
      city: 'Utrecht',
      sector: 'timmerman',
      style: 'klassiek',
      services: ['Kozijnen'],
    },
    d
  );

  assert.equal(result.ok, true);
  const quotes = await d.leads.listQuotes();
  assert.equal(quotes[0].customer.biz, 'De Vakman BV');
  assert.equal(quotes[0].sectorName, 'Timmerman');
  assert.equal(quotes[0].styleName, 'Vakwerk');
  assert.deepEqual(quotes[0].services, ['Kozijnen']);
});

test('zonder mailer wordt de offerte wel gemaakt, maar niet verstuurd', async () => {
  const { deps: d } = deps({ sendMail: undefined });

  const result = await createOfferForCustomer(
    {
      email: 'jan@jansen.nl',
      accountId: 'account-1',
      siteSlug: 'jansen-schilderwerken',
      plan: 'pro',
    },
    d
  );

  assert.equal(result.ok, true);
  assert.equal(result.quote?.mailed, false);
  assert.equal(result.quote?.mailStatus, 'geen mailer');
  assert.equal((await d.leads.listQuotes()).length, 1);
});

/**
 * De tekst uit een PDF van pdf-lib. De letters staan als hex-tekenreeksen in
 * een gecomprimeerde stream, dus: ontleed de stream en lees de hex.
 */
function pdfText(pdf: Uint8Array): string {
  // De hele PDF als latin-1-tekenreeks: zo zijn de grenzen van de streams
  // met gewone stringfuncties te vinden.
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

/** A request that came in through a form of Klusbaas. */
const request: StoredLead = {
  reference: 'L-AB12CD',
  createdAt: '2026-10-29T10:00:00.000Z',
  type: 'contact',
  site: { biz: 'Houtwerk De Vries', sector: 'timmerman', style: 'Vakwerk' },
  fields: {
    name: 'Jan de Vries',
    phone: '0612345678',
    email: 'jan@devries.nl',
    message: 'Ik wil een website.',
  },
};

test('Klusbaas schrijft een offerte voor iemand die alleen een aanvraag stuurde', async () => {
  const leads = memoryStorage([], [request]);
  const mails: AccountMail[] = [];

  const result = await createOfferForCustomer(
    {
      email: '',
      leadReference: 'L-AB12CD',
      plan: 'pro',
    },
    {
      leads,
      sites: memorySites([]),
      accounts: memoryAccounts([]),
      sendMail: async (mail: AccountMail) => {
        mails.push(mail);
        return 'sent';
      },
      now: () => Date.UTC(2026, 9, 29, 10, 0, 0),
      createToken: () => 'offertetoken',
      siteUrl: 'https://klusbaas.nl',
    }
  );

  assert.equal(result.ok, true);
  const quotes = await leads.listQuotes();
  assert.equal(quotes.length, 1);
  // De klantgegevens komen uit de aanvraag. De bedrijfsnaam van de site
  // waar hij binnenkwam is niet de naam van zijn bedrijf, dus die wordt de
  // naam van de klant.
  assert.equal(quotes[0].customer.biz, 'Jan de Vries');
  assert.equal(quotes[0].customer.owner, 'Jan de Vries');
  assert.equal(quotes[0].customer.email, 'jan@devries.nl');
  assert.equal(quotes[0].customer.phone, '0612345678');
  assert.equal(quotes[0].sectorName, 'Timmerman');
  // En de klant krijgt de offerte per mail.
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'jan@devries.nl');
  assert.equal(mails[0].attachments?.length, 1);
});

test('de betaalgegevens staan in de PDF van de offerte', async () => {
  const { deps: d, leads } = deps({
    payment: { iban: 'NL91ABNA0417164300', name: 'Klusbaas', email: 'info@klusbaas.nl' },
  });

  const result = await createOfferForCustomer(
    {
      email: 'jan@jansen.nl',
      accountId: 'account-1',
      siteSlug: 'jansen-schilderwerken',
      plan: 'pro',
    },
    d
  );

  assert.equal(result.ok, true);
  const pdf = leads.pdfs.get(result.quote?.id ?? '');
  assert.ok(pdf, 'de PDF is opgeslagen');
  assert.equal(Buffer.from(pdf.slice(0, 4)).toString(), '%PDF');
  // De klant moet in de offerte zien waar hij het bedrag naartoe overmaakt.
  const text = pdfText(pdf);
  assert.match(text, /NL91ABNA0417164300/);
  assert.match(text, /Klusbaas/);
});

test('de offerte onthoudt de aanvraag waarvoor hij gemaakt is', async () => {
  const leads = memoryStorage([], [request]);

  const result = await createOfferForCustomer(
    { leadReference: 'L-AB12CD', plan: 'pro' },
    {
      leads,
      sites: memorySites([]),
      accounts: memoryAccounts([]),
      now: () => Date.UTC(2026, 9, 29, 10, 0, 0),
      createToken: () => 'offertetoken',
      siteUrl: 'https://klusbaas.nl',
    }
  );

  assert.equal(result.ok, true);
  const quotes = await leads.listQuotes();
  assert.equal(quotes[0].leadReference, 'L-AB12CD');
});

test('met send=false blijft de offerte onverstuurd', async () => {
  const { deps: d, mails } = deps();

  const result = await createOfferForCustomer(
    {
      email: 'jan@jansen.nl',
      accountId: 'account-1',
      siteSlug: 'jansen-schilderwerken',
      plan: 'pro',
      send: false,
    },
    d
  );

  assert.equal(result.ok, true);
  assert.equal(mails.length, 0);
  assert.equal(result.quote?.mailStatus, 'geen mailer');
});
