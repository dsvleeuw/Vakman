import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, TriangleAlert } from 'lucide-react';
import type { PublicPublishedSite } from '../types';
import {
  claimSite,
  fetchAccount,
  fetchAccountSites,
  loginAccount,
  logoutAccount,
  parseManageLink,
  registerAccount,
  type AccountInfo,
} from '../utils/accountClient';
import { Logo } from './Logo';
import { RouteLink } from './RouteLink';
import { SiteFooter } from './SiteFooter';

/**
 * `/mijn-account`: the place where a customer logs in and sees his sites.
 *
 * The account replaces the management link: with a login the customer finds
 * all his sites on one page. The link keeps working for sites that were
 * published before accounts existed.
 */

const AccountLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-stone-100 text-stone-900">
    <header className="px-4 sm:px-8 md:px-12 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 flex items-center justify-between gap-4 border-b border-stone-200/70">
      <RouteLink route={{ name: 'home' }} aria-label="Klusbaas homepage" className="min-h-11 inline-flex items-center">
        <Logo label={null} className="h-7 sm:h-8" />
      </RouteLink>
      <RouteLink
        route={{ name: 'editor' }}
        className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold inline-flex items-center whitespace-nowrap"
      >
        Nieuwe site
      </RouteLink>
    </header>
    <main id="main-content" className="flex-1 px-4 sm:px-8 md:px-12 py-10 sm:py-14">
      {children}
    </main>
    <SiteFooter />
  </div>
);

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10';

const labelClass = 'block text-sm font-bold text-stone-900 mb-1.5';

