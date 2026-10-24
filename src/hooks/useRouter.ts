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

  window.addEventListener('popstate', () => {
    const pathChanged = currentPath() !== lastPath;
    lastPath = currentPath();
    emit();
    // Hash-only changes (in-page anchors on a generated site) keep their
    // scroll position; a real route change starts at the top.
    if (pathChanged) scrollToTop();
  });
}

function subscribe(listener: Listener) {
  ensureBrowserListeners();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot
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
    window.history.replaceState(null, '', target);
  } else {
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
