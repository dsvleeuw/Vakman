/**
 * The head of the app shell carries the tags of the home page. A page that
 * writes its own title, description and Open Graph tags has to remove those
 * first, or the page ships every tag twice and the browser keeps the first
 * title it finds.
 */
export function stripStaticHeadTags(html: string): string {
  return html
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta property="og:title"[^>]*>/, '')
    .replace(/\s*<meta property="og:description"[^>]*>/, '')
    .replace(/\s*<meta property="og:type"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:card"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:title"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:description"[^>]*>/, '')
    .replace(/\s*<meta property="og:image"[^>]*>/, '')
    .replace(/\s*<meta name="twitter:image"[^>]*>/, '');
}

/**
 * Put the rendered markup in the app shell.
 *
 * The shell has an empty `<div id="root">`; a prerendered page already has
 * the markup of another page in it. Both are handled, so the same code works
 * for a fresh shell and for a page that was prerendered earlier.
 */
export function replaceRootMarkup(html: string, markup: string, dataRoute: string): string {
  const root = `<div id="root" data-route="${dataRoute}">${markup}</div>`;

  if (html.includes('<div id="root"></div>')) {
    return html.replace('<div id="root"></div>', root);
  }

  // The root element with content: replace everything up to the last closing
  // div before the end of the body.
  return html.replace(
    /<div id="root"[^>]*>[\s\S]*<\/div>(?=\s*<\/body>)/,
    root
  );
}
