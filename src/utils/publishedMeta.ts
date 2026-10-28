import type { PublicPublishedSite } from '../types';
import { SECTORS } from '../data/tradesData';

/**
 * The meta of a published site: the title, the description, the canonical
 * address and the structured data.
 *
 * The server writes them into the HTML of `/site/<slug>` and the browser
 * writes the same values into the head after a client-side navigation, so
 * both ways of opening a site look the same to a search engine.
 */
export interface PublishedMeta {
  title: string;
  description: string;
  canonical: string;
  jsonLd: Record<string, unknown>;
}

export function publishedMeta(site: PublicPublishedSite, origin: string): PublishedMeta {
  const sector = SECTORS[site.sector];
  const title = `${site.form.biz} | ${sector.name} in ${site.form.city}`;
  const description =
    site.text.intro?.trim() ||
    `${site.form.biz} is een ${sector.name.toLowerCase()} in ${site.form.city}.`;
  const canonical = `${origin.replace(/\/$/, '')}/site/${site.slug}`;

  return {
    title,
    description,
    canonical,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: site.form.biz,
      description,
      url: canonical,
      telephone: site.form.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.form.city,
        addressCountry: 'NL',
      },
      ...(site.form.kvk ? { vatID: site.form.kvk } : {}),
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The head tags of a published site, for the server-rendered page. */
export function publishedHeadTags(meta: PublishedMeta, origin: string): string {
  const image = `${origin.replace(/\/$/, '')}/og-image.png`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
  ].join('\n    ');
}
