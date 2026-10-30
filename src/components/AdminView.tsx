import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, LogOut, TriangleAlert } from 'lucide-react';
import {
  activateService,
  adminLogin,
  adminLogout,
  extendQuote,
  fetchAdminOverview,
  remindPayment,
  remindQuote,
  sendServiceInvoice,
  setDeliveryStep,
  setLeadStatus,
  setQuoteStatus,
  stopService,
  verifyAccount,
} from '../utils/adminClient';
import { daysSince, formatEuroCents } from '../utils/quote';
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from '../utils/lead';
import { servicePriceText, serviceStatusLabel } from '../utils/service';
import type {
  AdminAccount,
  AdminCreatedQuote,
  AdminOverview,
  AdminQuote,
  AdminSite,
  RequestStatus,
  StoredLead,
} from '../types';
import { AdminQuoteForm } from './AdminQuoteForm';
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
  accepted: 'Geaccepteerd',
  paid: 'Betaald',
  cancelled: 'Geannuleerd',
};

const LEAD_LABEL: Record<string, string> = {
  contact: 'Contactformulier',
  appointment: 'Afspraak',
  fault: 'Storingsmelding',
  surface: 'Offerteaanvraag',
  'offerte-aanvraag': 'Offerte-aanvraag',
  'roof-check': 'Dakcheck',
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

/** The filters above the list of requests. */
const LEAD_FILTERS: { id: 'all' | 'open' | RequestStatus; label: string }[] = [
  { id: 'all', label: 'Alles' },
  { id: 'open', label: 'Nog open' },
  { id: 'new', label: 'Nieuw' },
  { id: 'called', label: 'Gebeld' },
  { id: 'quoted', label: 'Offerte gestuurd' },
  { id: 'done', label: 'Opdracht af' },
  { id: 'dropped', label: 'Geen reactie' },
];

/**
 * Which requests the filter shows. "Nog open" means: nobody called yet and
 * nobody wrote an offer. Those are the ones that get lost.
 */
function leadsForFilter(
  leads: StoredLead[],
  filter: 'all' | 'open' | RequestStatus
): StoredLead[] {
  if (filter === 'all') return leads;
  if (filter === 'open') {
    return leads.filter((lead) => {
      const status = lead.status ?? 'new';
      return status === 'new' || status === 'called';
    });
  }
  return leads.filter((lead) => (lead.status ?? 'new') === filter);
}

/** The offer that was written for a request, when there is one. */
const LeadRow: React.FC<{
  lead: StoredLead;
  quote?: AdminQuote;
  busy?: boolean;
  onStatus: (reference: string, status: RequestStatus) => void;
}> = ({ lead, quote, busy, onStatus }) => (
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
    {quote && (
      <p className="m-0 text-sm font-semibold text-emerald-800">
        Er staat al een offerte voor: {quote.id} ({STATUS_LABEL[quote.status] ?? quote.status}).
        <a href={quote.url} className="ml-1 underline underline-offset-2">
          Bekijk de offerte
        </a>
      </p>
    )}
    {(lead.fields?.message ?? '').trim() && (
      <p className="m-0 text-sm text-stone-700 whitespace-pre-wrap">{lead.fields.message}</p>
    )}
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <label htmlFor={`lead-status-${lead.reference}`} className="text-xs font-bold text-stone-600">
        Status
      </label>
      <select
        id={`lead-status-${lead.reference}`}
        value={lead.status ?? 'new'}
        disabled={busy}
        onChange={(e) => onStatus(lead.reference, e.target.value as RequestStatus)}
        className="h-10 px-3 rounded-xl border-2 border-stone-300 bg-white text-sm font-bold text-stone-900 focus:outline-none focus:border-stone-900 disabled:opacity-60"
      >
        {REQUEST_STATUSES.map((status) => (
          <option key={status} value={status}>
            {REQUEST_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </div>
  </li>
);

/** A customer account: has he confirmed his e-mail address? */
const AccountRow: React.FC<{
  account: AdminAccount;
  busy: boolean;
  onVerify: (id: string) => void;
  onService: (id: string) => void;
  onServiceFree: (id: string) => void;
  onServiceStop: (id: string) => void;
  onServiceInvoice: (id: string) => void;
}> = ({ account, busy, onVerify, onService, onServiceFree, onServiceStop, onServiceInvoice }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-2">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-black text-stone-900 break-all">{account.email}</span>
      <span
        className={`text-sm font-bold ${
          account.verified ? 'text-emerald-700' : 'text-amber-700'
        }`}
      >
        {account.verified ? 'Bevestigd' : 'Niet bevestigd'}
      </span>
    </div>
    <p className="m-0 text-xs text-stone-500">
      Aangemaakt {dateTime(account.createdAt)} · {account.sites} site
      {account.sites === 1 ? '' : 's'}
    </p>
    {account.service && (
      <p className="m-0 text-sm text-stone-700">
        Service: {serviceStatusLabel(account.service.status)}
        {account.service.status === 'active' &&
          ` · ${servicePriceText(account.service.amountCents)}`}
        {account.service.siteSlug && ` · /site/${account.service.siteSlug}`}
      </p>
    )}
    {!account.verified && (
      <button
        type="button"
        disabled={busy}
        onClick={() => onVerify(account.id)}
        className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60 self-start"
      >
        Bevestig het e-mailadres zelf
      </button>
    )}
    <div className="flex flex-wrap gap-3">
      {account.service?.status === 'active' ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onServiceInvoice(account.id)}
            className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60 self-start"
          >
            Stuur de maandfactuur
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onServiceStop(account.id)}
            className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60 self-start"
          >
            Stop de service
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onService(account.id)}
            className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60 self-start"
          >
            Zet de service aan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onServiceFree(account.id)}
            className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60 self-start"
          >
            Zet de gratis maanden aan (bij Pro)
          </button>
        </>
      )}
    </div>
  </li>
);

