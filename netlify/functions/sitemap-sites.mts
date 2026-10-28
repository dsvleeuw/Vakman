import { createBlobSiteStorage } from '../../src/server/storage';
import { buildPublishedSitesSitemap } from '../../src/utils/sitemap';

/**
 * GET /sitemap-sites.xml: the sites that customers published.
 *
 * The marketing pages are in the static sitemap.xml that the build writes;
 * published sites appear at runtime, so they need a sitemap of their own.
 */
export default async (req: Request): Promise<Response> => {
  const siteUrl = process.env.PUBLIC_SITE_URL || process.env.URL || new URL(req.url).origin;
  const storage = await createBlobSiteStorage();
  const sites = await storage.listSites();
  const xml = buildPublishedSitesSitemap(sites, siteUrl);

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

export const config = { path: '/sitemap-sites.xml' };
