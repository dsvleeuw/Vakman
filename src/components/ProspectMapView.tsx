import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowUpRight,
  Building2,
  Check,
  ExternalLink,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  X,
} from 'lucide-react';
import { Header } from './Header';
import {
  VAKKEN,
  VAK_ORDER,
  demoPad,
  loadProspects,
  scoreKleur,
  telHref,
  type Databron,
  type Prospect,
  type VakId,
} from '../data/prospects';

/**
 * Werkkaart met de bedrijven uit de leadlijst.
 *
 * Bedoeld als intern werkmiddel tijdens het bellen: je ziet waar de bedrijven
 * zitten, wat hun site scoort en je opent in twee klikken de persoonlijke demo.
 * De gegevens komen uit `public/kaart/leads.json`, dat bewust buiten git staat.
 */

const KAART_CENTRUM: [number, number] = [52.47, 4.8];
const KAART_ZOOM = 9;

const TELLINGEN = [
  { sleutel: 'telefoon', label: 'met telefoon' },
  { sleutel: 'email', label: 'met e-mail' },
  { sleutel: 'website', label: 'met website' },
] as const;

function scoreLabel(score: number | null | undefined): string {
  if (score == null) return 'niet gemeten';
  if (score < 50) return 'zwak';
  if (score < 90) return 'kan beter';
  return 'goed';
}

