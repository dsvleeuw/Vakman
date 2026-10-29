import React, { useEffect, useMemo, useState } from 'react';
import type { PublicPublishedSite } from '../types';
import { SECTORS, buildActiveSite } from '../data/tradesData';
import { styleIndexFromId } from '../utils/router';
import { sanitizeSiteContent } from '../utils/siteContent';
import { publishedSite } from '../utils/publishedContent';
import { publishedMeta } from '../utils/publishedMeta';
import { fetchPublishedSite } from '../utils/siteClient';
import { initialPublishedSite } from '../ssr/publishedSite';
import { SiteView } from './SiteView';

/**
 * The public page of a site a customer published: `/site/<slug>`.
 *
 * The page is drawn from the published site, not from the visitor's browser:
 * everyone sees the same thing, and it is the only page that ends up in a
 * search engine. The server renders the same markup, so a crawler and a
 * link preview see the site without running any JavaScript.
 */
export interface PublishedSiteViewProps {
  slug: string;
}

function setMeta(name: string, content: string, attribute: 'name' | 'property'): void {
  const selector = `meta[${attribute}="${name}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    existing.setAttribute('content', content);
    return;
  }
  const element = document.createElement('meta');
  element.setAttribute(attribute, name);
  element.setAttribute('content', content);
  document.head.appendChild(element);
}

export const PublishedSiteView: React.FC<PublishedSiteViewProps> = ({ slug }) => {
  const [site, setSite] = useState<PublicPublishedSite | null>(() => initialPublishedSite());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => !initialPublishedSite());

  useEffect(() => {
    // The server already rendered this site: no need to ask for it again.
    if (site?.slug === slug) return;

    let cancelled = false;
    setLoading(true);
    fetchPublishedSite(slug).then((result) => {
      if (cancelled) return;
      if (result.ok && result.site) {
        setSite(result.site);
        setError(null);
      } else {
        setError(result.error ?? 'Deze site bestaat niet (meer).');
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, site?.slug]);

  // The title, the description and the structured data of the customer's
  // site: a published site should look like a real business online.
  useEffect(() => {
    if (!site) return;
    const meta = publishedMeta(site, window.location.origin);

    document.title = meta.title;
    setMeta('description', meta.description, 'name');
    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:url', meta.canonical, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:title', meta.title, 'name');
    setMeta('twitter:description', meta.description, 'name');

    const canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', meta.canonical);
    else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', meta.canonical);
      document.head.appendChild(link);
    }

    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'index, follow');

    const scriptId = 'published-site-jsonld';
    document.getElementById(scriptId)?.remove();
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(meta.jsonLd);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [site]);

  const liveSite = useMemo(() => {
    if (!site) return null;
    const content = sanitizeSiteContent({
      version: 1,
      sector: site.sector,
      styleId: site.styleId,
      form: site.form,
      disabledServices: site.disabledServices,
      blocks: site.blocks,
      blockContent: site.blockContent,
      confirmed: site.confirmed,
      text: site.text,
    });
    if (!content) return null;
    const active = publishedSite(
      buildActiveSite(
        site.sector,
        styleIndexFromId(site.styleId),
        site.form,
        site.disabledServices,
        undefined,
        true
      ),
      content
    );
    // The address of this site: a form on this page must reach the owner of
    // this site, not Klusbaas.
    return { ...active, publishedSlug: site.slug };
  }, [site]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-600" role="status" aria-live="polite">
          Site laden…
        </p>
      </div>
    );
  }

  if (error || !liveSite || !site) {
    return (
      <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-3xl font-black m-0">Deze site bestaat niet (meer)</h1>
        <p className="text-stone-600 m-0 max-w-md">
          {error ??
            'We kunnen deze site niet vinden. Controleer het adres of neem contact op met Klusbaas.'}
        </p>
        <a
          href="/"
          className="h-12 px-6 inline-flex items-center rounded-full bg-stone-900 text-white font-bold no-underline"
        >
          Naar Klusbaas
        </a>
      </div>
    );
  }

  return (
    <SiteView
      site={liveSite}
      selectedSector={site.sector}
      selectedStyleIndex={styleIndexFromId(site.styleId)}
      published
    />
  );
};
