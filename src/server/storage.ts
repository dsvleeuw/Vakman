import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Account, AccountSession, PublishedSiteRecord, StoredLead } from '../types';
import type { QuoteRecord } from '../utils/quote';

/**
 * Where quotes and leads are kept. Production uses Netlify Blobs (store
 * `quotes` holds the quote JSON, the PDF and the yearly counter; store
 * `leads` holds site-form leads). `vite dev` uses JSON files in `.data/`.
 */
export interface LeadStorage {
  /** Next quote sequence number for a year: 1, 2, 3 … */
  nextQuoteSequence(year: number): Promise<number>;
  saveQuote(record: QuoteRecord, pdf: Uint8Array): Promise<{ json: string; pdf: string }>;
  getQuote(id: string): Promise<QuoteRecord | null>;
  getQuotePdf(id: string): Promise<Uint8Array | null>;
  saveLead(reference: string, lead: unknown): Promise<string>;
  /** Every stored request, newest last. Used to show a craftsman his own. */
  listLeads(): Promise<StoredLead[]>;
}

const counterKey = (year: number) => `counter-${year}`;

/**
 * Where published customer sites are kept. Production uses Netlify Blobs
 * (store `sites`), `vite dev` uses JSON files in `.data/sites`.
 */
export interface SiteStorage {
  /** Store a site under its slug; an existing site with the same slug is replaced. */
  saveSite(record: PublishedSiteRecord): Promise<string>;
  /** Read one site by its slug. */
  getSite(slug: string): Promise<PublishedSiteRecord | null>;
  /** Every published site, for the sitemap. */
  listSites(): Promise<PublishedSiteRecord[]>;
}

/** File storage for local development: `.data/quotes` and `.data/leads`. */
export function createFileStorage(root: string): LeadStorage {
  const quotesDir = path.join(root, 'quotes');
  const leadsDir = path.join(root, 'leads');
  let chain: Promise<unknown> = Promise.resolve();
  const safe = (id: string) => id.replace(/[^A-Za-z0-9-]/g, '');

  const readJson = async <T>(file: string): Promise<T | null> => {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
      return null;
    }
  };

  return {
    nextQuoteSequence(year) {
      // Serialise counter updates inside this process.
      const run = chain.then(async () => {
        await mkdir(quotesDir, { recursive: true });
        const file = path.join(quotesDir, `${counterKey(year)}.json`);
        const current = (await readJson<{ value: number }>(file))?.value ?? 0;
        const next = current + 1;
        await writeFile(file, JSON.stringify({ value: next }));
        return next;
      });
      chain = run.catch(() => undefined);
      return run;
    },
    async saveQuote(record, pdf) {
      await mkdir(quotesDir, { recursive: true });
      const json = path.join(quotesDir, `${safe(record.id)}.json`);
      const pdfFile = path.join(quotesDir, `${safe(record.id)}.pdf`);
      await writeFile(json, JSON.stringify(record, null, 2));
      await writeFile(pdfFile, pdf);
      return { json, pdf: pdfFile };
    },
    async getQuote(id) {
      return readJson<QuoteRecord>(path.join(quotesDir, `${safe(id)}.json`));
    },
    async getQuotePdf(id) {
      try {
        return new Uint8Array(await readFile(path.join(quotesDir, `${safe(id)}.pdf`)));
      } catch {
        return null;
      }
    },
    async saveLead(reference, lead) {
      await mkdir(leadsDir, { recursive: true });
      const file = path.join(leadsDir, `${safe(reference)}.json`);
      await writeFile(file, JSON.stringify(lead, null, 2));
      return file;
    },
    async listLeads() {
      const records: StoredLead[] = [];
      let files: string[] = [];
      try {
        files = await readdir(leadsDir);
      } catch {
        return records;
      }
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const record = await readJson<StoredLead>(path.join(leadsDir, file));
        if (record?.reference) records.push(record);
      }
      return records;
    },
  };
}

/**
 * Where customer accounts and their sessions are kept. Production uses
 * Netlify Blobs (store `accounts`), `vite dev` uses JSON files in
 * `.data/accounts` and `.data/sessions`.
 */
export interface AccountStorage {
  getAccount(id: string): Promise<Account | null>;
  getAccountByEmail(email: string): Promise<Account | null>;
  saveAccount(account: Account): Promise<string>;
  saveSession(session: AccountSession): Promise<string>;
  getSession(id: string): Promise<AccountSession | null>;
  deleteSession(id: string): Promise<void>;
}

/**
 * The id of an account is derived from the e-mail address, so looking an
 * account up by e-mail is a single read and the id itself leaks no address.
 */
export function accountId(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

/**
 * File storage for accounts and sessions: `.data/accounts` and
 * `.data/sessions`.
 */
export function createFileAccountStorage(root: string): AccountStorage {
  const accountsDir = path.join(root, 'accounts');
  const sessionsDir = path.join(root, 'sessions');
  const safe = (id: string) => id.replace(/[^A-Za-z0-9-]/g, '');

  const readJson = async <T>(file: string): Promise<T | null> => {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
      return null;
    }
  };

  return {
    async getAccount(id) {
      return readJson<Account>(path.join(accountsDir, `${safe(id)}.json`));
    },
    async getAccountByEmail(email) {
      return readJson<Account>(path.join(accountsDir, `${safe(accountId(email))}.json`));
    },
    async saveAccount(account) {
      await mkdir(accountsDir, { recursive: true });
      const file = path.join(accountsDir, `${safe(account.id)}.json`);
      await writeFile(file, JSON.stringify(account, null, 2));
      return file;
    },
    async saveSession(session) {
      await mkdir(sessionsDir, { recursive: true });
      const file = path.join(sessionsDir, `${safe(session.id)}.json`);
      await writeFile(file, JSON.stringify(session, null, 2));
      return file;
    },
    async getSession(id) {
      return readJson<AccountSession>(path.join(sessionsDir, `${safe(id)}.json`));
    },
    async deleteSession(id) {
      try {
        await unlink(path.join(sessionsDir, `${safe(id)}.json`));
      } catch {
        // Already gone: logging out twice is not an error.
      }
    },
  };
}

