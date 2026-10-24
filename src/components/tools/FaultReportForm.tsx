import React, { useId, useState } from 'react';
import { PlugZap, MessageCircle, CheckCircle2, Send } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import {
  buildSiteTelUrl,
  buildSiteWhatsAppUrl,
  buildFaultReportMessage,
  normalizeDutchPhone,
  type FaultReportInput,
} from '../../utils/contact';
import { describeDelivery } from '../../utils/leadClient';
import { useLeadForm } from '../../hooks/useLeadForm';
import { HoneypotField, LeadErrorNotice } from '../LeadStatus';
import { PrivacyNote } from '../PrivacyNote';

const FAULT_TYPES = [
  'Geen stroom / spanning weg',
  'Aardlekschakelaar schiet eruit',
  'Kortsluiting',
  'Laadpaal storing',
  'Zonnepanelen vallen uit',
  'Anders',
];

const SINCE_OPTIONS = ['Net gebeurd', 'Vanochtend', 'Vandaag', 'Al meerdere dagen'];

const URGENCY_OPTIONS = [
  'Nu — acuut onveilig',
  'Vandaag nog (spoed)',
  'Planbaar, geen haast',
];

interface FaultReportFormProps {
  site: ActiveSiteData;
}

/**
 * Elektricien: storingsmelding. The structured form composes a clear
 * WhatsApp message so the electrician receives every detail in one tap.
 */
