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
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPath, getRouteMeta, type Route } from '../src/utils/router';
import { getStyleFontHref } from '../src/utils/fonts';
import { ORDER, STYLES } from '../src/data/tradesData';
import { renderRoute } from '../src/entry-server';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const siteUrl = (process.env.PRERENDER_SITE_URL ?? 'https://klusbaas.nl').replace(/\/$/, '');

/** Routes worth rendering for search engines and link previews. */
function routesToPrerender(): Route[] {
  const routes: Route[] = [{ name: 'home' }];
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

  // Drop the static head tags we regenerate per route.
  const shell = template
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta property="og:title"[^>]*>/, '')
    .replace(/\s*<meta property="og:description"[^>]*>/, '')
    .replace(/\s*<meta property="og:type"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:card"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:title"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:description"[^>]*>/, '');

  const routes = routesToPrerender();
  let written = 0;

  for (const route of routes) {
    const markup = await renderRoute(route);
    const path = buildPath(route);
    const dataRoute = route.name;

    const html = shell
      .replace('</head>', `  ${headTags(route)}\n  </head>`)
      .replace(
        '<div id="root"></div>',
        `<div id="root" data-route="${dataRoute}">${markup}</div>`
      );

    const file = outputFile(path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html, 'utf8');
    written += 1;
    process.stdout.write(`  prerendered ${path} → ${file.replace(dist, 'dist')}\n`);
  }

  const urls = routes
    .map((route) => {
      const path = buildPath(route).split('?')[0];
      const priority = route.name === 'home' ? '1.0' : '0.8';
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
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n'),
    'utf8'
  );

  process.stdout.write(`✓ prerendered ${written} routes, sitemap with ${routes.length} URLs\n`);
}

main().catch((error) => {
  console.error('Prerender failed:', error);
  process.exit(1);
});
