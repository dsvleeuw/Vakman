import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, LogOut, TriangleAlert } from 'lucide-react';
import {
  adminLogin,
  adminLogout,
  fetchAdminOverview,
  setQuoteStatus,
} from '../utils/adminClient';
import { formatEuroCents } from '../utils/quote';
import type { AdminOverview, AdminQuote, AdminSite, StoredLead } from '../types';
import { Logo } from './Logo';
import { RouteLink } from './RouteLink';

/**
 * `/klusbaas`: the overview for Klusbaas himself.
 *
 * It shows the published sites, the requests that came in and the offers
 * with their status. Klusbaas marks an offer as paid here once the money is
 * in.
 *
 * The page is behind a password from the environment (`ADMIN_PASSWORD`).
 * There is no default password: without it the page cannot be opened.
 */

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10';

function dateTime(value: number | string): string {
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Openstaand',
  paid: 'Betaald',
  cancelled: 'Geannuleerd',
};

const LEAD_LABEL: Record<string, string> = {
  contact: 'Contactformulier',
  appointment: 'Afspraak',
  fault: 'Storingsmelding',
  surface: 'Offerteaanvraag',
};

const SiteRow: React.FC<{ site: AdminSite }> = ({ site }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-2">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-black text-stone-900">{site.biz || site.slug}</span>
      <span className="text-xs font-bold text-stone-500">
        {site.hasAccount ? 'in een account' : 'zonder account'}
      </span>
    </div>
    <p className="m-0 text-sm text-stone-600">
      {site.owner} · {site.phone} · {site.city}
    </p>
    <p className="m-0 text-xs text-stone-500">
      /site/{site.slug} · bijgewerkt {dateTime(site.updatedAt)}
    </p>
    <div className="flex flex-wrap gap-3">
      <a
        href={`/site/${site.slug}`}
        className="text-sm font-bold text-stone-900 underline underline-offset-2"
      >
        Bekijk de site
      </a>
      <a
        href={site.manageUrl}
        className="text-sm font-bold text-stone-900 underline underline-offset-2"
      >
        Beheerlink
      </a>
    </div>
  </li>
);

const LeadRow: React.FC<{ lead: StoredLead }> = ({ lead }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-1">
    <div className="flex flex-wrap items-baseline gap-x-3">
      <span className="font-black text-stone-900">
        {lead.fields?.name?.trim() || 'Iemand zonder naam'}
      </span>
      {lead.fields?.phone?.trim() && (
        <a
          href={`tel:${lead.fields.phone.replace(/[^0-9+]/g, '')}`}
          className="text-sm font-bold text-stone-700 underline underline-offset-2"
        >
          {lead.fields.phone}
        </a>
      )}
      {lead.fields?.email?.trim() && (
        <a
          href={`mailto:${lead.fields.email}`}
          className="text-sm font-bold text-stone-700 underline underline-offset-2 break-all"
        >
          {lead.fields.email}
        </a>
      )}
    </div>
    <p className="m-0 text-xs text-stone-500">
      {dateTime(lead.createdAt)} · {LEAD_LABEL[lead.type] ?? 'Aanvraag'} · {lead.site?.biz} ·{' '}
      {lead.reference}
    </p>
    {(lead.fields?.message ?? '').trim() && (
      <p className="m-0 text-sm text-stone-700 whitespace-pre-wrap">{lead.fields.message}</p>
    )}
  </li>
);

const QuoteRow: React.FC<{
  quote: AdminQuote;
  busy: boolean;
  onStatus: (id: string, status: 'paid' | 'cancelled' | 'open') => void;
}> = ({ quote, busy, onStatus }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-2">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-black text-stone-900">{quote.id}</span>
      <span
        className={`text-sm font-bold ${
          quote.status === 'paid'
            ? 'text-emerald-700'
            : quote.status === 'cancelled'
              ? 'text-stone-500'
              : 'text-amber-700'
        }`}
      >
        {STATUS_LABEL[quote.status] ?? quote.status}
      </span>
    </div>
    <p className="m-0 text-sm text-stone-600">
      {quote.customerName} · {quote.customerPhone} · {quote.city}
      {quote.customerEmail ? ` · ${quote.customerEmail}` : ''}
    </p>
    <p className="m-0 text-sm text-stone-600">
      {quote.planName} · {quote.sectorName} · {dateTime(quote.createdAt)}
    </p>
    <p className="m-0 text-sm font-bold text-stone-900">
      {formatEuroCents(quote.totalCents)} incl. btw
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <a href={quote.url} className="text-sm font-bold text-stone-900 underline underline-offset-2">
        Offerte bekijken
      </a>
      {quote.status !== 'paid' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onStatus(quote.id, 'paid')}
          className="text-sm font-bold text-emerald-800 underline underline-offset-2 disabled:opacity-60"
        >
          Markeer als betaald
        </button>
      )}
      {quote.status === 'paid' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onStatus(quote.id, 'open')}
          className="text-sm font-bold text-stone-700 underline underline-offset-2 disabled:opacity-60"
        >
          Zet terug op openstaand
        </button>
      )}
      {quote.status !== 'cancelled' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onStatus(quote.id, 'cancelled')}
          className="text-sm font-bold text-stone-500 underline underline-offset-2 disabled:opacity-60"
        >
          Annuleer
        </button>
      )}
    </div>
  </li>
);

