import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Logo } from './Logo';
import { formatDutchDate, formatEuroCents, type PublicQuote } from '../utils/quote';

interface QuoteViewProps {
  id: string;
  token: string;
  onGoHome: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; quote: PublicQuote }
  | { status: 'error'; message: string };

/**
 * `/offerte/:id?token=…`: the stored quote as a page, loaded from
 * `GET /api/quote`. The token comes from the e-mail; without it the API
 * answers 403/404 and we show why.
 */
export const QuoteView: React.FC<QuoteViewProps> = ({ id, token, onGoHome }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
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

            <footer className="px-6 sm:px-8 pb-8 text-xs text-stone-500 flex items-start gap-2">
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              {state.quote.status === 'paid' ? (
                <span className="font-bold text-emerald-700">
                  Deze offerte is betaald
                  {state.quote.paidAt ? ` op ${formatDutchDate(state.quote.paidAt)}` : ''}. Bedankt!
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
