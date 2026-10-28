import type { PublishedSiteRecord } from '../types';
import { ORDER, STYLES } from '../data/tradesData';

/**
 * The sitemap.
 *
 * Two files, because they are made at two different moments: the marketing
 * pages are written when the site is built, the published customer sites
 * appear while the site is running. `robots.txt` points at both.
 */

export interface SitemapUrl {
  loc: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

/** The pages that exist on every build: the home page and the presets. */
export function marketingSitemapPaths(): string[] {
  const paths = ['/', '/privacy', '/nieuwsbrief'];
  for (const sector of ORDER) {
    for (const style of STYLES) {
      paths.push(`/voorbeeld/${sector}/${style.id}`);
    }
  }
  return paths;
}

export function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const parts = [`    <loc>${url.loc}</loc>`];
      if (url.lastmod) parts.push(`    <lastmod>${url.lastmod}</lastmod>`);
      if (url.changefreq) parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
      if (url.priority) parts.push(`    <priority>${url.priority}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** The sitemap with the sites that customers published. */
export function buildPublishedSitesSitemap(
  sites: PublishedSiteRecord[],
  siteUrl: string
): string {
  const origin = siteUrl.replace(/\/$/, '');
  const urls: SitemapUrl[] = sites
    .filter((site) => site.slug)
    .map((site) => ({
      loc: `${origin}/site/${site.slug}`,
      changefreq: 'monthly',
      priority: '0.6',
      ...(site.updatedAt ? { lastmod: new Date(site.updatedAt).toISOString().slice(0, 10) } : {}),
    }));

  return buildSitemapXml(urls);
}
