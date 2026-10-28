import type { PublicPublishedSite } from '../types';

/**
 * The published site of the page that is being rendered on the server.
 *
 * The function that serves `/site/<slug>` reads the site from the storage
 * and hands it over here, so the page is rendered with the real content
 * instead of an empty div that only fills up after the browser runs the
 * app. The browser finds the same data in `window.__PUBLISHED_SITE__`.
 */
let ssrSite: PublicPublishedSite | null = null;

export function setSSRPublishedSite(site: PublicPublishedSite | null): void {
  ssrSite = site;
}

export function getSSRPublishedSite(): PublicPublishedSite | null {
  return ssrSite;
}

declare global {
  interface Window {
    __PUBLISHED_SITE__?: PublicPublishedSite;
  }
}

/**
 * The published site the browser starts with: the one the server rendered,
 * or the one the server put in the page.
 */
export function initialPublishedSite(): PublicPublishedSite | null {
  if (typeof window !== 'undefined' && window.__PUBLISHED_SITE__) {
    return window.__PUBLISHED_SITE__;
  }
  return getSSRPublishedSite();
}
