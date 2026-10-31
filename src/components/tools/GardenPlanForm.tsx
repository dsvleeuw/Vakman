import React, { useId, useMemo, useState } from 'react';
import { Leaf, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import {
  buildSiteTelUrl,
  buildSiteWhatsAppUrl,
  buildGardenPlanMessage,
  canShowContactButtons,
  normalizeDutchPhone,
  type GardenPlanInput,
} from '../../utils/contact';
import { describeDelivery } from '../../utils/leadClient';
import { siteContext } from '../../utils/lead';
import { leadRecipient } from '../../utils/leadCopy';
import { useLeadForm } from '../../hooks/useLeadForm';
import { HoneypotField, LeadErrorNotice } from '../LeadStatus';
import { PrivacyNote } from '../PrivacyNote';
import { parsePricePerM2 } from '../../utils/surface';
import { formatGardenEstimate, gardenEstimate, parseGardenSize } from '../../utils/garden';

const MOMENTS = [
  'Zo snel mogelijk',
  'Binnen een maand',
  'In het voorjaar',
  'In het najaar',
  'Geen haast — op mijn planning',
];

interface GardenPlanFormProps {
  site: ActiveSiteData;
}

/**
 * Hovenier: tuinplan. De bezoeker geeft de grootte van de tuin en het werk
 * dat hij wil laten doen. Waar de hovenier een prijs per m² heeft, staat er
 * meteen een indicatie; voor de rest zegt de pagina dat de prijs op aanvraag
 * is.
 */
export const GardenPlanForm: React.FC<GardenPlanFormProps> = ({ site }) => {
  const id = useId();

  // De diensten van de hovenier, met zijn eigen prijs per m² waar hij die heeft.
  const services = useMemo(
    () =>
      site.services.map((service) => ({
        name: service.n,
        pricePerM2: parsePricePerM2(service.p) ?? undefined,
      })),
    [site.services]
  );

  const [form, setForm] = useState<GardenPlanInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    service: services[0]?.name ?? 'Tuinonderhoud',
    gardenSize: '',
    moment: MOMENTS[1],
    details: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waUrl, setWaUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lead = useLeadForm('garden-plan');

  const selected = services.find((service) => service.name === form.service);
  const sizeM2 = parseGardenSize(form.gardenSize);
  const estimate = gardenEstimate(sizeM2, selected ?? { name: form.service });

  const update = (field: keyof GardenPlanInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(form.phone)) {
      errs.phone = 'Gebruik een geldig nummer, bijv. 06 12345678 of +31 6 12345678';
    }
    if (!form.address.trim()) errs.address = 'Vul het adres van de tuin in';
    if (!form.gardenSize.trim() || sizeM2 <= 0) errs.gardenSize = 'Vul de grootte van de tuin in (in m²)';
    setErrors(errs);
    const firstInvalid = (['name', 'phone', 'address', 'gardenSize'] as const).find(
      (field) => errs[field]
    );
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const fallbackWaUrl = buildSiteWhatsAppUrl(site.contactPhone, buildGardenPlanMessage(site.biz, form));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || lead.status === 'sending') return;
    const response = await lead.submit({
      type: 'garden-plan',
      site: siteContext(site),
      fields: { ...form, gardenSize: String(sizeM2) },
    });
    if (response.ok) setWaUrl(fallbackWaUrl);
  };

  const inputClass = (hasError?: string) =>
    `w-full h-12 px-4 rounded-xl border-2 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
      hasError ? 'border-rose-500' : 'border-stone-500'
    }`;

  return (
    <section
      id="tuinplan"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-5 flex flex-col gap-5">
          <span className="font-mono text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-stone-500">
            <Leaf className="w-4 h-4" />
            Tuinplan op maat
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Wat ga je met je tuin doen?
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed m-0">
            Vul de grootte van je tuin in en kies het werk. Je krijgt meteen een
            indicatie en {site.owner.split(' ')[0]} komt langs om de tuin te
            bekijken. De prijsindicatie is een richtlijn: de definitieve prijs
            hangt af van de staat van de tuin.
            {canShowContactButtons(site) && (
              <>
                {' '}
                Liever direct overleggen? Bel{' '}
                <a
                  href={buildSiteTelUrl(site.contactPhone)}
                  className="inline-flex items-center min-h-11 font-bold text-stone-900 underline"
                >
                  {site.phone}
                </a>
                .
              </>
            )}
          </p>
          <div className="flex flex-col gap-2 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Opdracht of onderhoud, in één formulier
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Indicatie meteen, definitieve prijs na de kennismaking
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
              Open tuinplan →
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
                Je tuinplan is aangevraagd.
              </h3>
              <p className="text-stone-600 text-sm max-w-md m-0" aria-live="polite">
                {leadRecipient(site).name} heeft je aanvraag ontvangen
                {lead.result?.reference ? ` (referentie ${lead.result.reference})` : ''} en komt langs
                om de tuin te bekijken.{' '}
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
                Nog een tuinplan aanvragen
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex flex-col gap-4" noValidate>
              <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />

              <div>
                <label htmlFor={`${id}-service`} className="block text-xs font-bold text-stone-700 mb-1">
                  Wat wil je laten doen?
                </label>
                <select
                  id={`${id}-service`}
                  value={form.service}
                  onChange={(e) => update('service', e.target.value)}
                  className={inputClass()}
                >
                  {services.map((service) => (
                    <option key={service.name} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${id}-garden-size`} className="block text-xs font-bold text-stone-700 mb-1">
                    Grootte van de tuin (m²) *
                  </label>
                  <input
                    id={`${id}-garden-size`}
                    type="text"
                    inputMode="decimal"
                    aria-required="true"
                    aria-invalid={Boolean(errors.gardenSize)}
                    aria-describedby={errors.gardenSize ? `${id}-garden-size-error` : undefined}
                    value={form.gardenSize}
                    onChange={(e) => update('gardenSize', e.target.value)}
                    placeholder="bijv. 120"
                    className={inputClass(errors.gardenSize)}
                  />
                  {errors.gardenSize && (
                    <span
                      id={`${id}-garden-size-error`}
                      role="alert"
                      className="text-xs text-rose-600 font-bold block mt-1"
                    >
                      {errors.gardenSize}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor={`${id}-moment`} className="block text-xs font-bold text-stone-700 mb-1">
                    Wanneer wil je het gedaan hebben?
                  </label>
                  <select
                    id={`${id}-moment`}
                    value={form.moment}
                    onChange={(e) => update('moment', e.target.value)}
                    className={inputClass()}
                  >
                    {MOMENTS.map((moment) => (
                      <option key={moment} value={moment}>
                        {moment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {estimate !== null ? (
                <p
                  className="m-0 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-bold text-emerald-900"
                  aria-live="polite"
                >
                  Indicatie: {formatGardenEstimate(estimate)} voor {form.service.toLowerCase()}. De
                  definitieve prijs hangt af van de staat van de tuin.
                </p>
              ) : (
                <p className="m-0 rounded-xl bg-stone-100 border border-stone-200 px-4 py-3 text-sm text-stone-700">
                  Voor {form.service.toLowerCase()} maakt {site.owner.split(' ')[0]} de prijs na een
                  kijkje in de tuin. Dat is eerlijker dan een bedrad dat uit de lucht komt.
                </p>
              )}

              <div>
                <label htmlFor={`${id}-address`} className="block text-xs font-bold text-stone-700 mb-1">
                  Adres van de tuin *
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
                <label htmlFor={`${id}-details`} className="block text-xs font-bold text-stone-700 mb-1">
                  Extra informatie (optioneel)
                </label>
                <textarea
                  id={`${id}-details`}
                  value={form.details}
                  onChange={(e) => update('details', e.target.value)}
                  rows={3}
                  placeholder="Bijv. de achtertuin is grotendeels gras en er staat een oude boom."
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
                {lead.status === 'sending' ? 'Versturen…' : 'Vraag een tuinplan'}
              </button>
              <PrivacyNote
                className="text-stone-500 text-center"
                note={leadRecipient(site).privacy}
              />
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
