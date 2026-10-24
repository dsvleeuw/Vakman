import { useEffect } from 'react';
import { buildPath, getRouteMeta, type Route } from '../utils/router';

/**
 * Keep <title>, the meta description, the canonical link and the robots
 * directive in sync with the current URL so every page is bookmarkable and
 * understandable in a browser tab, so link previews / search results get a
 * relevant description, and so private screens stay out of search results.
 */

/** Routes that must never be indexed: wizard, quotes, tools and 404s. */
function isNoIndex(route: Route): boolean {
  return (
    route.name === 'wizard' || // /start/*
    route.name === 'quote' || // /offerte/*
    route.name === 'prospects' || // /kaart
    route.name === 'unsubscribe' || // /afmelden
    route.name === 'notFound'
  );
}

/**
 * Absolute canonical URL for the route, without query string or hash. Keeps
 * the origin of the prerendered canonical (the production SITE_URL), so a
 * deploy preview never points search engines at itself. Reads `window` only
 * inside the effect below, so server rendering stays stable.
 */
function canonicalHref(route: Route): string {
  const path = buildPath(route).split('?')[0];
  const prerendered = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  const origin = prerendered ? new URL(prerendered).origin : window.location.origin;
  return `${origin}${path}`;
}

/**
 * Set attributes on an existing head element or create it when the
 * prerendered shell did not include one (SPA-fallback routes such as
 * `/kaart` or `/offerte/…`). `key` is the identifying attribute
 * (name, property or rel); it is used to find the element and set on a new one.
 */
function setHeadElement(
  tag: 'link' | 'meta',
  key: Record<string, string>,
  attributes: Record<string, string>
): void {
  const [keyName, keyValue] = Object.entries(key)[0];
  const selector = `${tag}[${keyName}="${keyValue}"]`;
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) {
    for (const [attribute, value] of Object.entries(attributes)) {
      existing.setAttribute(attribute, value);
    }
    return;
  }
  const element = document.createElement(tag);
  element.setAttribute(keyName, keyValue);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }
  document.head.appendChild(element);
}

export function useRouteMeta(route: Route) {
  const { title, description } = getRouteMeta(route);
  const robots = isNoIndex(route) ? 'noindex, follow' : 'index, follow';

  useEffect(() => {
    document.title = title;

    setHeadElement('meta', { name: 'description' }, { content: description });
    setHeadElement('meta', { property: 'og:title' }, { content: title });
    setHeadElement('meta', { property: 'og:description' }, { content: description });
    setHeadElement('meta', { name: 'twitter:title' }, { content: title });
    setHeadElement('meta', { name: 'twitter:description' }, { content: description });
    setHeadElement('link', { rel: 'canonical' }, { href: canonicalHref(route) });
    setHeadElement('meta', { name: 'robots' }, { content: robots });
  }, [title, description, robots, route]);
}
