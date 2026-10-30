import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';
import { ADDONS, ADDON_GROUPS, isAddonIncluded } from '../../data/addons';
import { PLANS, getPlan } from '../../data/plans';
import type { SectorId, SiteContent, StyleId } from '../../types';
import type { AccountInfo } from '../../utils/accountClient';
import { track } from '../../utils/analytics';
import { calculateQuote, formatEuroCents } from '../../utils/quote';
import { requestQuote, type QuoteRequestResponse } from '../../utils/quoteClient';
import { RouteLink } from '../RouteLink';

/**
 * The tab where the customer asks for an offer himself (phase 7.13).
 *
 * He picks his own package and his own extra components, sees what it costs
 * right away and gets a real offer (number, PDF, price, way to pay) in his
 * account. Nothing is written by hand and nothing is invented: the prices
 * come from the same catalogue as the pricing page and the wizard.
 */

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10';

export interface OfferteTabProps {
  /** The logged-in customer, or null when nobody is logged in. */
  account: AccountInfo | null;
  /** The content of his site: his details and his services. */
  content: SiteContent;
  sector: SectorId;
  styleId: StyleId;
  /** His published site, when he has one. */
  siteSlug?: string;
  /** Open the tab with his details, so he can fill them in. */
  onOpenDetails: () => void;
}

