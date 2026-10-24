import React from 'react';
import { Mail, Pencil, X } from 'lucide-react';
import { ADDONS, isAddonIncluded } from '../data/addons';
import { formatEuroCents, type QuoteTotals } from '../utils/quote';
import type { WizardRouteStep } from '../utils/router';

interface QuoteSummaryProps {
  quote: QuoteTotals;
  sectorName: string;
  styleName: string;
  services: string[];
  onEditStep?: (step: WizardRouteStep) => void;
  onRemoveAddon?: (id: string) => void;
  /** Hide edit/remove controls, e.g. on the confirmation screen. */
  readOnly?: boolean;
  /** Footer note; defaults to the wizard's "we mailen dit" line. */
  note?: React.ReactNode;
  className?: string;
}

/**
 * "Jouw offerte": everything the visitor picked with a live total. The same
 * numbers (`utils/quote.ts`) end up in the stored quote, the PDF and the mail.
 */
export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  quote,
  sectorName,
  styleName,
  services,
  onEditStep,
  onRemoveAddon,
  readOnly = false,
  note,
  className = '',
}) => {
  const includedInPlan = ADDONS.filter((addon) => isAddonIncluded(addon, quote.planId));
  const planLine = quote.lines.find((line) => line.kind === 'plan');
  const addonLines = quote.lines.filter((line) => line.kind === 'addon');

  const EditButton = ({ step, label }: { step: WizardRouteStep; label: string }) =>
    readOnly || !onEditStep ? null : (
      <button
        type="button"
        onClick={() => onEditStep(step)}
        aria-label={`${label} wijzigen`}
        className="w-11 h-11 -my-2 -mr-3 rounded-full bg-transparent border-0 text-stone-400 hover:text-stone-900 hover:bg-stone-100 cursor-pointer inline-flex items-center justify-center shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    );

  return (
    <section
      aria-label="Jouw offerte"
      className={`bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col min-h-0 ${className}`}
    >
      <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-black tracking-tight m-0">Jouw offerte</h2>
        {!readOnly && (
          <span className="font-mono text-xs font-bold text-stone-500 uppercase tracking-wider">live</span>
        )}
      </div>

      <div className="px-5">
        <dl className="m-0 text-sm divide-y divide-stone-100">
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-stone-500">Vak</dt>
            <dd className="m-0 flex items-center gap-1 font-bold text-right">
              {sectorName}
              <EditButton step="vak" label="Vak" />
            </dd>
          </div>
          <div className="py-2.5 flex items-center justify-between gap-3">
            <dt className="text-stone-500">Stijl</dt>
            <dd className="m-0 flex items-center gap-1 font-bold text-right">
              {styleName}
              <EditButton step="stijl" label="Stijl" />
            </dd>
          </div>
          <div className="py-2.5 flex items-start justify-between gap-3">
            <dt className="text-stone-500 pt-0.5">Diensten</dt>
            <dd className="m-0 flex items-start gap-1 text-right">
              <span className="font-bold">
                {services.length} {services.length === 1 ? 'dienst' : 'diensten'}
                <span className="block text-xs font-medium text-stone-500 leading-snug">
                  {services.slice(0, 3).join(', ')}
                  {services.length > 3 ? ` +${services.length - 3}` : ''}
                </span>
              </span>
              <EditButton step="diensten" label="Diensten" />
            </dd>
          </div>
        </dl>

        <div className="mt-2 pt-3 border-t-2 border-stone-900">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-extrabold">Pakket {quote.planName}</span>
            <span className="font-extrabold tabular-nums">
              {planLine ? formatEuroCents(planLine.amountCents) : ''}
            </span>
          </div>
          {includedInPlan.length > 0 && (
            <p className="text-xs text-stone-500 m-0 mt-1 leading-snug">
              Inclusief {includedInPlan.map((addon) => addon.label.toLowerCase()).join(', ')}
            </p>
          )}

          <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-1.5">
            {addonLines.length === 0 && (
              <li className="text-xs text-stone-500">Nog geen extra componenten gekozen.</li>
            )}
            {addonLines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2 text-sm animate-fade-in">
                <span className="min-w-0 truncate">+ {line.label}</span>
                <span className="flex items-center gap-1 shrink-0 tabular-nums font-semibold">
                  {line.included ? (
                    <span className="text-xs font-bold text-emerald-700">inbegrepen</span>
                  ) : (
                    formatEuroCents(line.amountCents)
                  )}
                  {!readOnly && onRemoveAddon && (
                    <button
                      type="button"
                      onClick={() => onRemoveAddon(line.id)}
                      aria-label={`${line.label} verwijderen`}
                      className="w-11 h-11 -my-3 -mr-3 rounded-full bg-transparent border-0 text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer inline-flex items-center justify-center"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-5 pt-3 pb-5 mt-3 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
        <dl className="m-0 text-sm flex flex-col gap-1 tabular-nums">
          <div className="flex justify-between text-stone-600">
            <dt>Subtotaal exclusief btw</dt>
            <dd className="m-0 font-semibold">{formatEuroCents(quote.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between text-stone-600">
            <dt>Btw 21%</dt>
            <dd className="m-0 font-semibold">{formatEuroCents(quote.vatCents)}</dd>
          </div>
          <div className="flex justify-between text-lg font-black pt-1">
            <dt>Totaal</dt>
            <dd className="m-0">{formatEuroCents(quote.totalCents)}</dd>
          </div>
        </dl>
        <p className="text-xs text-stone-500 m-0 mt-2 flex items-start gap-1.5 leading-snug">
          <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          {note ?? 'Eenmalige prijs, 30 dagen geldig. Je site en code zijn van jou.'}
        </p>
      </div>
    </section>
  );
};
