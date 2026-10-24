import React, { useMemo, useState } from 'react';
import { Ruler, Plus, Trash2, MessageCircle, PaintRoller } from 'lucide-react';
import type { ActiveSiteData } from '../../types';
import {
  parsePricePerM2,
  calculateSurfaceArea,
  calculateM2Estimate,
} from '../../utils/surface';
import {
  buildWhatsAppUrl,
  buildSurfaceQuoteMessage,
} from '../../utils/contact';
import { formatPrice } from '../../utils/pricing';

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

  const waUrl = buildWhatsAppUrl(
    site.phone,
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

  const inputClass =
    'w-full h-12 px-4 rounded-xl border-2 border-stone-500 bg-white text-stone-900 font-semibold text-sm focus:outline-none focus:border-stone-900';

  return (
    <section
      id="m2-calculator"
      className="py-16 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-24"
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

        <div
          className="lg:col-span-5 border p-6 sm:p-8 flex flex-col gap-5 shadow-lg lg:sticky lg:top-28"
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

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam (optioneel)"
            className="w-full h-12 px-4 rounded-xl border-2 border-stone-500 bg-stone-50 text-stone-900 font-semibold text-sm focus:outline-none focus:border-stone-900"
          />

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="h-14 px-6 rounded-full bg-[#25D366] hover:brightness-95 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-md transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-5 h-5" />
            Vraag deze prijs aan via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
