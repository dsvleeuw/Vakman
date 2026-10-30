import test from 'node:test';
import assert from 'node:assert/strict';
import type { PublishedSiteRecord } from '../types';
import {
  handleGetSite,
  handlePublishSite,
  slugify,
  toPublicSite,
  validatePublishBody,
} from './siteHandler';
import type { SiteStorage } from './storage';

/** A storage that keeps the sites in memory. */
function memoryStorage(): SiteStorage {
  const sites = new Map<string, PublishedSiteRecord>();
  return {
    async saveSite(record) {
      sites.set(record.slug, record);
      return `memory:${record.slug}`;
    },
    async getSite(slug) {
      return sites.get(slug) ?? null;
    },
    async listSites() {
      return [...sites.values()];
    },
    async deleteSite(slug: string) {
      sites.delete(slug);
    },
  };
}

const body = {
  sector: 'schilder',
  styleId: 'modern',
  form: {
    biz: 'Jansen Schilderwerken',
    owner: 'Jan Jansen',
    phone: '0698765432',
    city: 'Haarlem',
  },
  disabledServices: { 1: true },
  blocks: ['price-calculator', 'trust-bar'],
  blockContent: {},
  text: {
    kicker: 'Schilderen',
    headline: 'De muur die je blijft bewonderen',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Bekijk mijn werk',
    cta2: 'Vraag een offerte',
  },
};

test('een bedrijfsnaam wordt een leesbaar adres', () => {
  assert.equal(slugify('Jansen Schilderwerken'), 'jansen-schilderwerken');
  assert.equal(slugify('De Vries & Zn. Schilderwerken B.V.'), 'de-vries-zn-schilderwerken-b-v');
  assert.equal(slugify('   '), 'mijn-site');
});

test('publiceren kan alleen met een bedrijfsnaam, naam, plaats en telefoonnummer', () => {
  const withoutPhone = validatePublishBody({ ...body, form: { ...body.form, phone: '' } });
  assert.equal(withoutPhone.ok, false);
  if (!withoutPhone.ok) assert.equal(withoutPhone.field, 'phone');

  const withoutBiz = validatePublishBody({ ...body, form: { ...body.form, biz: '  ' } });
  assert.equal(withoutBiz.ok, false);

  const wrongSector = validatePublishBody({ ...body, sector: 'bakker' });
  assert.equal(wrongSector.ok, false);

  const valid = validatePublishBody(body);
  assert.equal(valid.ok, true);
});

test('een nieuwe site krijgt een adres en een beheertoken', async () => {
  const storage = memoryStorage();
  const result = await handlePublishSite(body, { storage, siteUrl: 'https://klusbaas.nl' });

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.slug, 'jansen-schilderwerken');
  assert.ok(result.body.token);
  assert.equal(result.body.url, 'https://klusbaas.nl/site/jansen-schilderwerken');
  assert.ok(result.body.manageUrl?.includes('token='));
});

test('twee bedrijven met dezelfde naam krijgen een eigen adres', async () => {
  const storage = memoryStorage();
  const first = await handlePublishSite(body, { storage, siteUrl: 'https://klusbaas.nl' });
  const second = await handlePublishSite(body, { storage, siteUrl: 'https://klusbaas.nl' });

  assert.equal(first.body.slug, 'jansen-schilderwerken');
  assert.equal(second.body.slug, 'jansen-schilderwerken-2');
});

test('een site veranderen kan alleen met het juiste token', async () => {
  const storage = memoryStorage();
  const created = await handlePublishSite(body, { storage, siteUrl: 'https://klusbaas.nl' });
  const slug = created.body.slug as string;
  const token = created.body.token as string;

  const wrongToken = await handlePublishSite(
    { ...body, slug, token: 'verkeerd-token' },
    { storage, siteUrl: 'https://klusbaas.nl' }
  );
  assert.equal(wrongToken.status, 403);

  const withoutToken = await handlePublishSite(
    { ...body, slug },
    { storage, siteUrl: 'https://klusbaas.nl' }
  );
  assert.equal(withoutToken.status, 403);

  const withToken = await handlePublishSite(
    { ...body, slug, token, text: { ...body.text, headline: 'Een nieuwe muur' } },
    { storage, siteUrl: 'https://klusbaas.nl' }
  );
  assert.equal(withToken.status, 200);

  const stored = await storage.getSite(slug);
  assert.equal(stored?.text.headline, 'Een nieuwe muur');
  // Het token verandert niet bij het bijwerken.
  assert.equal(stored?.token, token);
});

