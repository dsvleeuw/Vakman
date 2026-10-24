import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { formatDutchDate, formatEuroCents, type QuoteDocument } from '../utils/quote';

interface QuoteViewProps {
  quoteId: string;
  token?: string;
  onGoHome: () => void;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; quote: QuoteDocument };

/**
 * /offerte/:id?token=… — the saved quote as mailed, with the PDF one click
 * away. Data loads after mount (the token never reaches the prerenderer).
 */
export const QuoteView: React.FC<QuoteViewProps> = ({ quoteId, token, onGoHome }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const query = `?token=${encodeURIComponent(token ?? '')}`;
  const apiPath = `/api/offerte/${encodeURIComponent(quoteId)}`;

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Deze link is niet compleet: de toegangscode ontbreekt.' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    fetch(`${apiPath}${query}`)
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { ok?: boolean; quote?: QuoteDocument; error?: string } | null;
        if (cancelled) return;
        if (response.ok && body?.ok && body.quote) setState({ status: 'ready', quote: body.quote });
        else setState({ status: 'error', message: body?.error || 'Deze offerte kon niet worden geladen.' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'Geen verbinding met de server. Probeer het later opnieuw.' });
      });
    return () => {
      cancelled = true;
    };
  }, [apiPath, query, token]);

  return (
    <div id="main-content" className="min-h-screen bg-stone-100 text-stone-900 px-4 py-8 sm:py-14">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <button
          type="button"
          onClick={onGoHome}
          className="self-start flex items-center gap-2 min-h-11 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
        >
          <span className="w-8 h-8 rounded-xl bg-stone-900 text-amber-300 flex items-center justify-center font-black">K</span>
          <span className="text-lg font-extrabold tracking-tight">Klusbaas</span>
        </button>

        {state.status === 'loading' && (
          <div role="status" aria-live="polite" className="bg-white rounded-3xl border border-stone-200 p-10 flex items-center justify-center gap-3">
            <span className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-stone-900 animate-spin" />
            <span className="text-sm font-bold">Offerte laden…</span>
          </div>
        )}

        {state.status === 'error' && (
          <div role="alert" className="bg-white rounded-3xl border border-stone-200 p-8 flex flex-col gap-4">
            <h1 className="text-2xl font-black m-0">Offerte niet gevonden</h1>
            <p className="text-stone-600 m-0">{state.message}</p>
            <p className="text-stone-600 text-sm m-0">
              Gebruik de link uit je bevestigingsmail, of antwoord op die mail als je hem kwijt bent.
            </p>
          </div>
        )}

        {state.status === 'ready' && (
          <article className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <header className="p-6 sm:p-8 border-b border-stone-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">Offerte</span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight m-0">{state.quote.number}</h1>
                <p className="text-sm text-stone-600 m-0 mt-1">
                  Voor <strong>{state.quote.customer.biz}</strong> · {state.quote.customer.owner}, {state.quote.customer.city}
                </p>
              </div>
              <dl className="m-0 text-sm grid grid-cols-[auto_auto] gap-x-4 gap-y-1 sm:text-right">
                <dt className="text-stone-500">Datum</dt>
                <dd className="m-0 font-bold">{formatDutchDate(state.quote.issuedAt)}</dd>
                <dt className="text-stone-500">Geldig tot</dt>
                <dd className="m-0 font-bold">{formatDutchDate(state.quote.validUntil)}</dd>
                <dt className="text-stone-500">Vak · stijl</dt>
                <dd className="m-0 font-bold">
                  {state.quote.sectorName} · {state.quote.styleName}
                </dd>
              </dl>
            </header>

            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-stone-500 border-b-2 border-stone-900">
                    <th className="text-left font-bold pb-2">Omschrijving</th>
                    <th className="text-right font-bold pb-2">Excl. btw</th>
                  </tr>
                </thead>
                <tbody>
                  {state.quote.lines.map((line) => (
                    <tr key={line.label} className="border-b border-stone-100 align-top">
                      <td className="py-3 pr-4">
                        <span className="font-bold block">{line.label}</span>
                        {line.note && <span className="text-xs text-stone-500">{line.note}</span>}
                      </td>
                      <td className="py-3 text-right tabular-nums font-bold whitespace-nowrap">
                        {line.included ? <span className="text-xs text-emerald-700">inbegrepen</span> : formatEuroCents(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <dl className="m-0 text-sm flex flex-col gap-1 tabular-nums sm:ml-auto sm:w-72">
                <div className="flex justify-between text-stone-600">
                  <dt>Subtotaal excl. btw</dt>
                  <dd className="m-0 font-semibold">{formatEuroCents(state.quote.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>Btw {Math.round(state.quote.vatRate * 100)}%</dt>
                  <dd className="m-0 font-semibold">{formatEuroCents(state.quote.vat)}</dd>
                </div>
                <div className="flex justify-between text-lg font-black pt-2 mt-1 border-t-2 border-stone-900">
                  <dt>Totaal incl. btw</dt>
                  <dd className="m-0">{formatEuroCents(state.quote.total)}</dd>
                </div>
              </dl>

              {state.quote.services.length > 0 && (
                <p className="text-xs text-stone-500 m-0">
                  <strong className="text-stone-700">Diensten op je website:</strong> {state.quote.services.join(', ')}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`${apiPath}${query}&format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-14 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base inline-flex items-center justify-center gap-2 no-underline"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                  Download als PDF
                </a>
                <button
                  type="button"
                  onClick={onGoHome}
                  className="h-14 px-6 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Terug naar Klusbaas
                </button>
              </div>
              <p className="text-xs text-stone-500 m-0">
                Alle bedragen zijn eenmalig. Vragen of iets aanpassen? Antwoord op je bevestigingsmail.
              </p>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};
