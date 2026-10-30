import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileText, Loader2, TriangleAlert } from 'lucide-react';
import { DeliveryList } from './DeliveryList';
import { Logo } from './Logo';
import { deliveryDeadline, formatDutchDate, formatEuroCents, type PublicQuote } from '../utils/quote';
import { acceptQuote, reportPayment } from '../utils/quoteClient';

interface QuoteViewProps {
  id: string;
  token: string;
  onGoHome: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; quote: PublicQuote }
  | { status: 'error'; message: string };

type AcceptState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done' }
  | { status: 'error'; message: string };

type PayState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done' }
  | { status: 'error'; message: string };

/**
 * `/offerte/:id?token=…`: the stored quote as a page, loaded from
 * `GET /api/quote`. The token comes from the e-mail; without it the API
 * answers 403/404 and we show why.
 */
export const QuoteView: React.FC<QuoteViewProps> = ({ id, token, onGoHome }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [accept, setAccept] = useState<AcceptState>({ status: 'idle' });
  const [pay, setPay] = useState<PayState>({ status: 'idle' });
  const [name, setName] = useState('');
  const query = `id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`/api/quote?${query}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setState({ status: 'error', message: body.error || 'Deze offerte kon niet worden geladen.' });
          return;
        }
        setState({ status: 'ready', quote: body as PublicQuote });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Geen verbinding met de server.' });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // De klant zegt ja. De offerte krijgt de status "geaccepteerd", de klant
  // krijgt een bevestiging per mail en Klusbaas krijgt een mail; het
  // overmaken doet de klant zelf.
  const sendAccept = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccept({ status: 'sending' });
    const result = await acceptQuote(id, token, name.trim());
    if (!result.ok) {
      setAccept({
        status: 'error',
        message: result.error ?? 'We konden je akkoord niet opslaan. Mail ons gerust even.',
      });
      return;
    }
    setAccept({ status: 'done' });
  };

  // De klant meldt dat hij het bedrag heeft overgemaakt. Klusbaas controleert
  // zelf zijn bankrekening; de offerte wordt pas door hem als betaald
  // gemarkeerd.
  const sendPaymentReport = async () => {
    setPay({ status: 'sending' });
    const result = await reportPayment(id, token);
    if (!result.ok) {
      setPay({ status: 'error', message: result.error ?? 'Dat is niet gelukt. Mail ons gerust.' });
      return;
    }
    setPay({ status: 'done' });
  };

  return (
    <main id="main-content" className="min-h-screen bg-stone-100 text-stone-900 px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <button
          type="button"
          onClick={onGoHome}
          className="self-start flex items-center gap-2 min-h-11 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
          aria-label="Klusbaas homepage"
        >
          <Logo label={null} className="h-7" />
        </button>

        {state.status === 'loading' && (
          <p className="text-stone-500 m-0" aria-live="polite">
            Offerte {id} laden…
          </p>
        )}

        {state.status === 'error' && (
          <div role="alert" className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-3">
            <h1 className="text-2xl font-black m-0">Offerte niet beschikbaar</h1>
            <p className="m-0 text-stone-600">{state.message}</p>
            <p className="m-0 text-sm text-stone-500">
              Gebruik de link uit je offertemail, of vraag ons om een nieuwe link.
            </p>
          </div>
        )}

        {state.status === 'ready' && (
          <article className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <header className="p-6 sm:p-8 border-b-2 border-stone-900 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">Offerte</span>
                <h1 className="text-3xl font-black tracking-tight m-0">{state.quote.id}</h1>
                <p className="m-0 mt-1 text-sm text-stone-600">
                  {formatDutchDate(state.quote.createdAt)} · geldig tot {formatDutchDate(state.quote.validUntil)}
                </p>
                {state.quote.expired && state.quote.status === 'open' && (
                  <p className="m-0 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Deze offerte is verlopen. De prijs is geen belofte meer. Neig contact op
                    met Klusbaas voor een actuele offerte.
                  </p>
                )}
              </div>
              <a
                href={`/api/quote?${query}&format=pdf`}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm inline-flex items-center gap-2 no-underline"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download PDF
              </a>
            </header>

            <div className="p-6 sm:p-8 grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 m-0 mb-2">Voor</h2>
                <p className="m-0 font-bold">{state.quote.customer.biz}</p>
                <p className="m-0 text-stone-600">t.a.v. {state.quote.customer.owner}</p>
                <p className="m-0 text-stone-600">{state.quote.customer.city}</p>
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 m-0 mb-2">Website</h2>
                <p className="m-0">
                  {state.quote.sectorName} · stijl {state.quote.styleName}
                </p>
                {state.quote.services.length > 0 && (
                  <p className="m-0 text-stone-600">{state.quote.services.join(', ')}</p>
                )}
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">Offerteregels</caption>
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th scope="col" className="px-6 sm:px-8 py-2.5 font-bold">Omschrijving</th>
                  <th scope="col" className="px-6 sm:px-8 py-2.5 font-bold text-right">Bedrag excl. btw</th>
                </tr>
              </thead>
              <tbody>
                {state.quote.lines.map((line) => (
                  <tr key={line.id} className="border-b border-stone-100">
                    <td className={`px-6 sm:px-8 py-2.5 ${line.kind === 'plan' ? 'font-bold' : ''}`}>{line.label}</td>
                    <td className="px-6 sm:px-8 py-2.5 text-right tabular-nums font-semibold">
                      {line.included ? (
                        <span className="text-emerald-700 text-xs font-bold">inbegrepen</span>
                      ) : (
                        formatEuroCents(line.amountCents)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="m-0 p-6 sm:p-8 flex flex-col gap-1 text-sm tabular-nums sm:ml-auto sm:w-80">
              <div className="flex justify-between text-stone-600">
                <dt>Subtotaal exclusief btw</dt>
                <dd className="m-0 font-semibold">{formatEuroCents(state.quote.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between text-stone-600">
                <dt>Btw 21%</dt>
                <dd className="m-0 font-semibold">{formatEuroCents(state.quote.vatCents)}</dd>
              </div>
              <div className="flex justify-between text-lg font-black pt-2 mt-1 border-t-2 border-stone-900">
                <dt>Totaal</dt>
                <dd className="m-0">{formatEuroCents(state.quote.totalCents)}</dd>
              </div>
            </dl>

            {state.quote.delivery && state.quote.delivery.length > 0 && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="m-0 text-sm font-black text-stone-900">Wat wij voor je site doen</h2>
                <p className="m-0 mt-2 mb-3 text-sm text-stone-700">
                  Dit hoort bij je pakket. Zodra iets klaar is, staat het in je account.
                </p>
                <DeliveryList items={state.quote.delivery} deadline={deliveryDeadline(state.quote)} />
              </section>
            )}

            {state.quote.status === 'open' && !state.quote.expired && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="m-0 text-sm font-black text-stone-900">Ja, ik wil deze website</h2>
                <p className="m-0 mt-2 text-sm text-stone-700">
                  Vul je naam in en klik op de knop. Klusbaas weet dan dat je akkoord gaat en
                  neemt contact met je op. Je krijgt een bevestiging per mail met het bedrag en
                  de betaalgegevens. Daarna maak je het bedrag over.
                </p>
                {accept.status === 'done' ? (
                  <p className="m-0 mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    Bedankt, we hebben je akkoord ontvangen. Je krijgt een bevestiging per mail;
                    daarin staat het bedrag en hoe je het betaalt.
                  </p>
                ) : (
                  <form onSubmit={sendAccept} className="m-0 mt-3 flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-stone-900 mb-1.5" htmlFor="accept-name">
                        Je naam
                      </label>
                      <input
                        id="accept-name"
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Jan Jansen"
                        className="w-full h-12 px-4 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={accept.status === 'sending'}
                      className="h-12 px-6 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
                    >
                      {accept.status === 'sending' && (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      )}
                      Ja, ik ga akkoord
                    </button>
                  </form>
                )}
                {accept.status === 'error' && (
                  <p
                    role="alert"
                    className="m-0 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
                  >
                    <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    {accept.message}
                  </p>
                )}
              </section>
            )}

            {state.quote.status === 'paid' && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <h2 className="m-0 text-sm font-black text-emerald-900">Je factuur</h2>
                <p className="m-0 mt-2 text-sm text-emerald-900">
                  Je betaling is binnen. De factuur staat als PDF in de mail die je kreeg;
                  je kunt hem hieronder ook nog een keer downloaden.
                </p>
                <a
                  href={`/api/quote?${query}&format=invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-900 hover:bg-emerald-800 px-5 text-white font-extrabold text-sm no-underline"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download factuur
                </a>
              </section>
            )}

            {state.quote.status === 'accepted' && (
              <p className="m-0 mx-6 sm:mx-8 mb-6 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                Je hebt deze offerte geaccepteerd. Je bevestiging staat in je mail; maak
                daarna het bedrag over.
              </p>
            )}

            {state.quote.status === 'accepted' && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="m-0 text-sm font-black text-stone-900">Heb je het bedrag overgemaakt?</h2>
                <p className="m-0 mt-2 text-sm text-stone-700">
                  Laat het weten, dan kijkt Klusbaas naar zijn bankrekening. Je offerte
                  wordt pas als betaald gemarkeerd als het geld er echt is.
                </p>
                {pay.status === 'done' ? (
                  <p className="m-0 mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    Bedankt, we hebben je melding ontvangen. Klusbaas controleert het bedrag.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendPaymentReport}
                    disabled={pay.status === 'sending'}
                    className="mt-3 h-12 px-6 rounded-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2"
                  >
                    {pay.status === 'sending' && (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    )}
                    Ja, ik heb het bedrag overgemaakt
                  </button>
                )}
                {pay.status === 'error' && (
                  <p
                    role="alert"
                    className="m-0 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
                  >
                    <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    {pay.message}
                  </p>
                )}
              </section>
            )}

            {state.quote.status === 'open' && state.quote.expired && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl bg-stone-50 border border-stone-200 p-5">
                <h2 className="m-0 text-sm font-black text-stone-900">Wil je toch verder?</h2>
                <p className="m-0 mt-2 text-sm text-stone-700">
                  Antwoord op de mail waarin deze offerte staat, of mail ons. We maken
                  je een nieuwe offerte met de prijs van vandaag.
                </p>
              </section>
            )}

            {(state.quote.status === 'open' || state.quote.status === 'accepted') &&
              !state.quote.expired &&
              state.quote.payment && (
              <section className="mx-6 sm:mx-8 mb-6 rounded-2xl bg-stone-50 border border-stone-200 p-5">
                <h2 className="m-0 text-sm font-black text-stone-900">Zo betaal je</h2>
                <p className="m-0 mt-2 text-sm text-stone-700">
                  Maak het bedrag over naar{' '}
                  <strong className="text-stone-900">{state.quote.payment.iban}</strong> t.n.v.{' '}
                  {state.quote.payment.name}, met als omschrijving{' '}
                  <strong className="text-stone-900">{state.quote.id}</strong>.
                </p>
                <p className="m-0 mt-2 text-xs text-stone-600">
                  {state.quote.payment.email ? (
                    <>
                      Vragen?{' '}
                      <a
                        href={`mailto:${state.quote.payment.email}`}
                        className="font-bold underline underline-offset-2"
                      >
                        {state.quote.payment.email}
                      </a>
                    </>
                  ) : (
                    'Vragen? Antwoord op de offertemail.'
                  )}
                </p>
              </section>
            )}

            <footer className="px-6 sm:px-8 pb-8 text-xs text-stone-500 flex items-start gap-2">
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              {state.quote.status === 'paid' ? (
                <span className="font-bold text-emerald-700">
                  Deze offerte is betaald
                  {state.quote.paidAt ? ` op ${formatDutchDate(state.quote.paidAt)}` : ''}. Bedankt!
                </span>
              ) : state.quote.status === 'accepted' ? (
                <span className="font-bold text-emerald-700">
                  Je hebt deze offerte geaccepteerd. Maak het bedrag over; zodra het binnen is,
                  staat hier dat de offerte betaald is.
                </span>
              ) : state.quote.status === 'cancelled' ? (
                <span className="font-bold text-stone-600">
                  Deze offerte is ingetrokken. Neig contact op als je verder wilt.
                </span>
              ) : (
                <>
                  Eenmalige prijs voor ontwerp en bouw; hosting en service spreken we apart af. Akkoord?
                  Antwoord op de offertemail of stuur ons een WhatsApp.
                </>
              )}
            </footer>
          </article>
        )}
      </div>
    </main>
  );
};
