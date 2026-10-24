import React, { useMemo, useState } from 'react';
import { Ruler, Plus, Trash2, MessageCircle, PaintRoller, Send, CheckCircle2 } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import {
  parsePricePerM2,
  calculateSurfaceArea,
  calculateM2Estimate,
} from '../../utils/surface';
import {
  buildSiteWhatsAppUrl,
  buildSurfaceQuoteMessage,
  normalizeDutchPhone,
} from '../../utils/contact';
import { describeDelivery } from '../../utils/leadClient';
import { useLeadForm } from '../../hooks/useLeadForm';
import { HoneypotField, LeadErrorNotice } from '../LeadStatus';
import { formatPrice } from '../../utils/pricing';
import { PrivacyNote } from '../PrivacyNote';

interface SurfaceCalculatorProps {
  site: ActiveSiteData;
}

interface WallRow {
  length: string;
  height: string;
}

/**
 * Schilder: m²-calculator. Visitors measure their walls, pick a per-m²
 * service and immediately get a price indication they can send via
 * WhatsApp as a quote request.
 */
export const SurfaceCalculator: React.FC<SurfaceCalculatorProps> = ({ site }) => {
  const m2Services = useMemo(
    () =>
      site.services
        .map((sv) => ({ name: sv.n, price: parsePricePerM2(sv.p) }))
        .filter((sv): sv is { name: string; price: number } => sv.price !== null),
    [site.services]
  );

  const fallbackService = { name: 'Schilwerk', price: 18 };
  const services = m2Services.length > 0 ? m2Services : [fallbackService];

  const [serviceName, setServiceName] = useState(services[0].name);
  const [walls, setWalls] = useState<WallRow[]>([
    { length: '5', height: '2,6' },
  ]);
  const [openings, setOpenings] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const lead = useLeadForm('surface-calculator');
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedService =
    services.find((sv) => sv.name === serviceName) ?? services[0];

  const parsedWalls = walls.map((w) => ({
    length: parseFloat(w.length.replace(',', '.')) || 0,
    height: parseFloat(w.height.replace(',', '.')) || 0,
  }));

  const surfaceM2 = calculateSurfaceArea(parsedWalls, openings);
  const totalPrice = calculateM2Estimate(surfaceM2, selectedService.price);

  const updateWall = (idx: number, field: keyof WallRow, value: string) => {
    setWalls((prev) =>
      prev.map((w, i) => (i === idx ? { ...w, [field]: value } : w))
    );
  };

  const addWall = () =>
    setWalls((prev) => [...prev, { length: '', height: '' }]);

  const removeWall = (idx: number) =>
    setWalls((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const waUrl = buildSiteWhatsAppUrl(
    site.contactPhone,
    buildSurfaceQuoteMessage(site.biz, {
      serviceName: selectedService.name,
      pricePerM2: selectedService.price,
      surfaceM2: Math.round(surfaceM2 * 10) / 10,
      totalPrice,
      wallCount: walls.length,
      openings,
      name: name || undefined,
    })
  );

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lead.status === 'sending') return;
    if (!normalizeDutchPhone(phone)) {
      setPhoneError('Vul je telefoonnummer in, bijv. 06 12345678');
      document.getElementById('m2-phone')?.focus();
      return;
    }
    if (surfaceM2 <= 0) return;
    await lead.submit({
      type: 'surface',
      site: { biz: site.biz, sector: site.id, style: site.styleName },
      fields: {
        name,
        phone,
        service: selectedService.name,
        surfaceM2: String(Math.round(surfaceM2 * 10) / 10),
        pricePerM2: formatPrice(selectedService.price),
        estimate: formatPrice(totalPrice),
        walls: String(walls.length),
        openings: String(openings),
      },
    });
  };

  const inputClass =
    'w-full h-12 px-4 rounded-xl border-2 border-stone-500 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900';

  return (
    <section
      id="m2-calculator"
      className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <span className="font-mono text-xs font-semibold tracking-wider uppercase flex items-center gap-2 text-stone-500">
            <Ruler className="w-4 h-4" />
            Gratis m²-calculator
          </span>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight m-0"
            style={{
              fontFamily: site.display,
              fontWeight: site.dw,
              letterSpacing: site.ls,
            }}
          >
            Bereken zelf je schilderprijs.
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed m-0">
            Meet de muren die je wilt laten schilderen. De calculator houdt
            rekening met deuren en ramen en geeft direct een realistische
            richtprijs, inclusief btw.
          </p>

          {!mobileOpen && (
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
              Open m²-calculator →
            </button>
          )}

          <div className={`${mobileOpen ? 'flex' : 'hidden sm:flex'} flex-col gap-6`}>
            <div>
              <label className="block text-sm font-bold text-stone-900 mb-2">
                Welk werk zoek je?
              </label>
            <select
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className={inputClass}
            >
              {services.map((sv) => (
                <option key={sv.name} value={sv.name}>
                  {sv.name} — € {sv.price} per m²
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <label className="block text-sm font-bold text-stone-900">
              Afmetingen per wand (in meters)
            </label>
            {walls.map((wall, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={wall.length}
                    onChange={(e) => updateWall(idx, 'length', e.target.value)}
                    placeholder="Lengte, bijv. 5"
                    aria-label={`Lengte wand ${idx + 1}`}
                    className={inputClass}
                  />
                </div>
                <span className="text-stone-400 font-bold">×</span>
                <div className="flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={wall.height}
                    onChange={(e) => updateWall(idx, 'height', e.target.value)}
                    placeholder="Hoogte, bijv. 2,6"
                    aria-label={`Hoogte wand ${idx + 1}`}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWall(idx)}
                  disabled={walls.length === 1}
                  aria-label={`Verwijder wand ${idx + 1}`}
                  className="w-12 h-12 rounded-xl border-2 border-stone-500 bg-white text-stone-500 hover:text-rose-600 hover:border-rose-300 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addWall}
              className="self-start h-11 px-5 rounded-xl border-2 border-dashed border-stone-300 bg-transparent hover:border-stone-500 text-stone-700 font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Voeg een wand toe
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-900 mb-2">
              Aantal deuren/ramen (±2 m² aftrek per stuk)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpenings((v) => Math.max(0, v - 1))}
                className="w-12 h-12 rounded-xl border-2 border-stone-500 bg-white text-xl font-black text-stone-700 cursor-pointer hover:border-stone-500"
                aria-label="Minder openingen"
              >
                −
              </button>
              <span className="w-12 text-center text-2xl font-black tabular-nums">
                {openings}
              </span>
              <button
                type="button"
                onClick={() => setOpenings((v) => v + 1)}
                className="w-12 h-12 rounded-xl border-2 border-stone-500 bg-white text-xl font-black text-stone-700 cursor-pointer hover:border-stone-500"
                aria-label="Meer openingen"
              >
                +
              </button>
            </div>
          </div>
          </div>
        </div>

        <div
          className={`${
            mobileOpen ? 'flex' : 'hidden sm:flex'
          } lg:col-span-5 border p-6 sm:p-8 flex-col gap-5 shadow-lg lg:sticky lg:top-28`}
          style={{
            background: site.card,
            borderColor: site.line,
            borderRadius: site.radiusLg,
          }}
        >
          <span className="font-mono text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
            <PaintRoller className="w-4 h-4" />
            Jouw richtprijs
          </span>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                color: site.accentText,
              }}
            >
              {formatPrice(totalPrice)}
            </span>
            <span className="text-sm font-semibold text-stone-500">
              voor {Math.round(surfaceM2 * 10) / 10} m²
            </span>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-stone-600 border-t border-stone-200 pt-4">
            <div className="flex justify-between gap-3">
              <span>{selectedService.name}</span>
              <span className="font-semibold text-stone-900">
                € {selectedService.price}/m²
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Aantal wanden</span>
              <span className="font-semibold text-stone-900">{walls.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Aftrek deuren/ramen</span>
              <span className="font-semibold text-stone-900">
                {openings} × 2 m²
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed m-0">
            {site.estNote}
          </p>

          {lead.status === 'success' ? (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 flex flex-col gap-2 animate-fade-in" aria-live="polite">
              <p className="m-0 font-extrabold text-stone-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                Aanvraag verstuurd{lead.result?.reference ? ` (${lead.result.reference})` : ''}
              </p>
              <p className="m-0 text-sm text-stone-600">
                {site.owner.split(' ')[0]} bekijkt je maten en stuurt een definitieve offerte.{' '}
                {lead.result ? describeDelivery(lead.result) : ''}
              </p>
              <button
                type="button"
                onClick={lead.reset}
                className="self-start text-xs font-bold text-stone-500 underline bg-transparent border-0 p-0 cursor-pointer"
              >
                Nieuwe berekening aanvragen
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="relative flex flex-col gap-3" noValidate>
              <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Je naam (optioneel)"
                aria-label="Je naam (optioneel)"
                autoComplete="name"
                className="w-full h-12 px-4 rounded-xl border-2 border-stone-500 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900"
              />
              <div>
                <input
                  id="m2-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="Je telefoonnummer *"
                  aria-label="Je telefoonnummer"
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? 'm2-phone-error' : undefined}
                  className={`w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900 ${
                    phoneError ? 'border-rose-500' : 'border-stone-500'
                  }`}
                />
                {phoneError && (
                  <span id="m2-phone-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                    {phoneError}
                  </span>
                )}
              </div>
              {lead.status === 'error' && (
                <LeadErrorNotice message={lead.result?.error} whatsappUrl={waUrl} />
              )}
              <button
                type="submit"
                disabled={lead.status === 'sending' || surfaceM2 <= 0}
                className="h-14 px-6 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send className="w-5 h-5" />
                {lead.status === 'sending' ? 'Versturen…' : 'Vraag deze prijs aan'}
              </button>
                <PrivacyNote className="text-stone-500 text-center" />
            </form>
          )}

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="h-12 px-6 rounded-full bg-[#25D366] hover:brightness-95 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Of stuur je berekening via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
