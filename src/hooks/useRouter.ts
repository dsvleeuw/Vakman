import { useSyncExternalStore } from 'react';
import { buildPath, parseRoute, type Route } from '../utils/router';

/**
 * Minimal, dependency-free client router on top of the History API.
 * The URL is the single source of truth, so browser back/forward, reloads
 * and shared links all land on the same page.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: Route = readRoute();
let hasBrowserListeners = false;
let lastPath = '';

function currentPath() {
  return `${window.location.pathname}${window.location.search}`;
}

interface ScrollState {
  scrollY?: number;
}

function readScrollState(state: unknown): number | null {
  if (!state || typeof state !== 'object') return null;
  const { scrollY } = state as ScrollState;
  return typeof scrollY === 'number' && Number.isFinite(scrollY) ? scrollY : null;
}

/** Remember the offset of the entry we are about to leave. */
function rememberScroll() {
  const current = (window.history.state ?? {}) as Record<string, unknown>;
  try {
    window.history.replaceState({ ...current, scrollY: window.scrollY }, '');
  } catch {
    // Ignore state-size or cross-origin errors.
  }
}

/** Upper bound for waiting on a lazy route view before restoring the offset. */
const RESTORE_SCROLL_MAX_MS = 1000;

/**
 * Restore the offset saved on the history entry we came from. The target
 * view is lazy-loaded, so the document is often still the old (or fallback)
 * height on the first frame; wait with repeated rAFs until it is tall enough
 * to scroll to the offset, at most ~1 s.
 */
function restoreScroll(scrollY: number | null) {
  const top = scrollY ?? 0;
  const started = performance.now();

  const attempt = () => {
    const fits = document.documentElement.scrollHeight >= top + window.innerHeight;
    if (top === 0 || fits || performance.now() - started > RESTORE_SCROLL_MAX_MS) {
      window.scrollTo({ top, left: 0, behavior: 'instant' });
      return;
    }
    window.requestAnimationFrame(attempt);
  };

  window.requestAnimationFrame(attempt);
}

function readRoute(): Route {
  if (typeof window === 'undefined') return { name: 'home' };
  return parseRoute(window.location.pathname, window.location.search);
}

function emit() {
  snapshot = readRoute();
  listeners.forEach((listener) => listener());
}

function scrollToTop() {
  // `instant` overrides the global `scroll-behavior: smooth`, which would
  // otherwise animate a jump to the top of a completely new page.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id) return;
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function ensureBrowserListeners() {
  if (hasBrowserListeners || typeof window === 'undefined') return;
  hasBrowserListeners = true;

  // We manage scroll position ourselves; otherwise the browser restores a
  // stale offset onto a completely different step of the wizard.
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  lastPath = currentPath();

  window.addEventListener('popstate', (event) => {
    const pathChanged = currentPath() !== lastPath;
    lastPath = currentPath();
    emit();
    // A real route change restores the offset the browser entry had when the
    // visitor left it; hash-only changes keep their current position.
    if (pathChanged) restoreScroll(readScrollState(event.state));
  });
}

function subscribe(listener: Listener) {
  ensureBrowserListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Route used while rendering on the server (build-time prerender). Without
 * this the prerenderer would always emit the home page.
 */
let ssrRoute: Route | null = null;

export function setSSRRoute(route: Route | null): void {
  ssrRoute = route;
  snapshot = route ?? readRoute();
}

export function useRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => ssrRoute ?? snapshot
  );
}

export interface NavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean;
  /** Scroll to the top after navigating (default true). */
  scroll?: boolean;
  /** Scroll to an element id on the target page. */
  hash?: string;
  /** Keep the current #hash when replacing the URL (used by in-page filters). */
  keepHash?: boolean;
}

export function navigate(route: Route, options: NavigateOptions = {}) {
  if (typeof window === 'undefined') return;

  const { replace = false, scroll = true, hash, keepHash = false } = options;
  const suffix = hash
    ? `#${hash}`
    : keepHash && window.location.hash
      ? window.location.hash
      : '';
  const target = `${buildPath(route)}${suffix}`;

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === target) {
    // Re-clicking the current page (brand, "start", a nav item) should still
    // bring the visitor back to the top; hash links scroll to their target.
    if (hash) scrollToHash(hash);
    else if (scroll) scrollToTop();
    return;
  }

  if (replace) {
    const current = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.replaceState(
      { ...current, scrollY: scroll ? 0 : current.scrollY },
      '',
      target
    );
  } else {
    rememberScroll();
    window.history.pushState(null, '', target);
  }

  lastPath = currentPath();
  emit();

  if (hash) {
    scrollToHash(hash);
  } else if (scroll) {
    scrollToTop();
  }
}

/** Rewrite the address bar without adding a history entry or scrolling. */
export function replaceUrl(route: Route, options: Omit<NavigateOptions, 'replace'> = {}) {
  navigate(route, { ...options, replace: true });
}
