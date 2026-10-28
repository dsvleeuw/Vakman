import { useEffect, useRef, useState } from 'react';
import type { SectorId, SiteContent, StyleId } from '../types';
import { defaultSiteContent, sanitizeSiteContent } from '../utils/siteContent';

const STORAGE_KEY = 'klusbaas_mijn_sites';

function siteKey(sector: SectorId, styleId: StyleId): string {
  return `${sector}-${styleId}`;
}

/**
 * The site a craftsman filled in himself, kept in his own browser.
 *
 * The key is sector plus style, so the same craftsman can keep a page per
 * trade and per style without overwriting the other one.
 */
export function loadSiteContent(sector: SectorId, styleId: StyleId): SiteContent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const entry = (parsed as Record<string, unknown>)[siteKey(sector, styleId)];
    return sanitizeSiteContent(entry);
  } catch {
    return null;
  }
}

export function saveSiteContent(
  sector: SectorId,
  styleId: StyleId,
  content: SiteContent
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let all: Record<string, unknown> = {};
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) all = parsed as Record<string, unknown>;
    }
    all[siteKey(sector, styleId)] = content;
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