export const AdminView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setOverview(await fetchAdminOverview());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await adminLogin(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setPassword('');
    await load();
  };

  const handleLogout = async () => {
    setBusy(true);
    await adminLogout();
    setBusy(false);
    setOverview(null);
    setLoading(false);
  };

  const handleStatus = async (id: string, status: 'paid' | 'cancelled' | 'open') => {
    setBusy(true);
    const result = await setQuoteStatus(id, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    await load();
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100 text-stone-900">
      <header className="px-4 sm:px-8 md:px-12 py-4 flex items-center justify-between gap-4 border-b border-stone-200/70">
        <RouteLink
          route={{ name: 'home' }}
          aria-label="Klusbaas homepage"
          className="min-h-11 inline-flex items-center"
        >
          <Logo label={null} className="h-7 sm:h-8" />
        </RouteLink>
        <span className="text-sm font-bold text-stone-600">Klusbaas-overzicht</span>
      </header>
      <main id="main-content" className="flex-1 px-4 sm:px-8 md:px-12 py-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <h1 className="m-0 text-3xl sm:text-4xl font-black tracking-tight">Klusbaas-overzicht</h1>

          {error && (
            <p
              role="alert"
              className="m-0 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 text-red-900 border border-red-200"
            >
              <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {loading ? (
            <p className="flex items-center gap-3 text-stone-600" role="status">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Even laden…
            </p>
          ) : !overview ? (
            <form
              onSubmit={handleLogin}
              className="rounded-2xl bg-white border border-stone-200 p-6 flex flex-col gap-4 max-w-sm"
            >
              <label className="block text-sm font-bold text-stone-900" htmlFor="admin-password">
                Beheerderswachtwoord
              </label>
              <input
                id="admin-password"
                className={inputClass}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={busy}
                className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Inloggen
              </button>
            </form>
          ) : (
            <>
              <section className="flex flex-col gap-4">
                <h2 className="m-0 text-xl font-black tracking-tight">
                  Aanvragen{' '}
                  <span className="text-base font-bold text-stone-500">({overview.leads.length})</span>
                </h2>
                {overview.leads.length === 0 ? (
                  <p className="m-0 rounded-2xl bg-white border border-stone-200 p-6 text-stone-700">
                    Nog geen aanvragen.
                  </p>
                ) : (
                  <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {overview.leads.map((lead) => (
                      <LeadRow key={lead.reference} lead={lead} />
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="m-0 text-xl font-black tracking-tight">
                  Offertes{' '}
                  <span className="text-base font-bold text-stone-500">({overview.quotes.length})</span>
                </h2>
                {overview.quotes.length === 0 ? (
                  <p className="m-0 rounded-2xl bg-white border border-stone-200 p-6 text-stone-700">
                    Nog geen offertes.
                  </p>
                ) : (
                  <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {overview.quotes.map((quote) => (
                      <QuoteRow key={quote.id} quote={quote} busy={busy} onStatus={handleStatus} />
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="m-0 text-xl font-black tracking-tight">
                  Gepubliceerde sites{' '}
                  <span className="text-base font-bold text-stone-500">({overview.sites.length})</span>
                </h2>
                {overview.sites.length === 0 ? (
                  <p className="m-0 rounded-2xl bg-white border border-stone-200 p-6 text-stone-700">
                    Nog geen gepubliceerde sites.
                  </p>
                ) : (
                  <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {overview.sites.map((site) => (
                      <SiteRow key={site.slug} site={site} />
                    ))}
                  </ul>
                )}
              </section>

              <button
                type="button"
                onClick={handleLogout}
                disabled={busy}
                className="h-12 px-5 rounded-full border border-stone-300 hover:bg-stone-100 disabled:opacity-60 text-stone-900 font-bold inline-flex items-center gap-2 self-start"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Uitloggen
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