/**
 * File storage for published sites: `.data/sites/<slug>.json`.
 */
export function createFileSiteStorage(root: string): SiteStorage {
  const sitesDir = path.join(root, 'sites');
  const safe = (slug: string) => slug.replace(/[^A-Za-z0-9-]/g, '');

  return {
    async saveSite(record) {
      await mkdir(sitesDir, { recursive: true });
      const file = path.join(sitesDir, `${safe(record.slug)}.json`);
      await writeFile(file, JSON.stringify(record, null, 2));
      return file;
    },
    async getSite(slug) {
      try {
        const raw = await readFile(path.join(sitesDir, `${safe(slug)}.json`), 'utf8');
        return JSON.parse(raw) as PublishedSiteRecord;
      } catch {
        return null;
      }
    },
    async listSites() {
      try {
        const files = await readdir(sitesDir);
        const records: PublishedSiteRecord[] = [];
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          try {
            const raw = await readFile(path.join(sitesDir, file), 'utf8');
            records.push(JSON.parse(raw) as PublishedSiteRecord);
          } catch {
            // A half-written file must not break the whole sitemap.
          }
        }
        return records;
      } catch {
        return [];
      }
    },
  };
}

/** Netlify Blobs storage. Imported lazily so `vite dev` never needs it. */
export async function createBlobStorage(): Promise<LeadStorage> {
  const { getStore } = await import('@netlify/blobs');
  const quotes = getStore({ name: 'quotes', consistency: 'strong' });
  const leads = getStore({ name: 'leads', consistency: 'strong' });

  return {
    async nextQuoteSequence(year) {
      // Optimistic concurrency: write only if nobody changed the counter since we read it.
      for (let attempt = 0; attempt < 8; attempt++) {
        const current = await quotes.getWithMetadata(counterKey(year), { type: 'json' });
        const value = ((current?.data as { value?: number } | undefined)?.value ?? 0) + 1;
        const result = current?.etag
          ? await quotes.setJSON(counterKey(year), { value }, { onlyIfMatch: current.etag })
          : await quotes.setJSON(counterKey(year), { value }, { onlyIfNew: true });
        if (result.modified) return value;
      }
      throw new Error('Offertenummer kon niet worden toegekend');
    },
    async saveQuote(record, pdf) {
      await quotes.setJSON(record.id, record);
      await quotes.set(`${record.id}.pdf`, new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }));
      return { json: `blobs:quotes/${record.id}`, pdf: `blobs:quotes/${record.id}.pdf` };
    },
    async getQuote(id) {
      return ((await quotes.get(id, { type: 'json' })) as QuoteRecord | null) ?? null;
    },
    async getQuotePdf(id) {
      const buffer = await quotes.get(`${id}.pdf`, { type: 'arrayBuffer' });
      return buffer ? new Uint8Array(buffer) : null;
    },
    async saveLead(reference, lead) {
      await leads.setJSON(reference, lead);
      return `blobs:leads/${reference}`;
    },
    async listLeads() {
      const listed = await leads.list();
      const records: StoredLead[] = [];
      for (const entry of listed.blobs) {
        const record = (await leads.get(entry.key, { type: 'json' })) as StoredLead | null;
        if (record?.reference) records.push(record);
      }
      return records;
    },
  };
}

/**
 * Netlify Blobs storage for published sites (store `sites`).
 */
export async function createBlobSiteStorage(): Promise<SiteStorage> {
  const { getStore } = await import('@netlify/blobs');
  const sites = getStore({ name: 'sites', consistency: 'strong' });

  return {
    async saveSite(record) {
      await sites.setJSON(record.slug, record);
      return `blobs:sites/${record.slug}`;
    },
    async getSite(slug) {
      return ((await sites.get(slug, { type: 'json' })) as PublishedSiteRecord | null) ?? null;
    },
    async listSites() {
      const listed = await sites.list();
      const records: PublishedSiteRecord[] = [];
      for (const entry of listed.blobs) {
        const record = (await sites.get(entry.key, { type: 'json' })) as PublishedSiteRecord | null;
        if (record?.slug) records.push(record);
      }
      return records;
    },
  };
}

/**
 * Netlify Blobs storage for accounts and sessions (store `accounts`).
 */
export async function createBlobAccountStorage(): Promise<AccountStorage> {
  const { getStore } = await import('@netlify/blobs');
  const accounts = getStore({ name: 'accounts', consistency: 'strong' });

  return {
    async getAccount(id) {
      return ((await accounts.get(id, { type: 'json' })) as Account | null) ?? null;
    },
    async getAccountByEmail(email) {
      return (
        ((await accounts.get(accountId(email), { type: 'json' })) as Account | null) ?? null
      );
    },
    async saveAccount(account) {
      await accounts.setJSON(account.id, account);
      return `blobs:accounts/${account.id}`;
    },
    async saveSession(session) {
      await accounts.setJSON(`session-${session.id}`, session);
      return `blobs:accounts/session-${session.id}`;
    },
    async getSession(id) {
      return (
        ((await accounts.get(`session-${id}`, { type: 'json' })) as AccountSession | null) ?? null
      );
    },
    async deleteSession(id) {
      await accounts.delete(`session-${id}`);
    },
  };
}
