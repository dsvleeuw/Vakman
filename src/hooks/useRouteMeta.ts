import { useEffect } from 'react';
import { getRouteMeta, type Route } from '../utils/router';

/**
 * Keep <title> and the meta description in sync with the current URL so
 * every page is bookmarkable and understandable in a browser tab, and so
 * link previews / search results get a relevant description.
 */
export function useRouteMeta(route: Route) {
  const { title, description } = getRouteMeta(route);

  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attribute: string, value: string) => {
      const element = document.head.querySelector(selector);
      element?.setAttribute(attribute, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }, [title, description]);
}