const QuoteRow: React.FC<{
  quote: AdminQuote;
  busy: boolean;
  onStatus: (id: string, status: 'paid' | 'cancelled' | 'open') => void;
  onRemind: (id: string) => void;
  onRemindPayment: (id: string) => void;
  onExtend: (id: string) => void;
  onDelivery: (id: string, itemId: string, done: boolean) => void;
}> = ({ quote, busy, onStatus, onRemind, onRemindPayment, onExtend, onDelivery }) => (
  <li className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-col gap-2">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-black text-stone-900">{quote.id}</span>
      <span
        className={`text-sm font-bold ${
          quote.status === 'paid'
            ? 'text-emerald-700'
            : quote.status === 'accepted'
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
    {quote.delivery && quote.delivery.length > 0 && (
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex flex-col gap-2">
        <p className="m-0 text-sm font-bold text-stone-900">Oplevering</p>
        <ul className="m-0 p-0 list-none flex flex-col gap-1">
          {quote.delivery.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={busy}
                  onChange={() => onDelivery(quote.id, item.id, !item.done)}
                  className="mt-1 w-4 h-4 shrink-0"
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )}
    <p className="m-0 text-sm text-stone-600">
      {quote.planName} · {quote.sectorName} · {dateTime(quote.createdAt)}
    </p>
    <p className="m-0 text-sm font-bold text-stone-900">
      {formatEuroCents(quote.totalCents)} incl. btw
    </p>
    {quote.expired && quote.status !== 'paid' && quote.status !== 'cancelled' && (
      <p className="m-0 text-sm font-semibold text-amber-800">
        Verlopen op {dateTime(quote.validUntil)}. De prijs is geen belofte meer: schrijf een
        nieuwe offerte, of verleng deze als de prijs nog klopt.
      </p>
    )}
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
      {quote.status === 'accepted' && (
        <span className="text-sm text-stone-600">
          De klant heeft ja gezegd
          {quote.acceptedAt ? ` op ${dateTime(quote.acceptedAt)}` : ''}. Zodra het bedrag
          binnen is, markeer je hem als betaald.
        </span>
      )}
      {quote.status === 'accepted' && quote.paymentReportedAt && (
        <p className="m-0 text-sm font-semibold text-emerald-800">
          De klant meldt dat hij heeft betaald ({dateTime(quote.paymentReportedAt)}). Controleer
          je bankrekening en markeer de offerte als betaald.
        </p>
      )}
      {quote.status === 'accepted' && quote.acceptedAt && !quote.paymentReportedAt && (
        <>
          <p className="m-0 text-sm font-semibold text-amber-800">
            Wacht al {daysSince(quote.acceptedAt)} dag{daysSince(quote.acceptedAt) === 1 ? '' : 'en'} op
            betaling.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemindPayment(quote.id)}
            className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60"
          >
            Stuur een betaalherinnering
          </button>
        </>
      )}
      {quote.status === 'open' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onRemind(quote.id)}
          className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60"
        >
          Stuur een herinnering
        </button>
      )}
      {quote.expired && quote.status !== 'paid' && quote.status !== 'cancelled' && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onExtend(quote.id)}
          className="text-sm font-bold text-stone-900 underline underline-offset-2 disabled:opacity-60"
        >
          Verleng met 30 dagen
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
  const [notice, setNotice] = useState<string | null>(null);
  // Welke aanvragen hij wil zien: alles, of alleen wat nog openstaat.
  const [leadFilter, setLeadFilter] = useState<'all' | 'open' | RequestStatus>('all');

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

  const handleVerify = async (id: string) => {
    setBusy(true);
    const result = await verifyAccount(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    await load();
  };

  const handleCreated = async (quote: AdminCreatedQuote) => {
    // Het overzicht laat de nieuwe offerte meteen zien.
    await load();
    setNotice(`Offerte ${quote.id} staat nu in het overzicht.`);
  };

  // Waar een aanvraag staat. Een aanvraag die nergens op volgt, is een
  // verloren order.
  const handleLeadStatus = async (reference: string, status: RequestStatus) => {
    setBusy(true);
    const result = await setLeadStatus(reference, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    await load();
  };

  // Wat Klusbaas voor de site van de klant heeft gedaan: de klant ziet
  // dezelfde lijst in zijn account.
  const handleDelivery = async (id: string, itemId: string, done: boolean) => {
    setBusy(true);
    const result = await setDeliveryStep(id, itemId, done);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    await load();
  };

  // De maandelijkse service aanzetten: de klant heeft erom gevraagd in
  // zijn account, of de maanden die bij een pakket horen worden gratis
  // gestart.
  const handleService = async (id: string) => {
    setBusy(true);
    const result = await activateService(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(
      result.serviceMailStatus === 'sent'
        ? 'De service staat aan. De klant heeft de mail met het bedrag en de IBAN gekregen.'
        : `De service staat aan (mail: ${result.serviceMailStatus ?? 'onbekend'}).`
    );
    await load();
  };

  // De gratis maanden die bij het Pro-pakket horen: de service staat aan,
  // maar de klant betaalt nog niets.
  const handleServiceFree = async (id: string) => {
    setBusy(true);
    const result = await activateService(id, 0);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice('De service staat aan. De maanden die bij het pakket horen zijn gratis.');
    await load();
  };

  const handleServiceStop = async (id: string) => {
    setBusy(true);
    const result = await stopService(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice('De service is gestopt. Lever de site en de code aan de klant terug.');
    await load();
  };

  const handleServiceInvoice = async (id: string) => {
    setBusy(true);
    const result = await sendServiceInvoice(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(
      result.serviceMailStatus === 'sent'
        ? 'De maandfactuur is verstuurd.'
        : `De maandfactuur is klaargezet (${result.serviceMailStatus ?? 'onbekend'}).`
    );
    await load();
  };

  const handleStatus = async (id: string, status: 'paid' | 'cancelled' | 'open') => {
    setBusy(true);
    const result = await setQuoteStatus(id, status);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(
      status === 'paid'
        ? `Offerte ${id} is gemarkeerd als betaald. De klant heeft de factuur gekregen.`
        : `Offerte ${id} is nu ${status === 'cancelled' ? 'geannuleerd' : 'openstaand'}.`
    );
    await load();
  };

  // Een verlopen offerte verlengen: de prijs klopt nog, dus de klant mag
  // hem weer accepteren.
  const handleExtend = async (id: string) => {
    setBusy(true);
    const result = await extendQuote(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(`Offerte ${id} is verlengd tot ${result.validUntil ?? 'vandaag + 30 dagen'}.`);
    await load();
  };

  // De klant heeft ja gezegd maar nog niet betaald: hij krijgt het bedrag
  // en de IBAN nog een keer, want daar gaat het geld verloren.
  const handleRemindPayment = async (id: string) => {
    setBusy(true);
    const result = await remindPayment(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(
      result.paymentReminderStatus === 'sent'
        ? `Betaalherinnering voor offerte ${id} is verstuurd.`
        : `Betaalherinnering voor offerte ${id} is klaargezet (${
            result.paymentReminderStatus ?? 'onbekend'
          }).`
    );
    await load();
  };

  // Klusbaas volgt een openstaande offerte op: de klant krijgt een
  // herinnering met de link naar de offerte.
  const handleRemind = async (id: string) => {
    setBusy(true);
    const result = await remindQuote(id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'Dat is niet gelukt.');
      return;
    }
    setNotice(
      result.reminderStatus === 'sent'
        ? `Herinnering voor offerte ${id} is verstuurd.`
        : `Herinnering voor offerte ${id} is klaargezet (${result.reminderStatus ?? 'onbekend'}).`
    );
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

          {notice && (
            <p className="m-0 rounded-xl px-4 py-3 text-sm font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
              {notice}
            </p>
          )}

          {overview?.config && !overview.config.ready && (
            <section className="rounded-2xl bg-white border border-amber-300 p-5 flex flex-col gap-3">
              <h2 className="m-0 text-lg font-black text-stone-900">Voor de eerste verkoop</h2>
              <p className="m-0 text-sm text-stone-700">
                Dit staat nog open. Tot het rond is, moet Klusbaas het zelf doen.
              </p>
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {overview.config.checks
                  .filter((check) => !check.ok)
                  .map((check) => (
                    <li key={check.id} className="flex items-start gap-2 text-sm">
                      <TriangleAlert
                        className="w-4 h-4 mt-0.5 shrink-0 text-amber-700"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="text-stone-900">{check.label}.</strong>{' '}
                        <span className="text-stone-700">{check.detail}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {overview?.config?.ready && (
            <p className="m-0 rounded-xl px-4 py-3 text-sm font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
              Klaar voor de eerste verkoop: betalen, factureren en mailen werken.
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
                <h2 className="m-0 text-xl font-black tracking-tight">Offerte maken</h2>
                <p className="m-0 text-stone-600 leading-relaxed">
                  Een klant die zelf een account maakt en zijn site publiceert vraagt
                  zelf geen offerte aan. Schrijf hem er hier één: de klant krijgt
                  hem per mail, ziet hem in zijn account en kan hem betalen. Ook
                  iemand die alleen een aanvraag stuurde staat in de lijst.
                </p>
                <div className="rounded-2xl bg-white border border-stone-200 p-6">
                  <AdminQuoteForm
                    sites={overview.sites}
                    accounts={overview.accounts}
                    leads={overview.leads}
                    quotes={overview.quotes}
                    busy={busy}
                    onCreated={handleCreated}
                  />
                </div>
              </section>

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
                  <>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter op status">
                      {LEAD_FILTERS.map((filter) => {
                        const count = leadsForFilter(overview.leads, filter.id).length;
                        const active = leadFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setLeadFilter(filter.id)}
                            className={`h-10 px-4 rounded-full border-2 text-sm font-bold cursor-pointer transition-colors ${
                              active
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:border-stone-700'
                            }`}
                          >
                            {filter.label} ({count})
                          </button>
                        );
                      })}
                    </div>
                    {leadsForFilter(overview.leads, leadFilter).length === 0 ? (
                      <p className="m-0 rounded-2xl bg-white border border-stone-200 p-6 text-stone-700">
                        Geen aanvragen met deze status.
                      </p>
                    ) : (
                    <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {leadsForFilter(overview.leads, leadFilter).map((lead) => (
                      <LeadRow
                        key={lead.reference}
                        lead={lead}
                        quote={overview.quotes.find((quote) => quote.leadReference === lead.reference)}
                        busy={busy}
                        onStatus={handleLeadStatus}
                      />
                    ))}
                    </ul>
                    )}
                  </>
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
                      <QuoteRow
                      key={quote.id}
                      quote={quote}
                      busy={busy}
                      onStatus={handleStatus}
                      onRemind={handleRemind}
                      onRemindPayment={handleRemindPayment}
                      onExtend={handleExtend}
                      onDelivery={handleDelivery}
                    />
                    ))}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-4">
                <h2 className="m-0 text-xl font-black tracking-tight">
                  Accounts <span className="text-base font-bold text-stone-500">({overview.accounts.length})</span>
                </h2>
                {overview.accounts.length === 0 ? (
                  <p className="m-0 rounded-2xl bg-white border border-stone-200 p-6 text-stone-700">
                    Nog geen accounts.
                  </p>
                ) : (
                  <ul className="m-0 p-0 list-none flex flex-col gap-3">
                    {overview.accounts.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        busy={busy}
                        onVerify={handleVerify}
                        onService={handleService}
                        onServiceFree={handleServiceFree}
                        onServiceStop={handleServiceStop}
                        onServiceInvoice={handleServiceInvoice}
                      />
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
