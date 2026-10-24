import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SubscriberRecord } from '../utils/newsletter';

/**
 * Newsletter subscribers. Production: Netlify Blobs store `newsletter`;
 * `vite dev`: JSON files in `.data/newsletter`. Records are keyed by a hash
 * of the e-mail address, with a second key per token for the links.
 */
export interface NewsletterStorage {
  getByEmail(email: string): Promise<SubscriberRecord | null>;
  getByToken(token: string): Promise<SubscriberRecord | null>;
  /** Save the record; `previousToken` is unlinked when the token changed. */
  save(record: SubscriberRecord, previousToken?: string): Promise<void>;
}

export const emailKey = (email: string) => createHash('sha256').update(email).digest('hex').slice(0, 32);

/** In-memory storage for tests. */
export function createMemoryNewsletterStorage(): NewsletterStorage & { records: Map<string, SubscriberRecord> } {
  const records = new Map<string, SubscriberRecord>();
  const tokens = new Map<string, string>();
  return {
    records,
    async getByEmail(email) {
      const record = records.get(emailKey(email));
      return record ? { ...record } : null;
    },
    async getByToken(token) {
      const key = tokens.get(token);
      const record = key ? records.get(key) : undefined;
      return record ? { ...record } : null;
    },
    async save(record, previousToken) {
      const key = emailKey(record.email);
      if (previousToken && previousToken !== record.token) tokens.delete(previousToken);
      records.set(key, { ...record });
      tokens.set(record.token, key);
    },
  };
}

/** File storage for local development. */
export function createFileNewsletterStorage(root: string): NewsletterStorage {
  const dir = path.join(root, 'newsletter');
  const tokenDir = path.join(dir, 'tokens');
  const safe = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, '');
  const readJson = async <T>(file: string): Promise<T | null> => {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as T;
    } catch {
      return null;
    }
  };
  const recordFile = (email: string) => path.join(dir, `${emailKey(email)}.json`);
  return {
    getByEmail: (email) => readJson<SubscriberRecord>(recordFile(email)),
    async getByToken(token) {
      const link = await readJson<{ key: string }>(path.join(tokenDir, `${safe(token)}.json`));
      return link?.key ? readJson<SubscriberRecord>(path.join(dir, `${safe(link.key)}.json`)) : null;
    },
    async save(record, previousToken) {
      await mkdir(tokenDir, { recursive: true });
      await writeFile(recordFile(record.email), JSON.stringify(record, null, 2));
      await writeFile(path.join(tokenDir, `${safe(record.token)}.json`), JSON.stringify({ key: emailKey(record.email) }));
      if (previousToken && previousToken !== record.token) {
        await writeFile(path.join(tokenDir, `${safe(previousToken)}.json`), JSON.stringify({ key: '' }));
      }
    },
  };
}

/** Netlify Blobs storage, imported lazily so `vite dev` never needs it. */
export async function createBlobNewsletterStorage(): Promise<NewsletterStorage> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore({ name: 'newsletter', consistency: 'strong' });
  const get = async (key: string) => ((await store.get(key, { type: 'json' })) as SubscriberRecord | null) ?? null;
  return {
    getByEmail: (email) => get(`subscriber/${emailKey(email)}`),
    async getByToken(token) {
      const link = (await store.get(`token/${token}`, { type: 'json' })) as { key?: string } | null;
      return link?.key ? get(`subscriber/${link.key}`) : null;
    },
    async save(record, previousToken) {
      const key = emailKey(record.email);
      await store.setJSON(`subscriber/${key}`, record);
      await store.setJSON(`token/${record.token}`, { key });
      if (previousToken && previousToken !== record.token) await store.delete(`token/${previousToken}`);
    },
  };
}
