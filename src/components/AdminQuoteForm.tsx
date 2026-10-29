import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';
import { ADDONS } from '../data/addons';
import { PLANS } from '../data/plans';
import { STYLES } from '../data/tradesData';
import type { AdminAccount, AdminCreatedQuote, AdminQuote, AdminSite, StoredLead } from '../types';
import { createQuote } from '../utils/adminClient';
import { formatEuroCents } from '../utils/quote';

/**
 * The form where Klusbaas writes an offer for a customer by hand.
 *
 * Until now an offer only existed when a customer asked for one in the
 * wizard. A craftsman who makes his own account and publishes his own site
 * never got an order that way, so Klusbaas writes it here: the customer
 * gets the offer by mail, sees it in his account and can pay it.
 */

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10';

const labelClass = 'block text-sm font-bold text-stone-900 mb-1.5';

/** The status of an offer, in the words of the overview. */
const STATUS_LABEL: Record<string, string> = {
  open: 'Openstaand',
  accepted: 'Geaccepteerd',
  paid: 'Betaald',
  cancelled: 'Geannuleerd',
};

/** A customer Klusbaas can write an offer for: a site, or an account. */
interface Customer {
  key: string;
  label: string;
  email: string;
  accountId?: string;
  siteSlug?: string;
  biz: string;
  owner: string;
  phone: string;
  city: string;
  sector?: string;
  style?: string;
  services: string[];
  /** The request the customer sent, when he only sent one. */
  leadReference?: string;
}

/**
 * The requests that came in through a form of Klusbaas itself. A request on
 * a published customer site belongs to that craftsman, so it is not
 * Klusbaas' customer: only the requests without a site are.
 */
/**
 * A request carries the name of the style (`Vakwerk`), but an offer needs
 * the id of it (`klassiek`).
 */
function styleIdOf(styleName: string | undefined): string | undefined {
  if (!styleName) return undefined;
  return STYLES.find((style) => style.id === styleName || style.name === styleName)?.id;
}

function leadsAsCustomers(leads: StoredLead[]): Customer[] {
  return leads
    .filter((lead) => !lead.site?.slug)
    .map((lead) => {
      const fields = lead.fields ?? {};
      return {
        key: `lead-${lead.reference}`,
        label: `${fields.name?.trim() || fields.email?.trim() || 'Aanvraag'} · ${lead.site?.biz ?? 'onbekend'} (${lead.reference})`,
        email: fields.email?.trim() ?? '',
        // De bedrijfsnaam van de site waar de aanvraag binnenkwam is niet de
        // naam van het bedrijf van de klant; die vullen we zelf in.
        biz: lead.site?.slug ? (lead.site?.biz ?? '') : (fields.name?.trim() ?? ''),
        owner: fields.name?.trim() ?? '',
        phone: fields.phone?.trim() ?? '',
        city: fields.city?.trim() ?? '',
        ...(lead.site?.sector ? { sector: lead.site.sector } : {}),
        ...(styleIdOf(lead.site?.style) ? { style: styleIdOf(lead.site?.style) } : {}),
        services: [],
        leadReference: lead.reference,
      };
    });
}

function customersFrom(
  sites: AdminSite[],
  accounts: AdminAccount[],
  leads: StoredLead[] = []
): Customer[] {
  const byOwner = new Map<string, AdminAccount>();
  for (const account of accounts) byOwner.set(account.id, account);

  const customers: Customer[] = sites.map((site) => {
    const account = site.ownerId ? byOwner.get(site.ownerId) : undefined;
    return {
      key: site.slug,
      label: `${site.biz} · ${site.city} (${site.slug})`,
      email: account?.email ?? site.email ?? '',
      ...(account ? { accountId: account.id } : {}),
      siteSlug: site.slug,
      biz: site.biz,
      owner: site.owner,
      phone: site.phone,
      city: site.city,
      sector: site.sector,
      style: site.styleId,
      services: site.services,
    };
  });

  // Accounts without a published site are customers too: Klusbaas can still
  // write them an offer.
  for (const account of accounts) {
    if (customers.some((customer) => customer.accountId === account.id)) continue;
    customers.push({
      key: `account-${account.id}`,
      label: `${account.email} (alleen een account)`,
      email: account.email,
      accountId: account.id,
      biz: '',
      owner: '',
      phone: '',
      city: '',
      services: [],
    });
  }

  // Iemand die alleen een aanvraag stuurde is ook een klant: Klusbaas kan
  // hem een offerte schrijven, ook zonder account.
  for (const lead of leadsAsCustomers(leads)) {
    if (customers.some((customer) => customer.email === lead.email && lead.email)) continue;
    customers.push(lead);
  }

  return customers;
}

export interface AdminQuoteFormProps {
  sites: AdminSite[];
  accounts: AdminAccount[];
  /** The requests that came in through a form of Klusbaas. */
  leads?: StoredLead[];
  /** The offers that already exist, so a request is not offered twice. */
  quotes?: AdminQuote[];
  busy: boolean;
  /** Called after a successful offer, so the overview can be refreshed. */
  onCreated: (quote: AdminCreatedQuote) => void;
}

