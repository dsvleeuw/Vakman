/**
 * Build-time prerendering + SEO files.
 *
 * `vite build` produces a single index.html shell. This script renders the
 * real app for every indexable route, injects the markup into that shell with
 * per-route <title>, description, canonical and Open Graph tags, writes
 * `<route>/index.html`, and generates sitemap.xml + robots.txt.
 *
 * Run automatically by `npm run build` (and `bun run build`).
 *
 *   PRERENDER_SITE_URL   canonical origin, default https://klusbaas.nl
 *   VITE_DEMO_PHONE      read from the environment or .env like `vite build`,
 *                        so prerendered demo buttons match the client bundle
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { buildPath, getRouteMeta, type Route } from '../src/utils/router';
import { getStyleFontHref } from '../src/utils/fonts';
import { marketingSitemapPaths } from '../src/utils/sitemap';
import { stripStaticHeadTags } from '../src/utils/htmlHead';
import { ORDER, STYLES } from '../src/data/tradesData';
import { renderRoute } from '../src/entry-server';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
// Mirror Vite's env loading for the client-visible variables the app reads
// at render time (getDemoPhone), without overriding real environment values.
for (const [key, value] of Object.entries(loadEnv('production', join(here, '..'), 'VITE_'))) {
  process.env[key] ??= value;
}

const siteUrl = (process.env.PRERENDER_SITE_URL ?? 'https://klusbaas.nl').replace(/\/$/, '');

/** Routes worth rendering for search engines and link previews. */
function routesToPrerender(): Route[] {
  const routes: Route[] = [
    { name: 'home' },
    { name: 'privacy' },
    { name: 'newsletter' },
    { name: 'unsubscribe' },
  ];
  for (const sector of ORDER) {
    for (const style of STYLES) {
      routes.push({ name: 'site', sector, styleId: style.id });
    }
  }
  return routes;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function headTags(route: Route): string {
  const meta = getRouteMeta(route);
  const path = buildPath(route);
  const canonical = `${siteUrl}${path === '/' ? '/' : path.split('?')[0]}`;
  const image = `${siteUrl}/og-image.png`;

  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ];

  if (route.name === 'unsubscribe') {
    // Personal links land here; keep the page out of search results.
    tags.push('<meta name="robots" content="noindex" />');
  }

  if (route.name === 'site') {
    const styleFontHref = getStyleFontHref(route.styleId);
    if (styleFontHref) {
      tags.push(
        `<link rel="stylesheet" href="${styleFontHref}" data-style-font="${route.styleId}" />`
      );
    }
  }

  return tags.join('\n    ');
}

function outputFile(path: string): string {
  const clean = path.split('?')[0].replace(/^\//, '');
  return clean ? join(dist, clean, 'index.html') : join(dist, 'index.html');
}

async function main() {
  const template = await readFile(join(dist, 'index.html'), 'utf8');
  const rootPlaceholder = '<div id="root"></div>';
  if (!template.includes(rootPlaceholder)) {
    throw new Error(`Cannot prerender: dist/index.html is missing ${rootPlaceholder}`);
  }

  // Drop the static head tags we regenerate per route.
  const shell = stripStaticHeadTags(template);

  // Keep the empty shell next to the pages: the function that serves a
  // published site needs it to put the markup of that site in.
  await writeFile(join(dist, '_shell.html'), template, 'utf8');

  const routes = routesToPrerender();
  let written = 0;

  for (const route of routes) {
    const markup = await renderRoute(route);
    const path = buildPath(route);
    const dataRoute = route.name;

    const html = shell
      .replace('</head>', `  ${headTags(route)}\n  </head>`)
      .replace(rootPlaceholder, `<div id="root" data-route="${dataRoute}">${markup}</div>`);

    const file = outputFile(path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html, 'utf8');
    written += 1;
    process.stdout.write(`  prerendered ${path} → ${file.replace(dist, 'dist')}\n`);
  }

  // The marketing pages live in the sitemap of the build; the sites that
  // customers publish are added at runtime (`/sitemap-sites.xml`).
  const urls = marketingSitemapPaths()
    .map((path) => {
      const priority = path === '/' ? '1.0' : '0.8';
      return `  <url>\n    <loc>${siteUrl}${path === '/' ? '/' : path}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  await writeFile(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8'
  );

  await writeFile(
    join(dist, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# Wizard, appointment confirmation and preview-tool routes are for people,',
      '# not search results: the presets themselves are indexable.',
      'Disallow: /start/',
      'Disallow: /offerte/',
      'Disallow: /kaart',
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      `Sitemap: ${siteUrl}/sitemap-sites.xml`,
      '',
    ].join('\n'),
    'utf8'
  );

  process.stdout.write(`✓ prerendered ${written} routes, sitemap with ${urls.split('<url>').length - 1} URLs\n`);
}

main().catch((error) => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