test('de eigenaar van een site mag hem wijzigen zonder beheerlink', async () => {
  const storage = memoryStorage();
  const created = await handlePublishSite(body, {
    storage,
    siteUrl: 'https://klusbaas.nl',
    ownerId: 'account-1',
  });
  const slug = created.body.slug;
  assert.ok(slug);

  // Met de sessie van de eigenaar is de beheerlink niet meer nodig.
  const updated = await handlePublishSite(
    { ...body, slug },
    { storage, siteUrl: 'https://klusbaas.nl', ownerId: 'account-1' }
  );
  assert.equal(updated.status, 200);

  // Een ander account krijgt er niets bij.
  const stranger = await handlePublishSite(
    { ...body, slug },
    { storage, siteUrl: 'https://klusbaas.nl', ownerId: 'account-2' }
  );
  assert.equal(stranger.status, 403);

  // En zonder account is de beheerlink wel nodig.
  const withoutAccount = await handlePublishSite(
    { ...body, slug },
    { storage, siteUrl: 'https://klusbaas.nl' }
  );
  assert.equal(withoutAccount.status, 403);
});

test('het beheertoken van een site verandert nooit', async () => {
  const storage = memoryStorage();
  const created = await handlePublishSite(body, {
    storage,
    siteUrl: 'https://klusbaas.nl',
    ownerId: 'account-1',
  });
  const token = created.body.token;
  assert.ok(token);

  // Een ander token in de aanvraag is alleen een sleutel op de deur, nooit
  // een nieuwe sleutel: de beheerlink die werkt blijft werken.
  const updated = await handlePublishSite(
    { ...body, slug: created.body.slug, token: 'een-ander-token' },
    { storage, siteUrl: 'https://klusbaas.nl', ownerId: 'account-1' }
  );
  assert.equal(updated.status, 200);
  assert.equal(updated.body.token, token);
  assert.equal((await storage.getSite('jansen-schilderwerken'))?.token, token);
});

test('een bezoeker leest de site zonder het beheertoken te zien', async () => {
  const storage = memoryStorage();
  const created = await handlePublishSite(body, { storage, siteUrl: 'https://klusbaas.nl' });
  const slug = created.body.slug as string;

  const publicResult = await handleGetSite(new URLSearchParams({ slug }), storage);
  assert.equal(publicResult.status, 200);
  assert.ok(publicResult.body.site);
  assert.equal((publicResult.body.site as { token?: string }).token, undefined);
  assert.equal(publicResult.body.site?.form.phone, '0698765432');

  const wrongToken = await handleGetSite(
    new URLSearchParams({ slug, token: 'fout' }),
    storage
  );
  assert.equal(wrongToken.status, 403);

  const unknown = await handleGetSite(new URLSearchParams({ slug: 'bestaat-niet' }), storage);
  assert.equal(unknown.status, 404);
});

test('het beheertoken komt niet in de publieke versie van een site', () => {
  const record: PublishedSiteRecord = {
    slug: 'jansen-schilderwerken',
    token: 'geheim-token',
    sector: 'schilder',
    styleId: 'modern',
    form: { biz: 'Jansen', owner: 'Jan', phone: '0698765432', city: 'Haarlem' },
    channel: 'WhatsApp',
    disabledServices: {},
    blocks: [],
    blockContent: {},
    text: body.text,
    timestamp: 1,
    updatedAt: 2,
  };

  const publicSite = toPublicSite(record);
  assert.equal((publicSite as { token?: string }).token, undefined);
  assert.equal((publicSite as { channel?: string }).channel, undefined);
});

test('na de eerste publicatie gaat er een welkomstmail met het adres', async () => {
  const storage = memoryStorage();
  const mails: { to: string; subject: string; text: string; html: string }[] = [];
  const result = await handlePublishSite(body, {
    storage,
    siteUrl: 'https://klusbaas.nl',
    ownerId: 'account-1',
    ownerEmail: 'jan@example.nl',
    sendMail: async (mail) => {
      mails.push(mail);
      return 'sent';
    },
  });
  assert.equal(result.status, 200);
  assert.equal(mails.length, 1);
  const mail = mails[0];
  assert.equal(mail.to, 'jan@example.nl');
  assert.match(mail.text, /klusbaas\.nl\/site\/jansen-schilderwerken/);
  assert.match(mail.text, /contactformulier/);
});

test('een tweede publicatie stuurt geen welkomstmail meer', async () => {
  const storage = memoryStorage();
  const mails: { to: string; subject: string; text: string; html: string }[] = [];
  const deps = {
    storage,
    siteUrl: 'https://klusbaas.nl',
    ownerId: 'account-1',
    ownerEmail: 'jan@example.nl',
    sendMail: async (mail: { to: string; subject: string; text: string; html: string }) => {
      mails.push(mail);
      return 'sent';
    },
  };
  const created = await handlePublishSite(body, deps);
  assert.equal(created.status, 200);
  const updated = await handlePublishSite(
    { ...body, slug: 'jansen-schilderwerken', token: created.body.token },
    deps
  );
  assert.equal(updated.status, 200);
  assert.equal(mails.length, 1);
});

test('zonder e-mailadres gaat er geen welkomstmail', async () => {
  const storage = memoryStorage();
  const mails: unknown[] = [];
  const result = await handlePublishSite(body, {
    storage,
    siteUrl: 'https://klusbaas.nl',
    sendMail: async (mail) => {
      mails.push(mail);
      return 'sent';
    },
  });
  assert.equal(result.status, 200);
  assert.equal(mails.length, 0);
});
