import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Minimal JSON key-value store. On Netlify it is backed by Netlify Blobs;
 * in `vite dev` (and tests) by a folder of JSON files, so leads and quotes are
 * saved the same way everywhere.
 */
export interface JsonStore {
  get<T>(key: string): Promise<T | null>;
  /** Returns false when `onlyIfNew` is set and the key already exists. */
  set(key: string, value: unknown, options?: { onlyIfNew?: boolean }): Promise<boolean>;
  /** Binary files next to the JSON records, e.g. the quote PDF. */
  getBytes(key: string): Promise<Uint8Array | null>;
  setBytes(key: string, bytes: Uint8Array): Promise<void>;
}

export type StoreName = 'leads' | 'quotes';

const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

/** Dev fallback: one JSON file per key under `dir`. */
export function createFileStore(dir: string): JsonStore {
  return {
    async get<T>(key: string) {
      try {
        return JSON.parse(await readFile(join(dir, `${safeKey(key)}.json`), 'utf8')) as T;
      } catch {
        return null;
      }
    },
    async set(key, value, options) {
      await mkdir(dir, { recursive: true });
      try {
        await writeFile(join(dir, `${safeKey(key)}.json`), JSON.stringify(value, null, 2), {
          encoding: 'utf8',
          flag: options?.onlyIfNew ? 'wx' : 'w',
        });
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
        throw error;
      }
    },
    async getBytes(key) {
      try {
        return new Uint8Array(await readFile(join(dir, safeKey(key))));
      } catch {
        return null;
      }
    },
    async setBytes(key, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, safeKey(key)), bytes);
    },
  };
}

/** In-memory store for unit tests. */
export function createMemoryStore(): JsonStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async get<T>(key: string) {
      return data.has(key) ? (structuredClone(data.get(key)) as T) : null;
    },
    async set(key, value, options) {
      if (options?.onlyIfNew && data.has(key)) return false;
      data.set(key, structuredClone(value));
      return true;
    },
    async getBytes(key) {
      const value = data.get(key);
      return value instanceof Uint8Array ? value : null;
    },
    async setBytes(key, bytes) {
      data.set(key, bytes);
    },
  };
}

/** Netlify Blobs store (site-wide, survives deploys). */
export async function createBlobStore(name: StoreName): Promise<JsonStore> {
  const { getStore } = await import('@netlify/blobs');
  const store = getStore({ name, consistency: 'strong' });
  return {
    async get<T>(key: string) {
      return ((await store.get(key, { type: 'json' })) as T | null) ?? null;
    },
    async set(key, value, options) {
      const result = await store.setJSON(key, value, options?.onlyIfNew ? { onlyIfNew: true } : undefined);
      return result.modified;
    },
    async getBytes(key) {
      const buffer = await store.get(key, { type: 'arrayBuffer' });
      return buffer ? new Uint8Array(buffer) : null;
    },
    async setBytes(key, bytes) {
      await store.set(key, new Blob([bytes as BlobPart]));
    },
  };
}