export const FaultReportForm: React.FC<FaultReportFormProps> = ({ site }) => {
  const id = useId();
  const [form, setForm] = useState<FaultReportInput>({
    name: '',
    phone: '',
    address: '',
    faultType: FAULT_TYPES[0],
    since: SINCE_OPTIONS[0],
    urgency: URGENCY_OPTIONS[0],
    details: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lead = useLeadForm('fault-report');

  const update = (field: keyof FaultReportInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(form.phone)) {
      errs.phone = 'Gebruik een geldig nummer, bijv. 06 12345678 of +31 6 12345678';
    }
    if (!form.address.trim()) errs.address = 'Vul het adres van de storing in';
    setErrors(errs);
    const firstInvalid = (['name', 'phone', 'address'] as const).find((field) => errs[field]);
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const fallbackWaUrl = buildSiteWhatsAppUrl(site.contactPhone, buildFaultReportMessage(site.biz, form));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || lead.status === 'sending') return;
    const response = await lead.submit({
      type: 'fault',
      site: { biz: site.biz, sector: site.id, style: site.styleName },
      fields: { ...form },
    });
    if (response.ok) setWaUrl(fallbackWaUrl);
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 px-4 rounded-xl border-2 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
      hasError ? 'border-rose-500' : 'border-stone-500'
    }`;

  return (
    <section
      id="storing"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-5 flex flex-col gap-5">
          <span className="font-mono text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-stone-500">
            <PlugZap className="w-4 h-4" />
            Storingsmelding
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Storing? Meld hem in 1 minuut.
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed m-0">
            Vul het formulier in en je melding wordt met alle details via
            WhatsApp naar {site.owner.split(' ')[0]} verstuurd. Bij acuut
            onveilige situaties: bel direct{' '}
            <a
              href={buildSiteTelUrl(site.contactPhone)}
              className="inline-flex items-center min-h-11 font-bold text-stone-900 underline"
            >
              {site.phone}
            </a>
            .
          </p>
          <div className="flex flex-col gap-2 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Reactie binnen 1 uur tijdens kantooruren
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              NEN 1010 / NEN 3140 gecertificeerde monteurs
            </span>
          </div>

          {!mobileOpen && !waUrl && (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="sm:hidden self-start min-h-12 px-6 font-extrabold text-sm cursor-pointer inline-flex items-center gap-2 shadow-sm"
              style={{
                background: site.accent,
                color: site.onAccent,
                borderRadius: site.radius,
                border: 0,
              }}
            >
              Open storingsmelder →
            </button>
          )}
        </div>

        <div
          className={`${
            mobileOpen || waUrl ? 'block' : 'hidden sm:block'
          } lg:col-span-7 border p-6 sm:p-8 shadow-lg`}
          style={{
            background: site.card,
            borderColor: site.line,
            borderRadius: site.radiusLg,
          }}
        >
          {waUrl ? (
            <div className="flex flex-col items-center text-center gap-5 py-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg pulse-glow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-stone-900 m-0">
                Je melding is verstuurd.
              </h3>
              <p className="text-stone-600 text-sm max-w-md m-0" aria-live="polite">
                {site.owner.split(' ')[0]} heeft je storingsmelding ontvangen
                {lead.result?.reference ? ` (referentie ${lead.result.reference})` : ''} en
                neemt zo snel mogelijk contact met je op.{' '}
                {lead.result ? describeDelivery(lead.result) : ''}
              </p>
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="h-14 px-8 rounded-full bg-[#25D366] hover:brightness-95 text-stone-950 font-extrabold text-base flex items-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" aria-hidden="true" />
                Ook via WhatsApp sturen
              </a>
              <button
                type="button"
                onClick={() => {
                  setWaUrl(null);
                  lead.reset();
                }}
                className="text-xs font-bold text-stone-500 underline bg-transparent border-0 cursor-pointer"
              >
                Nog een melding doen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex flex-col gap-4" noValidate>
              <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${id}-name`} className="block text-xs font-bold text-stone-700 mb-1">
                    Je naam *
                  </label>
                  <input
                    id={`${id}-name`}
                    type="text"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${id}-name-error` : undefined}
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="bijv. Erik Jansen"
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <span
                      id={`${id}-name-error`}
                      role="alert"
                      className="text-xs text-rose-600 font-bold block mt-1"
                    >
                      {errors.name}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor={`${id}-phone`} className="block text-xs font-bold text-stone-700 mb-1">
                    Telefoonnummer *
                  </label>
                  <input
                    id={`${id}-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? `${id}-phone-error` : undefined}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    className={inputClass(errors.phone)}
                  />
                  {errors.phone && (
                    <span
                      id={`${id}-phone-error`}
                      role="alert"
                      className="text-xs text-rose-600 font-bold block mt-1"
                    >
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor={`${id}-address`} className="block text-xs font-bold text-stone-700 mb-1">
                  Adres van de storing *
                </label>
                <input
                  id={`${id}-address`}
                  type="text"
                  autoComplete="street-address"
                  aria-required="true"
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? `${id}-address-error` : undefined}
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Straat, huisnummer en plaats"
                  className={inputClass(errors.address)}
                />
                {errors.address && (
                  <span
                    id={`${id}-address-error`}
                    role="alert"
                    className="text-xs text-rose-600 font-bold block mt-1"
                  >
                    {errors.address}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`${id}-fault-type`}
                    className="block text-xs font-bold text-stone-700 mb-1"
                  >
                    Wat is er aan de hand?
                  </label>
                  <select
                    id={`${id}-fault-type`}
                    value={form.faultType}
                    onChange={(e) => update('faultType', e.target.value)}
                    className={inputClass()}
                  >
                    {FAULT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`${id}-since`} className="block text-xs font-bold text-stone-700 mb-1">
                    Sinds wanneer?
                  </label>
                  <select
                    id={`${id}-since`}
                    value={form.since}
                    onChange={(e) => update('since', e.target.value)}
                    className={inputClass()}
                  >
                    {SINCE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span id={`${id}-urgency`} className="block text-xs font-bold text-stone-700 mb-1">
                  Urgentie
                </span>
                <div role="group" aria-labelledby={`${id}-urgency`} className="flex flex-wrap gap-2">
                  {URGENCY_OPTIONS.map((u) => {
                    const isSelected = form.urgency === u;
                    return (
                      <button
                        type="button"
                        key={u}
                        aria-pressed={isSelected}
                        onClick={() => update('urgency', u)}
                        className={`h-10 px-4 rounded-full border-2 text-xs sm:text-sm font-bold cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-500 hover:border-stone-700'
                        }`}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor={`${id}-details`} className="block text-xs font-bold text-stone-700 mb-1">
                  Extra informatie (optioneel)
                </label>
                <textarea
                  id={`${id}-details`}
                  value={form.details}
                  onChange={(e) => update('details', e.target.value)}
                  rows={3}
                  placeholder="Bijv. de aardlek springt elke keer als de vaatwasser aangaat."
                  className="w-full p-3 rounded-xl border-2 border-stone-500 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900"
                />
              </div>

              {lead.status === 'error' && (
                <LeadErrorNotice message={lead.result?.error} whatsappUrl={fallbackWaUrl} />
              )}
              <button
                type="submit"
                disabled={lead.status === 'sending'}
                className="h-14 mt-1 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
                {lead.status === 'sending' ? 'Versturen…' : 'Verstuur storingsmelding'}
              </button>
              <PrivacyNote className="text-stone-500 text-center" />
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