export const AdminQuoteForm: React.FC<AdminQuoteFormProps> = ({
  sites,
  accounts,
  leads = [],
  quotes = [],
  busy,
  onCreated,
}) => {
  const customers = useMemo(() => customersFrom(sites, accounts, leads), [sites, accounts, leads]);
  const [selected, setSelected] = useState('');
  const [plan, setPlan] = useState<string>(PLANS[1]?.id ?? 'pro');
  const [addons, setAddons] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [biz, setBiz] = useState('');
  const [owner, setOwner] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [send, setSend] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<AdminCreatedQuote | null>(null);

  const customer = customers.find((entry) => entry.key === selected) ?? null;
  // Een aanvraag die al een offerte heeft: geen tweede keer hetzelfde
  // werk doen tenzij Klusbaar het weet.
  const existingQuote = customer?.leadReference
    ? quotes.find((quote) => quote.leadReference === customer.leadReference)
    : undefined;

  const pick = (key: string) => {
    setSelected(key);
    setDone(null);
    const choice = customers.find((entry) => entry.key === key) ?? null;
    setEmail(choice?.email ?? '');
    setBiz(choice?.biz ?? '');
    setOwner(choice?.owner ?? '');
    setPhone(choice?.phone ?? '');
    setCity(choice?.city ?? '');
  };

  const toggleAddon = (id: string) => {
    setAddons((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWorking(true);
    setError(null);
    const result = await createQuote({
      email: email.trim(),
      plan,
      addons,
      send,
      ...(customer?.accountId ? { accountId: customer.accountId } : {}),
      ...(customer?.siteSlug ? { siteSlug: customer.siteSlug } : {}),
      ...(customer?.leadReference ? { leadReference: customer.leadReference } : {}),
      ...(customer?.sector ? { sector: customer.sector } : {}),
      ...(customer?.style ? { style: customer.style } : {}),
      ...(customer?.services.length ? { services: customer.services } : {}),
      ...(biz.trim() ? { biz: biz.trim() } : {}),
      ...(owner.trim() ? { owner: owner.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
    });
    setWorking(false);
    if (!result.ok || !result.quote) {
      setError(result.error ?? 'De offerte kon niet worden gemaakt.');
      return;
    }
    setDone(result.quote);
    onCreated(result.quote);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="offer-customer">
            Klant
          </label>
          <select
            id="offer-customer"
            className={inputClass}
            value={selected}
            onChange={(event) => pick(event.target.value)}
          >
            <option value="">Kies een klant…</option>
            {customers.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label}
                {entry.leadReference &&
                quotes.some((quote) => quote.leadReference === entry.leadReference)
                  ? ' · al een offerte'
                  : ''}
              </option>
            ))}
          </select>
          <p className="m-0 mt-1.5 text-xs text-stone-500">
            De gegevens van de klant komen uit zijn site of zijn aanvraag. Zonder
            account of site vul je ze zelf in.
          </p>
          {existingQuote && (
            <p className="m-0 mt-1.5 text-xs font-semibold text-amber-800">
              Voor deze aanvraag staat al offerte {existingQuote.id} (
              {STATUS_LABEL[existingQuote.status] ?? existingQuote.status}). Wil je een
              nieuwe prijs maken? Annuleer die eerst, of vul hieronder een andere
              aanvraag in.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass} htmlFor="offer-email">
            E-mailadres van de klant
          </label>
          <input
            id="offer-email"
            className={inputClass}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="naam@bedrijf.nl"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="offer-biz">
            Bedrijfsnaam
          </label>
          <input
            id="offer-biz"
            className={inputClass}
            value={biz}
            onChange={(event) => setBiz(event.target.value)}
            placeholder="Jansen Schilderwerken"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="offer-owner">
            Contactpersoon
          </label>
          <input
            id="offer-owner"
            className={inputClass}
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Jan Jansen"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="offer-phone">
            Telefoon
          </label>
          <input
            id="offer-phone"
            className={inputClass}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="06 12 34 56 78"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="offer-city">
            Plaats
          </label>
          <input
            id="offer-city"
            className={inputClass}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Haarlem"
          />
        </div>
      </div>

      <fieldset className="border-0 p-0 m-0">
        <legend className={labelClass}>Pakket</legend>
        <div className="flex flex-wrap gap-2">
          {PLANS.map((entry) => (
            <label
              key={entry.id}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold cursor-pointer ${
                plan === entry.id
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-800'
              }`}
            >
              <input
                type="radio"
                name="offer-plan"
                value={entry.id}
                checked={plan === entry.id}
                onChange={() => setPlan(entry.id)}
                className="sr-only"
              />
              {entry.name} · {formatEuroCents(entry.price * 100)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-0 p-0 m-0">
        <legend className={labelClass}>Extra componenten</legend>
        <div className="flex flex-wrap gap-2">
          {ADDONS.map((addon) => (
            <label
              key={addon.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                addons.includes(addon.id)
                  ? 'border-stone-900 bg-stone-50 text-stone-900'
                  : 'border-stone-300 bg-white text-stone-700'
              }`}
            >
              <input
                type="checkbox"
                checked={addons.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
                className="w-4 h-4 accent-stone-900"
              />
              {addon.label} · {formatEuroCents(addon.price * 100)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-bold text-stone-900">
        <input
          type="checkbox"
          checked={send}
          onChange={(event) => setSend(event.target.checked)}
          className="w-4 h-4 accent-stone-900"
        />
        De klant de offerte per mail sturen
      </label>

      {error && (
        <p
          role="alert"
          className="m-0 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-red-50 text-red-900 border border-red-200"
        >
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {done && (
        <div className="rounded-xl px-4 py-3 text-sm bg-emerald-50 text-emerald-900 border border-emerald-200">
          <p className="m-0 flex items-start gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            Offerte {done.id} aangemaakt · {done.planName} ·{' '}
            {formatEuroCents(done.totalCents)} incl. btw
          </p>
          <p className="m-0 mt-1 text-emerald-900/90">
            {done.mailed
              ? 'De mail met de offerte en de PDF is verstuurd.'
              : `De mail is niet verstuurd (${done.mailStatus}). De offerte staat in het overzicht; stuur hem zelf nog even.`}
          </p>
          <p className="m-0 mt-1 break-all text-emerald-900/80">{done.path}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || working}
        className="h-12 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2 self-start"
      >
        {working && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        Offerte maken
      </button>
    </form>
  );
};
