import React, { useEffect, useState } from 'react';
import type { PublicPublishedSite } from '../types';
import { fetchPublishedSite } from '../utils/siteClient';
import { buildSitePrivacy } from '../utils/sitePrivacy';
import { Logo } from './Logo';
import { RouteLink } from './RouteLink';

/**
 * The privacy statement of a published customer site: `/site/<slug>/privacy`.
 *
 * On a customer site the craftsman is the party responsible for the data
 * that a visitor leaves behind. Klusbaas only runs the site and keeps the
 * request on his behalf. This page says so, in the words of the site.
 */
export const PublishedPrivacyView: React.FC<{ slug: string }> = ({ slug }) => {
  const [site, setSite] = useState<PublicPublishedSite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
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
  }, [slug]);

  useEffect(() => {
    document.title = site
      ? `Privacyverklaring · ${site.form.biz || site.slug}`
      : 'Privacyverklaring · Klusbaas';
  }, [site]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-600" role="status" aria-live="polite">
          Privacyverklaring laden…
        </p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-3xl font-black m-0">Deze site bestaat niet (meer)</h1>
        <p className="text-stone-600 m-0 max-w-md">
          {error ?? 'We kunnen deze privacyverklaring niet vinden.'}
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

  const statement = buildSitePrivacy(site);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="px-4 sm:px-8 md:px-12 py-4 border-b border-stone-200/70">
        <RouteLink
          route={{ name: 'published', slug }}
          className="min-h-11 inline-flex items-center no-underline text-stone-900"
        >
          <Logo label={null} className="h-7 sm:h-8" />
        </RouteLink>
      </header>
      <main id="main-content" className="px-4 sm:px-8 md:px-12 py-10 sm:py-14">
        <article className="max-w-2xl mx-auto flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <h1 className="m-0 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Privacyverklaring
            </h1>
            <p className="m-0 text-stone-600 leading-relaxed">
              Voor de website van <strong className="text-stone-900">{statement.responsible.biz}</strong>. Deze
              site is gemaakt en beheerd door Klusbaas.
            </p>
          </header>

          {statement.sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="m-0 text-xl font-black tracking-tight">{section.title}</h2>
              <ul className="m-0 p-0 list-disc pl-5 flex flex-col gap-2 text-stone-700 leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}

          <footer className="text-sm text-stone-600 leading-relaxed border-t border-stone-200 pt-6">
            <p className="m-0">
              Vragen over deze verklaring? Mail {statement.responsible.biz} (
              {statement.responsible.phone}
              {statement.responsible.email ? `, ${statement.responsible.email}` : ''}) of Klusbaas (
              {statement.processor}).
            </p>
            <p className="m-0 mt-3">
              <RouteLink
                route={{ name: 'published', slug }}
                className="font-bold underline underline-offset-2"
              >
                Terug naar de site
              </RouteLink>
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
};
