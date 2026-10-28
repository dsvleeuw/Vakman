import { useEffect, useRef, useState } from 'react';
import type { SectorId, SiteContent, StyleId } from '../types';
import { defaultSiteContent, sanitizeSiteContent } from '../utils/siteContent';

const STORAGE_KEY = 'klusbaas_mijn_sites';

function siteKey(sector: SectorId, styleId: StyleId): string {
  return `${sector}-${styleId}`;
}

/**
 * The site the craftsman published for this trade and style. The editor
 * needs it: a second visit must update the site that is already online,
 * not create a second one.
 */
export interface PublishedLink {
  slug: string;
  token: string;
}

type StoredSite = {
  content?: SiteContent;
  published?: PublishedLink;
};

function readStore(): Record<string, StoredSite> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as Record<string, StoredSite>;
  } catch {
    return {};
  }
}

export function loadPublishedLink(
  sector: SectorId,
  styleId: StyleId
): PublishedLink | null {
  const entry = readStore()[siteKey(sector, styleId)];
  const link = entry?.published;
  return link && link.slug && link.token ? link : null;
}

export function savePublishedLink(
  sector: SectorId,
  styleId: StyleId,
  link: PublishedLink
): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readStore();
    const key = siteKey(sector, styleId);
    all[key] = { ...all[key], published: link };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage can be full or blocked; publishing itself still worked.
  }
}

/**
 * The site a craftsman filled in himself, kept in his own browser.
 *
 * The key is sector plus style, so the same craftsman can keep a page per
 * trade and per style without overwriting the other one.
 */
export function loadSiteContent(sector: SectorId, styleId: StyleId): SiteContent | null {
  const entry = readStore()[siteKey(sector, styleId)];
  return sanitizeSiteContent(entry?.content);
}

export function saveSiteContent(
  sector: SectorId,
  styleId: StyleId,
  content: SiteContent
): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readStore();
    const key = siteKey(sector, styleId);
    all[key] = { ...all[key], content };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage can be full or blocked; the editor keeps working in memory.
  }
}

/**
 * The content of the site the craftsman is editing, loaded when the trade or
 * style changes and stored again on every change.
 */
export function useSiteContent(
  sector: SectorId,
  styleId: StyleId
): { content: SiteContent; setContent: (content: SiteContent) => void } {
  const key = siteKey(sector, styleId);
  const loadedKey = useRef(key);
  const [content, setContent] = useState<SiteContent>(
    () => loadSiteContent(sector, styleId) ?? defaultSiteContent(sector, styleId)
  );

  // Swap the content when the craftsman picks another trade or style.
  if (loadedKey.current !== key) {
    loadedKey.current = key;
    const stored = loadSiteContent(sector, styleId);
    setContent(stored ?? defaultSiteContent(sector, styleId));
  }

  useEffect(() => {
    saveSiteContent(sector, styleId, content);
  }, [sector, styleId, content]);

  return { content, setContent };
}
