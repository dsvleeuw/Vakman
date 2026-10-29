import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

/**
 * The sessions of the Klusbaas overview.
 *
 * The overview is behind a password (the environment variable
 * `ADMIN_PASSWORD`). There is no default password: without it the overview
 * cannot be opened at all.
 */

export interface AdminSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdminStorage {
  saveSession(session: AdminSession): Promise<string>;
  getSession(id: string): Promise<AdminSession | null>;
  deleteSession(id: string): Promise<void>;
}

const ADMIN_SESSION_DAYS = 30;

/** A session that expires after 30 days. */
export function adminSession(id: string, now: number): AdminSession {
  return {
    id,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
}

const safe = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');

/** Sessions in memory, for tests. */
export function createMemoryAdminStorage(): AdminStorage {
  const sessions = new Map<string, AdminSession>();
  return {
    async saveSession(session) {
      sessions.set(session.id, session);
      return `memory:${session.id}`;
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
  };
}

/** Sessions as JSON files in `.data/admin` (used by `vite dev`). */
export function createFileAdminStorage(root: string): AdminStorage {
  const dir = path.join(root, 'admin');
  const file = (id: string) => path.join(dir, `${safe(id)}.json`);
  return {
    async saveSession(session) {
      await mkdir(dir, { recursive: true });
      await writeFile(file(session.id), JSON.stringify(session, null, 2));
      return file(session.id);
    },
    async getSession(id) {
      try {
        const raw = await readFile(file(id), 'utf8');
        return JSON.parse(raw) as AdminSession;
      } catch {
        return null;
      }
    },
    async deleteSession(id) {
      await rm(file(id), { force: true });
    },
  };
}

/** Sessions in Netlify Blobs (store `admin`). */
export async function createBlobAdminStorage(): Promise<AdminStorage> {
  const store = await getStore('admin');
  return {
    async saveSession(session) {
      await store.setJSON(session.id, session);
      return `blobs:admin/${session.id}`;
    },
    async getSession(id) {
      const record = (await store.get(id, { type: 'json' })) as AdminSession | null;
      return record ?? null;
    },
    async deleteSession(id) {
      await store.delete(id);
    },
  };
}
