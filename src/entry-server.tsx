import { renderToPipeableStream } from 'react-dom/server';
import { Writable } from 'node:stream';
import App from './App';
import { setSSRRoute } from './hooks/useRouter';
import { setSSRPublishedSite } from './ssr/publishedSite';
import type { Route } from './utils/router';
import type { PublicPublishedSite } from './types';

/**
 * Build-time prerender entry. Renders the real app for one route and resolves
 * with the complete HTML once every Suspense boundary (including the lazy
 * route chunks) has settled, so crawlers get content instead of an empty div.
 *
 * Used by `scripts/prerender.ts`; never shipped to the browser.
 */
export async function renderRoute(route: Route): Promise<string> {
  setSSRRoute(route);
  setSSRPublishedSite(null);

  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    const timeout = setTimeout(() => reject(new Error('Prerender timed out')), 30_000);

    const { pipe } = renderToPipeableStream(<App />, {
      onAllReady() {
        clearTimeout(timeout);
        sink.on('finish', () => resolve(Buffer.concat(chunks).toString('utf8')));
        pipe(sink);
      },
      onError(error) {
        clearTimeout(timeout);
        reject(error);
      },
    });
  });
}

/**
 * Render a published site (`/site/<slug>`) with the content the customer
 * published. The function that serves that address uses this, so a crawler
 * and a link preview see the site instead of an empty page.
 */
export async function renderPublishedSite(
  slug: string,
  site: PublicPublishedSite
): Promise<string> {
  setSSRRoute({ name: 'published', slug });
  setSSRPublishedSite(site);

  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });

    const timeout = setTimeout(() => reject(new Error('Render timed out')), 30_000);

    const { pipe } = renderToPipeableStream(<App />, {
      onAllReady() {
        clearTimeout(timeout);
        sink.on('finish', () => resolve(Buffer.concat(chunks).toString('utf8')));
        pipe(sink);
      },
      onError(error) {
        clearTimeout(timeout);
        reject(error);
      },
    });
  });
}