const DetailPane: React.FC<{ bedrijf: Prospect; onSluiten?: () => void }> = ({
  bedrijf,
  onSluiten,
}) => {
  const vak = VAKKEN[bedrijf.vak];
  const telefoon = bedrijf.mobiel || bedrijf.telefoon;
  const scores = bedrijf.lighthouse ?? {};
  const scoreRijen: Array<[string, number | null | undefined]> = [
    ['Performance', scores.performance],
    ['SEO', scores.seo],
    ['Toegankelijkheid', scores.toegankelijkheid],
    ['Best practices', scores.best_practices],
  ];
  const heeftScores = scoreRijen.some(([, waarde]) => waarde != null);

  return (
    <article className="h-full flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 p-5 pb-4">
        <div className="min-w-0">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${vak.kleur}14`, color: vak.kleur }}
          >
            {vak.label}
          </span>
          <h2 className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-stone-900">
            {bedrijf.naam}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {bedrijf.plaats}
            {bedrijf.regio && bedrijf.regio !== bedrijf.plaats ? ` · ${bedrijf.regio}` : ''}
          </p>
        </div>
        {onSluiten && (
          <button
            type="button"
            onClick={onSluiten}
            className="lg:hidden shrink-0 rounded-full border border-stone-200 p-2 text-stone-500 hover:bg-stone-50"
            aria-label="Details sluiten"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Acties */}
        <div className="grid gap-2">
          <a
            href={demoPad(bedrijf)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-bold text-white no-underline transition hover:bg-stone-800"
          >
            Demo openen
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={telHref(telefoon) ?? undefined}
              aria-disabled={!telefoon}
              className={`flex h-10 items-center justify-center gap-2 rounded-full border text-sm font-bold no-underline transition ${
                telefoon
                  ? 'border-stone-300 text-stone-900 hover:bg-stone-50'
                  : 'pointer-events-none border-stone-200 text-stone-300'
              }`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Bellen
            </a>
            <a
              href={bedrijf.email ? `mailto:${bedrijf.email}` : undefined}
              aria-disabled={!bedrijf.email}
              className={`flex h-10 items-center justify-center gap-2 rounded-full border text-sm font-bold no-underline transition ${
                bedrijf.email
                  ? 'border-stone-300 text-stone-900 hover:bg-stone-50'
                  : 'pointer-events-none border-stone-200 text-stone-300'
              }`}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Mailen
            </a>
          </div>
        </div>

        {/* Contactgegevens */}
        <dl className="space-y-2 text-sm">
          {telefoon && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Telefoon</dt>
              <dd className="text-right font-semibold text-stone-900">
                {telefoon}
                {bedrijf.mobiel && bedrijf.telefoon ? ` · ${bedrijf.telefoon}` : ''}
              </dd>
            </div>
          )}
          {bedrijf.email && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">E-mail</dt>
              <dd className="truncate text-right font-semibold text-stone-900">
                <a href={`mailto:${bedrijf.email}`} className="no-underline hover:underline">
                  {bedrijf.email}
                </a>
              </dd>
            </div>
          )}
          {bedrijf.adres && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Adres</dt>
              <dd className="text-right font-semibold text-stone-900">
                {bedrijf.adres}
                {bedrijf.postcode ? `, ${bedrijf.postcode}` : ''} {bedrijf.plaats}
              </dd>
            </div>
          )}
          {bedrijf.website && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Website</dt>
              <dd className="truncate text-right font-semibold text-stone-900">
                <a
                  href={bedrijf.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 no-underline hover:underline"
                >
                  {bedrijf.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </a>
              </dd>
            </div>
          )}
          {bedrijf.kvk && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">KvK</dt>
              <dd className="text-right font-semibold text-stone-900">{bedrijf.kvk}</dd>
            </div>
          )}
          {bedrijf.sinds && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Actief sinds</dt>
              <dd className="text-right font-semibold text-stone-900">{bedrijf.sinds}</dd>
            </div>
          )}
          {bedrijf.openingstijden && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Openingstijden</dt>
              <dd className="text-right font-semibold text-stone-900">{bedrijf.openingstijden}</dd>
            </div>
          )}
          {bedrijf.werkgebied && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Werkgebied</dt>
              <dd className="text-right font-semibold text-stone-900">{bedrijf.werkgebied}</dd>
            </div>
          )}
          {bedrijf.reviews && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-500">Reviews</dt>
              <dd className="inline-flex items-center gap-1 text-right font-semibold text-stone-900">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {bedrijf.reviews}
              </dd>
            </div>
          )}
        </dl>

        {/* Diensten */}
        {bedrijf.diensten && bedrijf.diensten.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              Diensten
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {bedrijf.diensten.map((dienst) => (
                <li
                  key={dienst}
                  className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700"
                >
                  {dienst}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Site-scores */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
            Website (Lighthouse, mobiel)
          </h3>
          {heeftScores ? (
            <ul className="space-y-2">
              {scoreRijen.map(([label, waarde]) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 text-xs font-semibold text-stone-600">{label}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${waarde ?? 0}%`,
                        backgroundColor: scoreKleur(waarde),
                      }}
                    />
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs font-bold text-stone-900">
                    {waarde == null ? '–' : `${waarde} ${scoreLabel(waarde)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Nog niet gemeten.</p>
          )}
        </div>

        {bedrijf.notitie && (
          <div>
            <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
              Aantekening
            </h3>
            <p className="text-sm leading-relaxed text-stone-700">{bedrijf.notitie}</p>
          </div>
        )}

        {bedrijf.bron && (
          <a
            href={bedrijf.bron}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 no-underline hover:text-stone-900"
          >
            Bron bekijken
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};

export const ProspectMapView: React.FC = () => {
  const [bedrijven, setBedrijven] = useState<Prospect[]>([]);
  const [bron, setBron] = useState<Databron>('voorbeeld');
  const [bijgewerkt, setBijgewerkt] = useState<string | undefined>();
  const [laden, setLaden] = useState(true);
  const [actieveVakken, setActieveVakken] = useState<Set<VakId>>(new Set());
  const [zoek, setZoek] = useState('');
  const [alleenZwak, setAlleenZwak] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState<Prospect | null>(null);
  const [alleenFilterZichtbaar, setAlleenFilterZichtbaar] = useState(false);

  const kaartRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Deze pagina hoort niet in Google: het is gereedschap met bedrijfsgegevens.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  useEffect(() => {
    let actief = true;
    loadProspects().then((geladen) => {
      if (!actief) return;
      setBedrijven(geladen.bedrijven);
      setBron(geladen.bron);
      setBijgewerkt(geladen.bijgewerkt);
      setLaden(false);
    });
    return () => {
      actief = false;
    };
  }, []);

  // Leaflet eenmalig opzetten.
  useEffect(() => {
    if (!kaartRef.current || mapRef.current) return;
    const map = L.map(kaartRef.current, {
      center: KAART_CENTRUM,
      zoom: KAART_ZOOM,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  const zichtbaar = useMemo(() => {
    const term = zoek.trim().toLowerCase();
    return bedrijven.filter((bedrijf) => {
      if (actieveVakken.size > 0 && !actieveVakken.has(bedrijf.vak)) return false;
      if (alleenZwak && !(bedrijf.lighthouse?.performance != null && bedrijf.lighthouse.performance < 50)) {
        return false;
      }
      if (!term) return true;
      return [bedrijf.naam, bedrijf.plaats, bedrijf.regio ?? '', ...(bedrijf.diensten ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [bedrijven, actieveVakken, alleenZwak, zoek]);

  // Markers (opnieuw) plaatsen bij elke filter- of selectiewijziging.
  useEffect(() => {
    const map = mapRef.current;
    const groep = markersRef.current;
    if (!map || !groep) return;
    groep.clearLayers();

    zichtbaar.forEach((bedrijf) => {
      const kleur = VAKKEN[bedrijf.vak].kleur;
      const isGekozen = geselecteerd?.id === bedrijf.id;
      const icoon = L.divIcon({
        className: 'klusbaas-pin-wrapper',
        html: `<span class="klusbaas-pin${isGekozen ? ' klusbaas-pin--actief' : ''}">
            <svg viewBox="0 0 24 34" width="26" height="36" aria-hidden="true">
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="${kleur}"/>
              <circle cx="12" cy="12" r="4.4" fill="#fff"/>
            </svg>
          </span>`,
        iconSize: [26, 36],
        iconAnchor: [13, 36],
      });
      const marker = L.marker([bedrijf.lat, bedrijf.lng], {
        icon: icoon,
        title: `${bedrijf.naam} — ${bedrijf.plaats}`,
        alt: `${bedrijf.naam}, ${VAKKEN[bedrijf.vak].label} in ${bedrijf.plaats}`,
        keyboard: true,
      });
      marker.on('click', () => setGeselecteerd(bedrijf));
      marker.addTo(groep);
    });
  }, [zichtbaar, geselecteerd]);

  // Bij filteren de kaart op de zichtbare bedrijven passen.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || zichtbaar.length === 0) return;
    const grenzen = L.latLngBounds(zichtbaar.map((b) => [b.lat, b.lng] as [number, number]));
    map.fitBounds(grenzen, { padding: [48, 48], maxZoom: 12 });
  }, [zichtbaar]);

  // Als het gekozen bedrijf wegvalt door een filter, de detailkaart leegmaken
  // in plaats van gegevens te tonen die niet meer in de lijst staan.
  useEffect(() => {
    if (!geselecteerd) return;
    if (!zichtbaar.some((bedrijf) => bedrijf.id === geselecteerd.id)) {
      setGeselecteerd(null);
    }
  }, [zichtbaar, geselecteerd]);

  // Gekozen bedrijf in beeld brengen.
  useEffect(() => {
    if (!geselecteerd || !mapRef.current) return;
    mapRef.current.panTo([geselecteerd.lat, geselecteerd.lng], { animate: true });
  }, [geselecteerd]);

  const tel = (sleutel: (typeof TELLINGEN)[number]['sleutel']) =>
    bedrijven.filter((bedrijf) => Boolean(bedrijf[sleutel])).length;

  const gemiddeldeScore = useMemo(() => {
    const scores = bedrijven
      .map((bedrijf) => bedrijf.lighthouse?.performance)
      .filter((score): score is number => typeof score === 'number');
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [bedrijven]);

  const wisselVak = (vak: VakId) => {
    setActieveVakken((huidig) => {
      const volgende = new Set(huidig);
      if (volgende.has(vak)) volgende.delete(vak);
      else volgende.add(vak);
      return volgende;
    });
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <Header />

      <main id="main-content" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-stone-100">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              Werkkaart · niet voor publicatie
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Vakmensen op de kaart
            </h1>
            <p className="mt-2 max-w-2xl text-stone-600">
              De bedrijven uit de leadlijst Noord-Holland, met alles wat we van ze weten: contact,
              diensten, reviews en hoe hun eigen site scoort. Klik een pin of een rij om de kaart te
              openen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {TELLINGEN.map(({ sleutel, label }) => (
              <span
                key={sleutel}
                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-700"
              >
                {tel(sleutel)} {label}
              </span>
            ))}
            {gemiddeldeScore != null && (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-700">
                gem. performance {gemiddeldeScore}
              </span>
            )}
          </div>
        </div>

        {bron === 'voorbeeld' && !laden && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="font-bold">Voorbeelddata.</strong> Er ligt nog geen werkbestand op{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">public/kaart/leads.json</code>.
            Zet daar je eigen bedrijven neer (formaat: zie{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">leads.example.json</code>) of
            genereer het met <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">npm run leads:info</code>.
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 rounded-full bg-stone-100 px-3 py-2">
            <Search className="h-4 w-4 text-stone-400" aria-hidden="true" />
            <span className="sr-only">Zoek op naam, plaats of dienst</span>
            <input
              type="search"
              value={zoek}
              onChange={(event) => setZoek(event.target.value)}
              placeholder="Zoek op naam, plaats of dienst"
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
            />
          </label>
          <button
            type="button"
            onClick={() => setAlleenFilterZichtbaar((open) => !open)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-3.5 py-2 text-sm font-bold text-stone-700 lg:hidden"
            aria-expanded={alleenFilterZichtbaar}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Vakken
          </button>
          <div
            className={`${alleenFilterZichtbaar ? 'flex' : 'hidden'} flex-wrap gap-1.5 lg:flex`}
            role="group"
            aria-label="Filter op vak"
          >
            {VAK_ORDER.map((vak) => {
              const actief = actieveVakken.has(vak);
              const aantal = bedrijven.filter((bedrijf) => bedrijf.vak === vak).length;
              return (
                <button
                  key={vak}
                  type="button"
                  onClick={() => wisselVak(vak)}
                  aria-pressed={actief}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    actief
                      ? 'border-transparent text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                  style={actief ? { backgroundColor: VAKKEN[vak].kleur } : undefined}
                >
                  {actief && <Check className="h-3 w-3" aria-hidden="true" />}
                  {VAKKEN[vak].label}
                  <span className={actief ? 'opacity-70' : 'text-stone-400'}>{aantal}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAlleenZwak((aan) => !aan)}
              aria-pressed={alleenZwak}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                alleenZwak
                  ? 'border-transparent bg-red-600 text-white'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              }`}
            >
              {alleenZwak && <Check className="h-3 w-3" aria-hidden="true" />}
              Site scoort &lt; 50
            </button>
          </div>
        </div>

        {/* Kaart + detail */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-200">
            <div ref={kaartRef} className="h-[380px] w-full lg:h-[560px]" aria-label="Kaart met bedrijven" />
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm backdrop-blur">
              {laden ? 'Laden…' : `${zichtbaar.length} van ${bedrijven.length} bedrijven`}
            </div>
          </div>

          <div className="min-h-[320px] lg:h-[560px]">
            {geselecteerd ? (
              <DetailPane bedrijf={geselecteerd} onSluiten={() => setGeselecteerd(null)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
                <MapPin className="h-8 w-8 text-stone-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-bold text-stone-700">Kies een bedrijf</p>
                <p className="mt-1 max-w-[24ch] text-sm text-stone-500">
                  Klik op een pin of op een rij hieronder voor contact, diensten en site-scores.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lijst */}
        <section className="mt-8" aria-labelledby="lijst-titel">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="lijst-titel" className="text-lg font-extrabold tracking-tight">
              Lijst
            </h2>
            <span className="text-sm text-stone-500">
              {bijgewerkt ? `bijgewerkt ${bijgewerkt}` : ''}
            </span>
          </div>

          {zichtbaar.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
              Geen bedrijven die aan dit filter voldoen.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {zichtbaar.map((bedrijf) => {
                const vak = VAKKEN[bedrijf.vak];
                const score = bedrijf.lighthouse?.performance;
                return (
                  <li key={bedrijf.id}>
                    <button
                      type="button"
                      onClick={() => setGeselecteerd(bedrijf)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${
                        geselecteerd?.id === bedrijf.id ? 'bg-stone-50' : ''
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: vak.kleur }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-stone-900">
                          {bedrijf.naam}
                        </span>
                        <span className="block truncate text-xs text-stone-500">
                          {vak.label} · {bedrijf.plaats}
                          {bedrijf.diensten?.[0] ? ` · ${bedrijf.diensten[0]}` : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span
                          className="block text-sm font-extrabold"
                          style={{ color: scoreKleur(score) }}
                        >
                          {score == null ? '–' : score}
                        </span>
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                          performance
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-8 text-xs leading-relaxed text-stone-500">
          Pinnen staan op plaatsniveau, niet op huisadres. De demo-link opent de persoonlijke
          voorbeeldpagina van Klusbaas, geen kopie van de site van het bedrijf. Bellen is het kanaal:
          check de niet-mailingindicator voordat je iets mailt.
        </p>
      </main>
    </div>
  );
};
