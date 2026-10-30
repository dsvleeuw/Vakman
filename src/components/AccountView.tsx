import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, TriangleAlert } from 'lucide-react';
import type { AccountQuote, PaymentDetails, PublicPublishedSite, StoredLead } from '../types';
import {
  claimQuote,
  claimSite,
  fetchAccountLeads,
  fetchAccount,
  fetchAccountQuotes,
  fetchAccountSites,
  loginAccount,
  logoutAccount,
  parseManageLink,
  parseQuoteLink,
  registerAccount,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
  type AccountInfo,
} from '../utils/accountClient';
import { formatEuroCents, type QuoteStatus } from '../utils/quote';
import { acceptQuote } from '../utils/quoteClient';
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

/** Dutch labels for the forms a visitor can fill in. */
const LEAD_LABELS: Record<string, string> = {
  contact: 'Contactformulier',
  appointment: 'Afspraak',
  fault: 'Storingsmelding',
  surface: 'Offerteaanvraag',
};

/** The text a visitor wrote, per kind of form. */
const LEAD_TEXT_FIELDS = ['message', 'notes', 'details', 'service'];

function leadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** One request from a visitor, as the craftsman sees it in his account. */
const LeadRow: React.FC<{ lead: StoredLead }> = ({ lead }) => {
  const text = LEAD_TEXT_FIELDS.map((key) => lead.fields?.[key]).find((value) => value?.trim());
  return (
    <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
        {leadDate(lead.createdAt)} · {LEAD_LABELS[lead.type] ?? 'Aanvraag'} ·{' '}
        {lead.site?.biz} · referentie {lead.reference}
      </p>
      {text && <p className="m-0 text-sm text-stone-700 whitespace-pre-wrap">{text}</p>}
    </li>
  );
};

/** The status of an offer, in the words the customer sees. */
const QUOTE_STATUS: Record<QuoteStatus, string> = {
  open: 'Openstaand',
  accepted: 'Geaccepteerd',
  paid: 'Betaald',
  cancelled: 'Geannuleerd',
};

/**
 * One offer: what it costs, what the status is and how to pay. The offer is
 * the order of the customer, so it lives in the account next to his sites.
 */
/** The token out of the offer link, so the customer can open the offer. */
function quoteToken(url: string): string {
  try {
    return new URL(url, 'https://klusbaas.nl').searchParams.get('token') ?? '';
  } catch {
    return '';
  }
}

const QuoteRow: React.FC<{
  quote: AccountQuote;
  payment?: PaymentDetails;
  /** Called after an acceptance, so the list can show the new status. */
  onAccepted?: () => void;
}> = ({ quote, payment, onAccepted }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState('');

  const accept = async () => {
    const token = quoteToken(quote.url);
    if (!token) {
      setError('Deze offerte heeft geen link meer. Mail ons, dan sturen we hem opnieuw.');
      return;
    }
    if (!name.trim()) {
      setError('Vul eerst je naam in.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await acceptQuote(quote.id, token, name.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Accepteren lukte niet. Mail ons gerust.');
      return;
    }
    setNotice('Je offerte is geaccepteerd. Je krijgt een bevestiging per mail.');
    onAccepted?.();
  };

  return (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-3">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-black text-stone-900">Offerte {quote.id}</span>
      <span
        className={`text-sm font-bold ${
          quote.status === 'paid'
            ? 'text-emerald-700'
            : quote.status === 'cancelled'
              ? 'text-stone-500'
              : 'text-amber-700'
        }`}
      >
        {QUOTE_STATUS[quote.status]}
      </span>
    </div>
    <p className="m-0 text-sm text-stone-600">
      {quote.planName} · {quote.sectorName} · {quote.styleName} · {leadDate(quote.createdAt)}
    </p>
    <p className="m-0 text-sm font-bold text-stone-900">
      {formatEuroCents(quote.totalCents)} incl. btw
    </p>
    {quote.status === 'open' && payment && (
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex flex-col gap-1">
        <p className="m-0 text-sm font-bold text-stone-900">Zo betaal je</p>
        <p className="m-0 text-sm text-stone-700">
          Maak het bedrag over naar <strong className="text-stone-900">{payment.iban}</strong> t.n.v.{' '}
          {payment.name}, met als omschrijving <strong className="text-stone-900">{quote.id}</strong>.
        </p>
        <p className="m-0 text-xs text-stone-600">
          Zodra het bedrag binnen is, staat hier dat de offerte betaald is. Vragen?{' '}
          <a href={`mailto:${payment.email}`} className="font-bold underline underline-offset-2">
            {payment.email}
          </a>
        </p>
      </div>
    )}
    {quote.status === 'accepted' && quote.acceptedAt && (
      <p className="m-0 text-sm text-emerald-800">
        Geaccepteerd op {leadDate(quote.acceptedAt)}. Je bevestiging staat in je mail.
      </p>
    )}
    {quote.status === 'paid' && quote.paidAt && (
      <p className="m-0 text-sm text-emerald-800">Betaald op {leadDate(quote.paidAt)}.</p>
    )}
    {quote.status === 'paid' && (
      <a
        href={`/api/quote?id=${encodeURIComponent(quote.id)}&token=${encodeURIComponent(
          quoteToken(quote.url)
        )}&format=invoice`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-bold text-stone-900 underline underline-offset-2 inline-flex items-center min-h-11"
      >
        Factuur downloaden
      </a>
    )}
    {quote.status === 'open' && !payment && (
      <p className="m-0 text-sm text-stone-600">
        Deze offerte staat open. Klusbaas stuurt je de betaalgegevens, of vraag ernaar via je mail.
      </p>
    )}
    {quote.status === 'open' && (
      <div className="rounded-xl border border-stone-200 p-4 flex flex-col gap-3">
        <p className="m-0 text-sm font-bold text-stone-900">Accepteren</p>
        <label className="flex flex-col gap-1 text-sm font-bold text-stone-900">
          Je naam
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Voor- en achternaam"
            className="rounded-xl border border-stone-300 px-3 py-2 font-normal text-stone-900"
          />
        </label>
        <button
          type="button"
          onClick={accept}
          disabled={busy}
          className="rounded-xl bg-stone-900 text-white px-4 py-3 font-black disabled:opacity-60 inline-flex items-center justify-center gap-2 min-h-11"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Ja, ik ga akkoord
        </button>
      </div>
    )}
    {notice && <p className="m-0 text-sm font-bold text-emerald-800">{notice}</p>}
    {error && <p className="m-0 text-sm font-bold text-red-700">{error}</p>}
    <div>
      <RouteLink
        route={{ name: 'quote', id: quote.id, token: quoteToken(quote.url) }}
        className="text-sm font-bold text-stone-900 underline underline-offset-2 inline-flex items-center min-h-11"
      >
        Offerte bekijken
      </RouteLink>
    </div>
  </li>
  );
};

/** The token in the url, e.g. /mijn-account?reset=… */
function tokenFromUrl(key: 'reset' | 'verifieer'): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) ?? '';
}