export const OfferteTab: React.FC<OfferteTabProps> = ({
  account,
  content,
  sector,
  styleId,
  siteSlug,
  onOpenDetails,
}) => {
  const [plan, setPlan] = useState<string>('pro');
  const [addons, setAddons] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<QuoteRequestResponse['quote']>(undefined);

  const totals = useMemo(() => calculateQuote(plan, addons), [plan, addons]);
  const selectedPlan = getPlan(plan);

  // His own services, by name: they go on the offer.
  const services = useMemo(
    () => (content.services ?? []).map((offer) => offer.n.trim()).filter(Boolean),
    [content.services]
  );

  const details = [
    { label: 'Bedrijfsnaam', value: content.form.biz },
    { label: 'Jouw naam', value: content.form.owner },
    { label: 'Telefoon', value: content.form.phone },
    { label: 'Plaats', value: content.form.city },
  ];
  const missing = details.filter((entry) => !entry.value.trim());

  const toggleAddon = (id: string) => {
    setAddons((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await requestQuote({
      plan,
      addons,
      ...(message.trim() ? { message: message.trim() } : {}),
      sector,
      style: styleId,
      ...(services.length ? { services } : {}),
      form: {
        biz: content.form.biz,
        owner: content.form.owner,
        phone: content.form.phone,
        city: content.form.city,
      },
      ...(siteSlug ? { siteSlug } : {}),
    });
    setBusy(false);
    if (!result.ok || !result.quote) {
      setError(result.error ?? 'De offerte kon niet worden aangevraagd.');
      track('offer_request_error', { plan });
      return;
    }
    setDone(result.quote);
    setNotice(result.notice ?? null);
    track('offer_requested', { plan });
  };

  if (!account) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 flex flex-col gap-3">
        <h2 className="m-0 text-base font-black text-stone-900">Offerte aanvragen</h2>
        <p className="m-0 text-sm text-stone-700 leading-relaxed">
          Log in om een offerte aan te vragen. Dan staat je offerte in je account, met de
          status en hoe je betaalt. Je site blijft online, ook als je nog niet betaald hebt.
        </p>
        <RouteLink
          route={{ name: 'account' }}
          className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold inline-flex items-center justify-center self-start"
        >
          Inloggen of account maken
        </RouteLink>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col gap-3">
        <h2 className="m-0 text-base font-black text-emerald-900 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
          Offerte {done.id} staat klaar
        </h2>
        <p className="m-0 text-sm text-emerald-900">
          {done.planName} · {formatEuroCents(done.totalCents)} incl. btw. Je vindt de offerte
          in je account, met de status en hoe je betaalt. Je site blijft online.
        </p>
        {notice && <p className="m-0 text-sm text-amber-800">{notice}</p>}
        <div className="flex flex-wrap gap-2">
          <a
            href={done.path}
            className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-bold inline-flex items-center"
          >
            Bekijk je offerte
          </a>
          <RouteLink
            route={{ name: 'account' }}
            className="h-11 px-5 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-900 font-bold inline-flex items-center"
          >
            Naar je account
          </RouteLink>
          <button
            type="button"
            onClick={() => setDone(undefined)}
            className="h-11 px-4 rounded-full text-sm font-bold text-stone-700 underline underline-offset-2"
          >
            Nog een offerte aanvragen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-black text-stone-900">Offerte aanvragen</h2>
        <p className="m-0 text-sm text-stone-600 leading-relaxed">
          Kies zelf je pakket en de extra's die je wilt. Je ziet meteen wat het kost. De
          offerte komt in je account, met de status en hoe je betaalt.
        </p>
      </div>

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
        <legend className="text-sm font-bold text-stone-900 p-0">1. Kies je pakket</legend>
        <div className="grid grid-cols-1 gap-2" role="group" aria-label="Pakket">
          {PLANS.map((entry) => {
            const selected = plan === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setPlan(entry.id)}
                aria-pressed={selected}
                className={`p-3 rounded-xl border-2 text-left ${
                  selected
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-500'
                }`}
              >
                <span className="block font-extrabold text-sm">{entry.name}</span>
                <span className="block text-xs opacity-80">
                  {formatEuroCents(entry.price * 100)} excl. btw
                </span>
              </button>
            );
          })}
        </div>
        {selectedPlan && (
          <ul className="m-0 p-0 list-none flex flex-col gap-1 text-xs text-stone-600">
            {selectedPlan.features.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
        <legend className="text-sm font-bold text-stone-900 p-0">
          2. Extra componenten (optioneel)
        </legend>
        {ADDON_GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-stone-400">{group}</span>
            <div className="flex flex-col gap-1.5">
              {ADDONS.filter((addon) => addon.group === group).map((addon) => {
                const included = isAddonIncluded(addon, totals.planId);
                const checked = included || addons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    title={addon.description}
                    className={`min-h-11 px-3 py-2 rounded-xl border-2 flex items-center gap-2.5 text-sm ${
                      checked ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white'
                    } ${included ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={included}
                      onChange={() => toggleAddon(addon.id)}
                      className="w-4 h-4 accent-stone-900 shrink-0"
                    />
                    <span className="flex-1 min-w-0 font-semibold leading-tight">{addon.label}</span>
                    <span className="text-xs font-bold tabular-nums shrink-0 text-stone-600">
                      {included ? 'inbegrepen' : `+ ${formatEuroCents(addon.price * 100)}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-stone-900" htmlFor="offer-request-message">
          3. Wat wil je dat wij doen?
        </label>
        <textarea
          id="offer-request-message"
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Bijvoorbeeld: een eigen .nl-domein, of hulp bij mijn teksten."
          className={inputClass}
        />
        <p className="m-0 text-xs text-stone-500">
          In je eigen woorden: Klusbaas leest je bericht en verwerkt het in de offerte.
        </p>
      </div>

      <div className="rounded-xl border border-stone-200 p-4 flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-900">Je gegevens</span>
        <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          {details.map((entry) => (
            <div key={entry.label} className="flex flex-col">
              <dt className="text-xs text-stone-500">{entry.label}</dt>
              <dd className="m-0 font-semibold text-stone-900 break-words">
                {entry.value.trim() || '—'}
              </dd>
            </div>
          ))}
        </dl>
        {missing.length > 0 && (
          <p className="m-0 text-xs text-amber-800">
            Vul {missing.map((entry) => entry.label.toLowerCase()).join(' en ')} in bij Gegevens,
            dan staat het ook op je offerte.{' '}
            <button
              type="button"
              onClick={onOpenDetails}
              className="font-bold underline underline-offset-2"
            >
              Naar Gegevens
            </button>
          </p>
        )}
      </div>

      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-bold text-stone-900">Totaal</span>
          <span className="text-xl font-black text-stone-900">
            {formatEuroCents(totals.totalCents)}
          </span>
        </div>
        <p className="m-0 text-xs text-stone-600">
          {formatEuroCents(totals.subtotalCents)} excl. btw · {formatEuroCents(totals.vatCents)} btw
          (21%)
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 text-red-900 border border-red-200"
        >
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {busy ? 'Bezig…' : 'Vraag je offerte aan'}
      </button>
      <p className="m-0 text-xs text-stone-500">
        Je offerte is 30 dagen geldig. Je site blijft online, ook als je nog niet betaald hebt.
      </p>
    </div>
  );
};
