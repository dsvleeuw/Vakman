import { renderPublishedSite } from '../../src/entry-server';
import { toPublicSite } from '../../src/server/siteHandler';
import { createBlobSiteStorage } from '../../src/server/storage';
import { publishedHeadTags, publishedMeta } from '../../src/utils/publishedMeta';
import { replaceRootMarkup, stripStaticHeadTags } from '../../src/utils/htmlHead';

/**
 * GET /site/<slug>: the public page of a site a customer published.
 *
 * The page is rendered on the server with the published content, so a search
 * engine and a link preview in WhatsApp see the site instead of an empty
 * page that only fills up after the browser runs the app.
 */
export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const slug = url.pathname.split('/').filter(Boolean)[1] ?? '';
  const origin = (process.env.PUBLIC_SITE_URL || process.env.URL || url.origin).replace(/\/$/, '');

  const storage = await createBlobSiteStorage();
  const record = await storage.getSite(slug);
  if (!record) {
    return Response.redirect(`${origin}/`, 302);
  }

  const site = toPublicSite(record);
  const markup = await renderPublishedSite(slug, site);
  const meta = publishedMeta(site, origin);

  // The shell of the app: the same file the build writes, so the published
  // page looks like the rest of the site.
  const shell = await fetch(`${origin}/_shell.html`)
    .then((response) => (response.ok ? response.text() : ''))
    .catch(() => '');

  if (!shell) {
    return new Response(
      `<!doctype html><html lang="nl"><head><meta charset="utf-8" /><title>${meta.title}</title>` +
        `<meta name="description" content="${meta.description}" />` +
        `<link rel="canonical" href="${meta.canonical}" /></head>` +
        `<body>${markup}</body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const html = stripStaticHeadTags(shell)
    .replace('</head>', `  ${publishedHeadTags(meta, origin)}\n  </head>`);
  const page = replaceRootMarkup(html, markup, 'published').replace(
    '</body>',
    `  <script>window.__PUBLISHED_SITE__=${JSON.stringify(site)};</script>\n  </body>`
  );

  return new Response(page, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

export const config = { path: '/site/*' };