function Message({ tone, children }: { tone: 'error' | 'notice'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`m-0 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
        tone === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
      }`}
    >
      {tone === 'error' ? (
        <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <span>{children}</span>
    </p>
  );
}

const SiteRow: React.FC<{ site: PublicPublishedSite }> = ({ site }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="m-0 font-extrabold text-stone-900 truncate">{site.form.biz || site.slug}</p>
      <p className="m-0 text-sm text-stone-600 truncate">klusbaas.nl/site/{site.slug}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <RouteLink
        route={{ name: 'editor', slug: site.slug }}
        className="h-11 px-4 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold inline-flex items-center"
      >
        Bewerken
      </RouteLink>
      <RouteLink
        route={{ name: 'published', slug: site.slug }}
        className="h-11 px-4 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-900 text-sm font-bold inline-flex items-center"
      >
        Bekijken
      </RouteLink>
    </div>
  </li>
);

export const AccountView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [sites, setSites] = useState<PublicPublishedSite[]>([]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manageLink, setManageLink] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);

  const loadSites = useCallback(async () => {
    setSites(await fetchAccountSites());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const current = await fetchAccount();
      if (!active) return;
      setAccount(current);
      if (current) await loadSites();
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [loadSites]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const result =
      mode === 'register' ? await registerAccount(email, password) : await loginAccount(email, password);
    setBusy(false);
    if (!result.ok || !result.account) {
      setError(result.error ?? 'Dat is niet gelukt. Probeer het opnieuw.');
      return;
    }
    setAccount(result.account);
    setPassword('');
    await loadSites();
    setNotice(mode === 'register' ? 'Je account is klaar.' : 'Je bent ingelogd.');
  };

  const handleLogout = async () => {
    setBusy(true);
    await logoutAccount();
    setBusy(false);
    setAccount(null);
    setSites([]);
    setNotice('Je bent uitgelogd.');
    setError(null);
  };

  const handleClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClaimError(null);
    setNotice(null);
    const parsed = parseManageLink(manageLink);
    if (!parsed) {
      setClaimError('Plak hier je beheerlink, zoals /mijn-site/jansen-schilderwerken?token=…');
      return;
    }
    setBusy(true);
    const result = await claimSite(parsed.slug, parsed.token);
    setBusy(false);
    if (!result.ok) {
      setClaimError(result.error ?? 'Die site konden we niet koppelen.');
      return;
    }
    setManageLink('');
    await loadSites();
    setNotice('Je site is nu gekoppeld aan je account.');
  };

  if (loading) {
    return (
      <AccountLayout>
        <p className="flex items-center gap-3 text-stone-600" role="status">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          We kijken of je ingelogd bent…
        </p>
      </AccountLayout>
    );
  }

  if (!account) {
    return (
      <AccountLayout>
        <div className="max-w-xl mx-auto flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <h1 className="m-0 text-3xl sm:text-4xl font-black tracking-tight leading-tight">Mijn account</h1>
            <p className="m-0 text-stone-600 leading-relaxed">
              Met een account vind je al je websites op één plek. Je logt in met je e-mailadres en je wachtwoord,
              en je beheert je site zelf: tekst, onderdelen en gegevens.
            </p>
          </header>

          <div className="rounded-2xl bg-white border border-stone-200 p-6 flex flex-col gap-5">
            <div className="flex gap-2" role="group" aria-label="Inloggen of account maken">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                aria-pressed={mode === 'login'}
                className={`h-11 px-4 rounded-full text-sm font-bold inline-flex items-center ${
                  mode === 'login'
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Inloggen
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                aria-pressed={mode === 'register'}
                className={`h-11 px-4 rounded-full text-sm font-bold inline-flex items-center ${
                  mode === 'register'
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                Account maken
              </button>
            </div>

            {error && <Message tone="error">{error}</Message>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelClass} htmlFor="account-email">
                  E-mailadres
                </label>
                <input
                  id="account-email"
                  className={inputClass}
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="jij@bedrijf.nl"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="account-password">
                  Wachtwoord
                </label>
                <input
                  id="account-password"
                  className={inputClass}
                  type="password"
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimaal 8 tekens"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {mode === 'register' ? 'Maak mijn account' : 'Log in'}
              </button>
            </form>

            <p className="m-0 text-xs text-stone-500 leading-relaxed">
              Je wachtwoord wordt alleen als versleutelde hash bewaard. Niemand bij Klusbaas kan je wachtwoord lezen.
            </p>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <h1 className="m-0 text-3xl sm:text-4xl font-black tracking-tight leading-tight">Mijn account</h1>
          <p className="m-0 text-stone-600 leading-relaxed">
            Ingelogd als <strong className="text-stone-900">{account.email}</strong>.
          </p>
        </header>

        {notice && <Message tone="notice">{notice}</Message>}
        {error && <Message tone="error">{error}</Message>}

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-black tracking-tight">Mijn sites</h2>
          {sites.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-6 flex flex-col gap-3">
              <p className="m-0 text-stone-700">
                Je hebt nog geen site in je account. Vul je site in en publiceer hem: je site komt dan vanzelf hier te
                staan.
              </p>
              <RouteLink
                route={{ name: 'editor' }}
                className="h-12 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold inline-flex items-center justify-center self-start"
              >
                Naar de site-editor
              </RouteLink>
            </div>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-3">
              {sites.map((site) => (
                <SiteRow key={site.slug} site={site} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-black tracking-tight">Een bestaande site koppelen</h2>
          <p className="m-0 text-stone-600 leading-relaxed">
            Heb je eerder een site gepubliceerd met een beheerlink? Plak die link hier en de site komt in je account.
            De beheerlink blijft werken, maar vanaf nu hoef je alleen maar in te loggen.
          </p>
          {claimError && <Message tone="error">{claimError}</Message>}
          <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className={labelClass} htmlFor="account-manage-link">
                Beheerlink
              </label>
              <input
                id="account-manage-link"
                className={inputClass}
                type="text"
                value={manageLink}
                onChange={(event) => setManageLink(event.target.value)}
                placeholder="/mijn-site/jansen-schilderwerken?token=…"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="h-12 px-5 rounded-full border border-stone-300 hover:bg-stone-100 disabled:opacity-60 text-stone-900 font-bold inline-flex items-center justify-center whitespace-nowrap"
            >
              Koppelen
            </button>
          </form>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={busy}
            className="h-12 px-5 rounded-full border border-stone-300 hover:bg-stone-100 disabled:opacity-60 text-stone-900 font-bold inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Uitloggen
          </button>
          <RouteLink
            route={{ name: 'editor' }}
            className="h-12 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold inline-flex items-center"
          >
            Nieuwe site maken
          </RouteLink>
        </div>
      </div>
    </AccountLayout>
  );
};