export const AccountView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [sites, setSites] = useState<PublicPublishedSite[]>([]);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manageLink, setManageLink] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);

  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [quotes, setQuotes] = useState<AccountQuote[]>([]);
  const [payment, setPayment] = useState<PaymentDetails | undefined>();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadSites = useCallback(async () => {
    setSites(await fetchAccountSites());
  }, []);

  const loadLeads = useCallback(async () => {
    setLeads(await fetchAccountLeads());
  }, []);

  const loadQuotes = useCallback(async () => {
    const result = await fetchAccountQuotes();
    setQuotes(result.quotes);
    setPayment(result.payment);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      // Een link uit een mail: ?verifieer=… bevestigt het e-mailadres,
      // ?reset=… opent het formulier voor een nieuw wachtwoord.
      const verifyToken = tokenFromUrl('verifieer');
      if (verifyToken) {
        const result = await verifyEmail(verifyToken);
        if (!active) return;
        if (result.ok) {
          setNotice('Je e-mailadres is bevestigd. Je account is compleet.');
        } else {
          setError(result.error ?? 'Deze link klopt niet meer. Vraag een nieuwe aan in je account.');
        }
      }
      const token = tokenFromUrl('reset');
      if (token) {
        setResetToken(token);
        setMode('reset');
      }
      const current = await fetchAccount();
      if (!active) return;
      setAccount(current);
      if (current) {
        await loadSites();
        await loadLeads();
        await loadQuotes();
      }
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
    await loadLeads();
    await loadQuotes();
    setNotice(mode === 'register' ? 'Je account is klaar.' : 'Je bent ingelogd.');
  };

  const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await requestPasswordReset(email);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt. Probeer het opnieuw.');
      return;
    }
    setNotice(
      result.message ??
        'Als er een account is met dit e-mailadres, dan stuur ik je een link om een nieuw wachtwoord te kiezen.'
    );
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await resetPassword(resetToken, newPassword);
    setBusy(false);
    if (!result.ok || !result.account) {
      setError(result.error ?? 'Dat is niet gelukt. Vraag een nieuwe link aan.');
      return;
    }
    setNewPassword('');
    setResetToken('');
    setMode('login');
    setAccount(result.account);
    await loadSites();
    await loadLeads();
    await loadQuotes();
    setNotice('Je wachtwoord is gewijzigd. Je bent ingelogd.');
  };

  const handleResendVerification = async () => {
    setBusy(true);
    setError(null);
    const result = await resendVerification();
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt. Probeer het opnieuw.');
      return;
    }
    setNotice('Ik heb je een nieuwe bevestigingsmail gestuurd.');
  };

  const handleLogout = async () => {
    setBusy(true);
    await logoutAccount();
    setBusy(false);
    setAccount(null);
    setSites([]);
    setLeads([]);
    setQuotes([]);
    setPayment(undefined);
    setNotice('Je bent uitgelogd.');
    setError(null);
  };

  const handleClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClaimError(null);
    setNotice(null);
    // Een beheerlink van een site of een offertelink: beide bewijzen dat
    // het van de klant is.
    const site = parseManageLink(manageLink);
    const quote = site ? null : parseQuoteLink(manageLink);
    if (!site && !quote) {
      setClaimError(
        'Plak hier je beheerlink (/mijn-site/jansen-schilderwerken?token=…) of je offertelink (/offerte/KB-2026-0001?token=…).'
      );
      return;
    }
    setBusy(true);
    const result = site
      ? await claimSite(site.slug, site.token)
      : await claimQuote(quote!.id, quote!.token);
    setBusy(false);
    if (!result.ok) {
      setClaimError(result.error ?? 'Dat konden we niet koppelen.');
      return;
    }
    setManageLink('');
    await loadSites();
    await loadLeads();
    await loadQuotes();
    setNotice(site ? 'Je site is nu gekoppeld aan je account.' : 'Je offerte is nu gekoppeld aan je account.');
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
              {mode !== 'forgot' && mode !== 'reset' && (
              <>
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
              </>
              )}
            </div>

            {error && <Message tone="error">{error}</Message>}
            {notice && <Message tone="notice">{notice}</Message>}

            {mode === 'reset' ? (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div>
                  <label className={labelClass} htmlFor="account-new-password">
                    Nieuw wachtwoord
                  </label>
                  <input
                    id="account-new-password"
                    className={inputClass}
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Minimaal 8 tekens"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Zet mijn wachtwoord
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-sm font-bold text-stone-700 underline underline-offset-2 self-start min-h-11"
                >
                  Terug naar inloggen
                </button>
              </form>
            ) : mode === 'forgot' ? (
              <form onSubmit={handleForgot} className="flex flex-col gap-4">
                <p className="m-0 text-stone-600 leading-relaxed">
                  Vul je e-mailadres in. Als er een account is met dat adres, stuur ik je een link
                  om een nieuw wachtwoord te kiezen.
                </p>
                <div>
                  <label className={labelClass} htmlFor="account-forgot-email">
                    E-mailadres
                  </label>
                  <input
                    id="account-forgot-email"
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
                <button
                  type="submit"
                  disabled={busy}
                  className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  Stuur de link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-sm font-bold text-stone-700 underline underline-offset-2 self-start min-h-11"
                >
                  Terug naar inloggen
                </button>
              </form>
            ) : (
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
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setError(null);
                  setNotice(null);
                }}
                className="text-sm font-bold text-stone-700 underline underline-offset-2 self-start min-h-11"
              >
                Wachtwoord vergeten?
              </button>
            )}

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

        {!account.verified && (
          <section className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex flex-col gap-3">
            <h2 className="m-0 text-lg font-black text-stone-900">Bevestig je e-mailadres</h2>
            <p className="m-0 text-sm text-stone-700 leading-relaxed">
              Je account werkt, maar je e-mailadres is nog niet bevestigd. Doe dat even: dan weten wij
              dat we je op dit adres kunnen bereiken en hoort niemand anders op jouw naam in te loggen.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={busy}
              className="h-11 px-4 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center self-start"
            >
              Stuur de bevestigingsmail nog een keer
            </button>
          </section>
        )}

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
          <h2 className="m-0 text-xl font-black tracking-tight">
            Mijn aanvragen
            {leads.length > 0 && (
              <span className="text-base font-bold text-stone-500"> ({leads.length})</span>
            )}
          </h2>
          {leads.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-6">
              <p className="m-0 text-stone-700">
                Nog geen aanvragen. Zodra iemand je contactformulier, je afspraak of je
                storingsmelding invult, staat die hier. Je krijgt ze ook per mail.
              </p>
            </div>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-3">
              {leads.map((lead) => (
                <LeadRow key={lead.reference} lead={lead} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-black tracking-tight">
            Mijn offertes
            {quotes.length > 0 && (
              <span className="text-base font-bold text-stone-500"> ({quotes.length})</span>
            )}
          </h2>
          {quotes.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-6">
              <p className="m-0 text-stone-700">
                Nog geen offerte. Vraag een offerte aan via de site-editor: je ziet hier dan wat het
                kost, wat de status is en hoe je betaalt.
              </p>
            </div>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-3">
              {quotes.map((quote) => (
                <QuoteRow
                  key={quote.id}
                  quote={quote}
                  payment={payment}
                  onAccepted={loadQuotes}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-black tracking-tight">Een bestaande site of offerte koppelen</h2>
          <p className="m-0 text-stone-600 leading-relaxed">
            Heb je eerder een site gepubliceerd met een beheerlink, of een offerte per mail gekregen?
            Plak die link hier en hij komt in je account. De link blijft werken, maar vanaf nu hoef je
            alleen maar in te loggen.
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
