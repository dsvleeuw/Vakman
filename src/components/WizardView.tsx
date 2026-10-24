import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import type {
  PlanId,
  QuoteChannel,
  SectorId,
  WizardFormData,
  WizardDraft,
  AppointmentBooking,
} from '../types';
import type { User } from 'firebase/auth';
import {
  ORDER,
  SECTORS,
  STYLES,
  getUnsplashUrl,
  buildActiveSite,
} from '../data/tradesData';
import { validateWizardForm } from '../utils/pricing';
import { PLANS, getPlan } from '../data/plans';
import { ADDONS, ADDON_GROUPS, isAddonIncluded } from '../data/addons';
import { DEFAULT_PLAN, buildQuote, quoteDelivery, sanitizeAddonIds } from '../utils/quote';
import { formatEuro } from '../utils/quoteEmail';
import { QuoteSummary } from './QuoteSummary';
import { LeadError, LeadHoneypot } from './LeadFormStatus';
import { useLeadSubmit } from '../hooks/useLeadSubmit';
import { getPlatformWhatsApp } from '../data/platform';
import {
  buildQuoteRequestMessage,
  buildWhatsAppUrl,
  isValidEmail,
} from '../utils/contact';
import { track } from '../utils/analytics';
import {
  signInWithGoogle,
  createGoogleCalendarEvent,
  initAuthListener,
  logoutGoogle,
} from '../utils/googleWorkspace';
import {
  buildNextDates,
  generateAppointmentId,
  buildAppointmentCalendarPayload,
  saveAppointment,
  TIME_SLOTS,
  type TimeSlot,
} from '../utils/appointments';
import { WIZARD_STEPS, WIZARD_STEP_LABELS, type WizardRouteStep, type DemoPersonalization } from '../utils/router';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { ImageWithFallback } from './ImageWithFallback';
import { SiteView } from './SiteView';

interface WizardViewProps {
  /** Controlled by the URL: /start/vak … /start/afspraak, /start/klaar */
  step: WizardRouteStep;
  onStepChange: (step: WizardRouteStep) => void;
  initialSector: SectorId;
  /** Whether the visitor already picked a trade (or opened a ?vak= link / saved draft). */
  hasInitialSector?: boolean;
  initialStyleIndex: number;
  initialForm?: WizardFormData | null;
  /** Details from a personal demo link; applied once after hydration. */
  prefill?: DemoPersonalization;
  initialDisabledServices?: Record<number, boolean>;
  /** Add-on ids restored from the saved draft. */
  initialAddons?: string[];
  /** Package chosen in the pricing table, carried in the URL as ?pakket=pro */
  plan?: PlanId;
  /** Mirrors the wizard state into the URL and session storage. */
  onDraftChange?: (draft: WizardDraft) => void;
  onSelectionChange?: (sector: SectorId, styleIndex: number, plan?: PlanId) => void;
  onGoHome: () => void;
  onViewPublishedSite: (sectorId: SectorId, styleIndex: number, form: WizardFormData) => void;
}

const FIELD_ORDER: (keyof WizardFormData)[] = ['biz', 'owner', 'phone', 'city'];

export const WizardView: React.FC<WizardViewProps> = ({
  step,
  onStepChange,
  initialSector,
  hasInitialSector,
  initialStyleIndex,
  initialForm,
  prefill,
  initialDisabledServices,
  initialAddons,
  plan,
  onDraftChange,
  onSelectionChange,
  onGoHome,
  onViewPublishedSite,
}) => {
  const [sector, setSector] = useState<SectorId>(initialSector);
  const [sectorChosen, setSectorChosen] = useState<boolean>(
    Boolean(hasInitialSector || step !== 'vak')
  );
  const [styleIndex, setStyleIndex] = useState<number>(initialStyleIndex);

  const baseSector = SECTORS[sector];

  const [formData, setFormData] = useState<WizardFormData>(
    () =>
      initialForm ?? {
        biz: '',
        owner: '',
        phone: '',
        city: '',
      }
  );

  // "Maak dit mijn website" on a personal demo link prefills these fields.
  // Keyed on the values so a re-parsed route does not undo the visitor's edits.
  const prefillKey = prefill ? JSON.stringify(prefill) : '';
  useEffect(() => {
    if (!prefill) return;
    setFormData((current) => ({
      ...current,
      ...(prefill.biz ? { biz: prefill.biz } : {}),
      ...(prefill.city ? { city: prefill.city } : {}),
      ...(prefill.phone ? { phone: prefill.phone } : {}),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey]);

  const [disabledServices, setDisabledServices] = useState<Record<number, boolean>>(
    initialDisabledServices ?? {}
  );
  const [planId, setPlanId] = useState<PlanId>(plan ?? DEFAULT_PLAN);
  const [addons, setAddons] = useState<string[]>(() => sanitizeAddonIds(initialAddons ?? []));
  const [channel, setChannel] = useState<QuoteChannel>('Allebei');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Appointment / quote request (final step)
  const [dates] = useState(() => buildNextDates());
  const [bookingDate, setBookingDate] = useState(dates[0]);
  const [bookingSlot, setBookingSlot] = useState<TimeSlot>(TIME_SLOTS[0]);
  const [isBooking, setIsBooking] = useState(false);
  const lead = useLeadSubmit();
  const [quoteReference, setQuoteReference] = useState<string | null>(null);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [customerEmailSent, setCustomerEmailSent] = useState(false);
  const [mailPreview, setMailPreview] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    booking: AppointmentBooking;
    calendarSynced: boolean;
    syncError?: string;
  } | null>(null);

  // Optional Google sign-in so the appointment can be pushed into the user's calendar
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    track('wizard_step_view', { step, sector, style: styleIndex });
    // One event per step view; sector/style changes should not fire it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [previewOpen, setPreviewOpen] = useState(false);

  const currentStepIndex = WIZARD_STEPS.indexOf(step as (typeof WIZARD_STEPS)[number]);
  const isPublished = step === 'klaar';
  const visualStepIndex = isPublished ? WIZARD_STEPS.length : currentStepIndex;

  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setAuthUser(user);
        setAccessToken(token);
      },
      () => {
        setAuthUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Keep the URL and the saved draft in sync with what the visitor picked.
  // Skip the first run so opening /start/vak does not immediately rewrite the
  // URL with query params the visitor never chose.
  const hasNotifiedSelection = useRef(false);
  useEffect(() => {
    if (!hasNotifiedSelection.current) {
      hasNotifiedSelection.current = true;
      return;
    }
    onSelectionChange?.(sector, styleIndex, planId);
  }, [sector, styleIndex, planId, onSelectionChange]);

  useEffect(() => {
    onDraftChange?.({ sector, styleIndex, form: formData, disabledServices, sectorChosen, addons });
  }, [sector, styleIndex, formData, disabledServices, sectorChosen, addons, onDraftChange]);

  const toggleAddon = (id: string) =>
    setAddons((current) =>
      current.includes(id) ? current.filter((addonId) => addonId !== id) : sanitizeAddonIds([...current, id])
    );

  const handleSelectSector = (secId: SectorId) => {
    setSectorChosen(true);
    if (secId === sector) {
      onSelectionChange?.(secId, styleIndex);
      return;
    }
    setSector(secId);
    setDisabledServices({});
    setErrors({});
  };

  const handleFieldChange = (field: keyof WizardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (step === 'vak') {
      setSectorChosen(true);
    }
    if (step === 'gegevens') {
      const formErrors = validateWizardForm(formData);
      if (Object.keys(formErrors).length > 0) {
        track('wizard_validation_error', { fields: Object.keys(formErrors).join(',') });
        setErrors(formErrors);
        const firstInvalid = FIELD_ORDER.find((field) => formErrors[field]);
        if (firstInvalid) {
          document.getElementById(`wizard-${firstInvalid}`)?.focus();
        }
        return;
      }
    }

    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      track('wizard_step_complete', { step });
      onStepChange(WIZARD_STEPS[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      onStepChange(WIZARD_STEPS[currentStepIndex - 1]);
    }
  };

  const handleSubmitQuote = async () => {
    if (channel !== 'WhatsApp' && !isValidEmail(formData.email || '')) {
      setErrors((prev) => ({ ...prev, email: 'Vul een geldig e-mailadres in, hier sturen we je offerte heen' }));
      document.getElementById('wizard-email')?.focus();
      return;
    }
    setIsBooking(true);

    const bizName = formData.biz.trim() || baseSector.biz;
    const owner = formData.owner.trim() || baseSector.owner;
    const city = formData.city.trim() || baseSector.city;
    const serviceName = liveSite.services[0]?.n || 'Algemeen gesprek';
    const notes = `Vak: ${baseSector.name}`;

    const booking: AppointmentBooking = {
      id: generateAppointmentId(),
      sectorId: sector,
      bizName,
      serviceName,
      dateStr: bookingDate.formatted,
      timeSlot: bookingSlot,
      clientName: owner,
      clientPhone: formData.phone.trim(),
      clientAddress: city,
      notes,
      channel,
      calendarSyncRequested: addToCalendar,
      createdAt: Date.now(),
    };

    const sent = await lead.submit({
      kind: 'offerte',
      sector,
      styleIndex,
      plan: planId,
      addons,
      services: enabledServices,
      form: { ...formData, email: formData.email?.trim() ?? '' },
      channel,
      appointment: { date: bookingDate.formatted, slot: bookingSlot },
    });
    if (!sent.ok) {
      setIsBooking(false);
      return;
    }
    setQuoteReference(sent.reference || null);
    setQuoteUrl(typeof sent.data.quoteUrl === 'string' ? sent.data.quoteUrl : null);
    setCustomerEmailSent(sent.customerEmailSent);
    setMailPreview(sent.preview);

    saveAppointment(booking);

    let calendarSynced = false;
    let syncError: string | undefined;
    if (addToCalendar) {
      try {
        let token = accessToken;
        // Signing in is opt-in: only when the visitor ticked "in mijn agenda".
        if (!token) {
          const res = await signInWithGoogle();
          if (res) {
            token = res.accessToken;
            setAuthUser(res.user);
            setAccessToken(token);
          }
        }
        if (token) {
          const calRes = await createGoogleCalendarEvent(
            token,
            buildAppointmentCalendarPayload({
              bizName,
              owner,
              phone: liveSite.phone,
              city,
              clientName: owner,
              clientPhone: formData.phone.trim(),
              serviceName,
              dateIso: bookingDate.iso,
              slot: bookingSlot,
              notes,
            })
          );
          if (calRes.success) {
            calendarSynced = true;
            booking.googleCalendarEventId = calRes.eventId;
          } else {
            syncError = calRes.error;
          }
        }
      } catch {
        syncError = 'Inloggen met Google mislukt, afspraak lokaal genoteerd.';
      }
    }

    track('appointment_requested', {
      sector,
      channel,
      plan: planId,
      calendar: addToCalendar,
    });
    setBookingResult({ booking, calendarSynced, syncError });
    setIsBooking(false);
    onStepChange('klaar');
  };

  const liveSite = buildActiveSite(sector, styleIndex, formData, disabledServices);
  const showPreview = isDesktop || previewOpen;
  const selectedPlan = getPlan(planId);
  const quote = buildQuote(planId, addons);
  const enabledServices = liveSite.services.map((service) => service.n);

  // No VITE_DEMO_PHONE means no safe WhatsApp number: fall back to e-mail.
  const platformWhatsApp = getPlatformWhatsApp();
  const quoteMessage = buildQuoteRequestMessage({
    bizName: formData.biz.trim() || baseSector.biz,
    owner: formData.owner.trim() || baseSector.owner,
    phone: formData.phone.trim() || baseSector.phone,
    city: formData.city.trim() || baseSector.city,
    dateStr: bookingResult?.booking.dateStr ?? bookingDate.formatted,
    timeSlot: bookingResult?.booking.timeSlot ?? bookingSlot,
    channel,
    planName: selectedPlan?.name,
    appointmentId: quoteReference ?? bookingResult?.booking.id,
  });

  return (
    <div id="main-content" className="flex flex-col min-h-screen bg-stone-100/90 text-stone-900">
      {/* Wizard Header with Step Progress */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-8 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-2 sm:gap-6 flex-wrap sticky top-0 z-20 shadow-sm">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 sm:gap-2.5 min-h-11 bg-transparent border-0 p-0 cursor-pointer text-stone-900"
          aria-label="Terug naar de Klusbaas homepage"
        >
          <span className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-base">
            K
          </span>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight">Klusbaas</span>
        </button>

        {/* Step Bullets — clickable so people can jump back without losing data */}
        <nav aria-label="Wizard voortgang">
          <ol className="flex items-center gap-0 sm:gap-2 md:gap-4 flex-wrap list-none m-0 p-0">
            {WIZARD_STEPS.map((stepId, idx) => {
              const isCompleted = idx < visualStepIndex;
              const isCurrent = idx === visualStepIndex;
              const canNavigate = idx < visualStepIndex && !isPublished;

              return (
                <li key={stepId} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => canNavigate && onStepChange(stepId)}
                    disabled={!canNavigate}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Stap ${idx + 1}: ${WIZARD_STEP_LABELS[stepId]}${
                      isCompleted ? ' (voltooid)' : ''
                    }`}
                    className={`min-w-10 min-h-10 px-1 flex items-center justify-center gap-2 bg-transparent border-0 ${
                      canNavigate ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-2'
                          : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-semibold hidden sm:inline ${
                        isCurrent ? 'text-stone-900' : 'text-stone-500'
                      } ${canNavigate ? 'hover:text-stone-900' : ''}`}
                    >
                      {WIZARD_STEP_LABELS[stepId]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      {/* Main Split Layout: Centered max-w-xl on tablet, two-column split on desktop */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-8 md:py-10 md:px-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-6 flex flex-col gap-6 w-full max-w-xl mx-auto lg:mx-0">
          {/* Context: what the visitor already picked, and how to change it */}
          {currentStepIndex >= 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onStepChange('vak')}
                className="min-h-11 pl-3.5 pr-3 rounded-full bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-700 cursor-pointer inline-flex items-center gap-1.5"
              >
                Vak: {baseSector.name}
                <span className="text-stone-400 font-semibold">wijzig</span>
              </button>
              <button
                type="button"
                onClick={() => onStepChange('stijl')}
                className="min-h-11 pl-3.5 pr-3 rounded-full bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-700 cursor-pointer inline-flex items-center gap-1.5"
              >
                Stijl: {STYLES[styleIndex].name}
                <span className="text-stone-400 font-semibold">wijzig</span>
              </button>
              {selectedPlan && (
                <span className="min-h-11 px-3.5 rounded-full bg-amber-300 text-amber-950 text-xs font-extrabold inline-flex items-center">
                  Pakket: {selectedPlan.name}
                </span>
              )}
            </div>
          )}
          {/* STEP 1: Vak kiezen */}
          {step === 'vak' && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 1 VAN 6 · VAK
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Wat is jouw vak?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Kies je vakgebied. Wij laden meteen geschikte diensten, tarieven en
                fotografie in.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {ORDER.map((secId) => {
                  const sec = SECTORS[secId];
                  const isSelected = sectorChosen && secId === sector;
                  const thumb = getUnsplashUrl(sec.pool[0], 400);

                  return (
                    <button
                      key={secId}
                      onClick={() => handleSelectSector(secId)}
                      aria-pressed={isSelected}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer p-0 shadow-sm transition-all hover:scale-[1.03] ${
                        isSelected
                          ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2 scale-[1.02]'
                          : 'border-transparent opacity-85 hover:opacity-100'
                      }`}
                    >
                      <ImageWithFallback
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <span className="absolute left-3 bottom-3 text-white font-extrabold text-base sm:text-lg">
                        {sec.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Stijl kiezen */}
          {step === 'stijl' && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 2 VAN 6 · STIJL
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Welke stijl past bij jou?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Kies uit vijf unieke ontwerpen. In het live voorbeeld zie je meteen
                het resultaat met jouw gekozen vak.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {STYLES.map((st, idx) => {
                  const isSelected = idx === styleIndex;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setStyleIndex(idx)}
                      aria-pressed={isSelected}
                      className={`p-4 rounded-2xl border-2 bg-white text-left cursor-pointer flex items-center justify-between gap-4 transition-all ${
                        isSelected
                          ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-1 shadow-sm'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-stone-400">
                          0{idx + 1}
                        </span>
                        <span
                          className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 block"
                          style={{ fontFamily: st.display }}
                        >
                          {st.name}
                        </span>
                        <span className="text-xs sm:text-sm text-stone-500 line-clamp-1">
                          {st.desc}
                        </span>
                      </div>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Gegevens invoeren */}
          {step === 'gegevens' && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 3 VAN 6 · GEGEVENS
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Jouw bedrijfsgegevens
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Vul hieronder je contactgegevens in. Zodra je typt, werkt je live
                voorbeeld meteen bij.
              </p>

              <div className="flex flex-col gap-4 pt-2">
                <div>
                  <label htmlFor="wizard-biz" className="block text-sm font-bold text-stone-900 mb-1.5">
                    Bedrijfsnaam
                  </label>
                  <input
                    id="wizard-biz"
                    type="text"
                    value={formData.biz}
                    onChange={(e) => handleFieldChange('biz', e.target.value)}
                    placeholder="bijv. Houtwerk De Vries"
                    autoComplete="organization"
                    aria-required="true"
                    aria-invalid={!!errors.biz}
                    aria-describedby={errors.biz ? 'wizard-biz-error' : undefined}
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.biz ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.biz && (
                    <span id="wizard-biz-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.biz}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="wizard-owner" className="block text-sm font-bold text-stone-900 mb-1.5">
                    Jouw voor- en achternaam
                  </label>
                  <input
                    id="wizard-owner"
                    type="text"
                    value={formData.owner}
                    onChange={(e) => handleFieldChange('owner', e.target.value)}
                    placeholder="bijv. Jan de Vries"
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={!!errors.owner}
                    aria-describedby={errors.owner ? 'wizard-owner-error' : undefined}
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.owner ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.owner && (
                    <span id="wizard-owner-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.owner}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="wizard-phone" className="block text-sm font-bold text-stone-900 mb-1.5">
                    Telefoonnummer (voor offertes)
                  </label>
                  <input
                    id="wizard-phone"
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'wizard-phone-error' : undefined}
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.phone ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.phone && (
                    <span id="wizard-phone-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.phone}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="wizard-city" className="block text-sm font-bold text-stone-900 mb-1.5">
                    Plaats / Standplaats
                  </label>
                  <input
                    id="wizard-city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    placeholder="bijv. Utrecht"
                    autoComplete="address-level2"
                    aria-required="true"
                    aria-invalid={!!errors.city}
                    aria-describedby={errors.city ? 'wizard-city-error' : undefined}
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.city ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.city && (
                    <span id="wizard-city-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.city}
                    </span>
                  )}
                </div>

                <p className="flex items-start gap-2 text-xs text-stone-500 m-0">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  We gebruiken deze gegevens alleen voor jouw demo-website. Je kunt ze
                  later altijd aanpassen.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Diensten selecteren */}
          {step === 'diensten' && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 4 VAN 6 · DIENSTEN
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Welke diensten bied je aan?
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Vink de werkzaamheden aan die je uitvoert. Deze verschijnen direct
                op je website.
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {baseSector.services.map((sv, idx) => {
                  const isEnabled = !disabledServices[idx];

                  return (
                    <button
                      key={sv.n}
                      onClick={() => {
                        setDisabledServices((prev) => ({
                          ...prev,
                          [idx]: !prev[idx],
                        }));
                      }}
                      aria-pressed={isEnabled}
                      className={`p-4 rounded-xl border-2 bg-white text-left cursor-pointer flex items-center justify-between gap-4 transition-all ${
                        isEnabled
                          ? 'border-stone-900 shadow-sm'
                          : 'border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isEnabled ? 'bg-stone-900 text-white' : 'bg-stone-200'
                          }`}
                          aria-hidden="true"
                        >
                          {isEnabled ? '✓' : ''}
                        </span>
                        <div>
                          <span className="text-base font-bold text-stone-900 block">
                            {sv.n}
                          </span>
                          <span className="text-xs text-stone-500">{sv.p}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        {isEnabled ? 'Actief' : 'Verborgen'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Pakket en extra componenten */}
          {step === 'extras' && (
            <div className="flex flex-col gap-5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 5 VAN 6 · EXTRA'S
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Kies je pakket en extra's
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Alle prijzen zijn eenmalig en exclusief btw. Wat je pakket al bevat,
                staat erbij als inbegrepen.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="group" aria-label="Pakket">
                {PLANS.map((option) => {
                  const isSel = option.id === planId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setPlanId(option.id);
                        track('plan_select', { plan: option.id, source: 'wizard' });
                      }}
                      aria-pressed={isSel}
                      className={`p-4 rounded-xl border-2 text-left cursor-pointer flex flex-col gap-1 transition-all ${
                        isSel ? 'border-stone-900 bg-stone-900 text-white shadow-sm' : 'border-stone-200 bg-white text-stone-900 hover:border-stone-400'
                      }`}
                    >
                      <span className="text-sm font-extrabold">{option.name}</span>
                      <span className="text-lg font-black tabular-nums">{formatEuro(option.price)}</span>
                      <span className={`text-xs ${isSel ? 'text-white/75' : 'text-stone-500'}`}>excl. btw</span>
                    </button>
                  );
                })}
              </div>

              {ADDON_GROUPS.map((group) => (
                <div key={group} className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">{group}</span>
                  {ADDONS.filter((addon) => addon.group === group).map((addon) => {
                    const included = isAddonIncluded(addon, planId);
                    const isOn = addons.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        aria-pressed={isOn}
                        className={`p-3.5 rounded-xl border-2 bg-white text-left cursor-pointer flex items-center justify-between gap-3 transition-all ${
                          isOn ? 'border-stone-900 shadow-sm' : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <span className="flex items-start gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center shrink-0 ${
                              isOn ? 'bg-stone-900 text-white' : 'bg-stone-200 text-transparent'
                            }`}
                            aria-hidden="true"
                          >
                            <Check className="w-4 h-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="text-sm font-bold text-stone-900 block">{addon.label}</span>
                            <span className="text-xs text-stone-500">{addon.description}</span>
                          </span>
                        </span>
                        <span className="text-sm font-extrabold tabular-nums shrink-0">
                          {included ? (
                            <span className="text-xs text-emerald-700">inbegrepen</span>
                          ) : (
                            `+ ${formatEuro(addon.price)}`
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}

              <QuoteSummary
                quote={quote}
                sectorName={baseSector.name}
                styleName={STYLES[styleIndex].name}
                services={enabledServices}
                onEditStep={onStepChange}
                onRemoveAddon={toggleAddon}
              />
            </div>
          )}

          {/* STEP 6: Offerte versturen, optioneel met een belmoment */}
          {step === 'afspraak' && (
            <div className="flex flex-col gap-6">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                STAP 6 VAN 6 · VERSTUREN
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight m-0">
                Vraag je offerte aan.
              </h1>
              <p className="text-stone-600 text-sm sm:text-base m-0">
                Kies hoe je de offerte wilt ontvangen en wanneer we je mogen bellen om
                alles door te nemen. Vrijblijvend: je zit nergens aan vast.
              </p>

              <div className="relative bg-white p-6 rounded-2xl border border-stone-200 flex flex-col gap-5">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block mb-2">
                    1. Belmoment: kies een datum (komende 2 weken)
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {dates.map((d) => {
                      const isSel = bookingDate.iso === d.iso;
                      return (
                        <button
                          key={d.iso}
                          onClick={() => setBookingDate(d)}
                          aria-pressed={isSel}
                          aria-label={`${d.dayName} ${d.dayNum} ${d.monthName}`}
                          className={`p-2.5 rounded-xl border-2 text-center cursor-pointer flex flex-col items-center justify-center transition-all ${
                            isSel
                              ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-sm'
                              : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-400'
                          }`}
                        >
                          <span className="text-xs uppercase opacity-75">{d.dayName}</span>
                          <span className="text-lg font-black">{d.dayNum}</span>
                          <span className="text-xs opacity-75">{d.monthName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block mb-2">
                    2. Kies een dagdeel
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {TIME_SLOTS.map((slot) => {
                      const isSel = bookingSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setBookingSlot(slot)}
                          aria-pressed={isSel}
                          className={`p-3.5 rounded-xl border-2 font-bold text-sm text-left cursor-pointer transition-all ${
                            isSel
                              ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                              : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase block mb-2">
                    3. Offerte ontvangen via
                  </span>
                  <div className="flex gap-2" role="group" aria-label="Kanaal voor de offerte">
                    {(['WhatsApp', 'E-mail', 'Allebei'] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        aria-pressed={channel === ch}
                        className={`h-11 px-4 rounded-xl border-2 text-sm font-bold cursor-pointer transition-all ${
                          channel === ch
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-transparent text-stone-700 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 mt-2 m-0" aria-live="polite">
                    {channel === 'WhatsApp'
                      ? 'We sturen de offerte naar je WhatsApp.'
                      : channel === 'E-mail'
                        ? 'We mailen de offerte naar je e-mailadres.'
                        : 'Je ontvangt de offerte via WhatsApp én e-mail.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="wizard-email" className="block text-sm font-bold text-stone-900 mb-1.5">
                    E-mailadres{channel === 'WhatsApp' ? ' (optioneel)' : ''}
                  </label>
                  <input
                    id="wizard-email"
                    type="email"
                    inputMode="email"
                    value={formData.email ?? ''}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    placeholder="naam@bedrijf.nl"
                    autoComplete="email"
                    aria-required={channel !== 'WhatsApp'}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'wizard-email-error' : undefined}
                    className={`w-full h-14 px-4 rounded-xl border-2 bg-white text-stone-900 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      errors.email ? 'border-rose-500' : 'border-stone-500'
                    }`}
                  />
                  {errors.email && (
                    <span id="wizard-email-error" role="alert" className="text-xs font-bold text-rose-600 mt-1 block">
                      {errors.email}
                    </span>
                  )}
                </div>

                <label className="min-h-11 flex items-center gap-3 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToCalendar}
                    onChange={(event) => setAddToCalendar(event.target.checked)}
                    className="sr-only peer text-base"
                  />
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-md border-2 border-stone-500 bg-white flex items-center justify-center text-xs font-bold text-transparent peer-checked:bg-stone-900 peer-checked:border-stone-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-stone-900 peer-focus-visible:ring-offset-2 shrink-0 transition-colors"
                  >
                    ✓
                  </span>
                  <span>
                    Zet de afspraak ook in mijn Google Agenda
                    <span className="text-stone-400">
                      {' '}
                      (optioneel — we vragen pas dan om in te loggen)
                    </span>
                  </span>
                </label>

                <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-stone-400">Jouw offerte:</span>
                  <strong className="text-stone-800 tabular-nums">
                    {quote.planName} + {quote.addons.length} extra · {formatEuro(quote.subtotal)}
                    <span className="text-stone-400 font-semibold"> excl. btw</span>
                  </strong>
                </div>

                <LeadHoneypot inputRef={lead.honeypotRef} />
                {lead.status === 'error' && lead.error && (
                  <LeadError
                    error={lead.error}
                    whatsappUrl={platformWhatsApp ? buildWhatsAppUrl(platformWhatsApp, quoteMessage) : null}
                    onWhatsAppClick={() => track('whatsapp_click', { source: 'wizard-error' })}
                  />
                )}

                <button
                  type="button"
                  onClick={handleSubmitQuote}
                  disabled={isBooking}
                  className="h-14 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-colors disabled:opacity-60"
                >
                  {isBooking ? 'Versturen…' : 'Offerte aanvragen'}
                </button>
                <button
                  type="button"
                  onClick={() => onViewPublishedSite(sector, styleIndex, formData)}
                  className="h-12 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer"
                >
                  Eerst je website bekijken
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMATION (own URL: /start/klaar) */}
          {step === 'klaar' && (
            <div className="bg-white p-8 rounded-3xl border border-stone-200 flex flex-col items-center text-center gap-5 shadow-xl animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-3xl shadow-lg pulse-glow">
                ✓
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 m-0">
                Offerte aangevraagd!
              </h1>
              <p className="text-stone-600 text-base max-w-md m-0">
                Bedankt{' '}
                <strong>
                  {bookingResult?.booking.clientName || formData.owner.trim() || baseSector.owner}
                </strong>
                . We spreken elkaar op{' '}
                <strong>{bookingResult?.booking.dateStr || bookingDate.formatted}</strong> (
                {bookingResult?.booking.timeSlot || bookingSlot}).
              </p>
              <ul className="w-full list-none m-0 p-0 flex flex-col gap-2 text-left text-sm">
                {quoteDelivery(channel).email && (
                  <li className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    {customerEmailSent ? (
                      <>
                        <strong>Gemaild</strong> naar {formData.email}, met de offerte als PDF.
                      </>
                    ) : mailPreview ? (
                      <>
                        <strong>Testmodus:</strong> er is niets echt gemaild (geen RESEND_API_KEY). Je
                        offerte staat hieronder klaar.
                      </>
                    ) : (
                      <>
                        <strong>Per e-mail:</strong> de bevestiging naar {formData.email} kon nu nog
                        niet worden afgeleverd. Je offerte staat hieronder klaar; wij sturen hem na.
                      </>
                    )}
                  </li>
                )}
                {quoteDelivery(channel).whatsapp && (
                  <li className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <strong>Via WhatsApp:</strong> we sturen de link naar je offerte naar {formData.phone}.
                  </li>
                )}
              </ul>

              <div className="w-full bg-stone-50 p-5 rounded-2xl border border-stone-200 text-left flex flex-col gap-3 text-xs sm:text-sm">
                <div className="flex justify-between border-b pb-2 border-stone-200">
                  <span className="text-stone-500">Referentie:</span>
                  <span className="font-mono font-bold">
                    {quoteReference ?? bookingResult?.booking.id ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2 border-stone-200">
                  <span className="text-stone-500">Offerte:</span>
                  <span className="font-bold tabular-nums">
                    {quote.planName} · {formatEuro(quote.subtotal)} (excl. btw)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Offerte via:</span>
                  <span className="font-bold">{channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Google Calendar:</span>
                  <span
                    className={`font-bold ${
                      bookingResult?.calendarSynced ? 'text-emerald-600' : 'text-stone-500'
                    }`}
                  >
                    {bookingResult?.calendarSynced
                      ? '✓ In je agenda gezet'
                      : addToCalendar
                        ? bookingResult?.syncError || 'Lokaal genoteerd'
                        : 'Niet gekoppeld (optioneel)'}
                  </span>
                </div>
              </div>

              {quoteUrl && (
                <div className="w-full flex flex-col sm:flex-row gap-2">
                  <a
                    href={quoteUrl}
                    className="flex-1 h-12 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 no-underline"
                  >
                    Bekijk je offerte {quoteReference}
                  </a>
                  <a
                    href={quoteUrl.replace('/offerte/', '/api/offerte/') + '&format=pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-12 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm inline-flex items-center justify-center gap-2 no-underline"
                  >
                    Download PDF
                  </a>
                </div>
              )}

              {authUser && (
                <div className="flex justify-between items-center text-xs text-stone-500 w-full">
                  <span>
                    Ingelogd als: <strong>{authUser.email}</strong>
                  </span>
                  <button
                    onClick={logoutGoogle}
                    className="text-rose-600 underline cursor-pointer bg-none border-0 p-0"
                  >
                    Uitloggen
                  </button>
                </div>
              )}

              <div className="pt-3 w-full flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => onViewPublishedSite(sector, styleIndex, formData)}
                  className="h-14 px-8 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-transform hover:-translate-y-0.5"
                >
                  Bekijk je website →
                </button>
                <button
                  onClick={onGoHome}
                  className="h-14 px-6 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer"
                >
                  Terug naar Klusbaas
                </button>
              </div>
            </div>
          )}

          {/* Preview toggle for small screens */}
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            aria-expanded={previewOpen}
            aria-controls="wizard-preview"
            className="lg:hidden h-12 rounded-full border-2 border-stone-900 bg-white text-stone-900 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            {previewOpen ? (
              <>
                <EyeOff className="w-4 h-4" aria-hidden="true" />
                Live voorbeeld sluiten
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" aria-hidden="true" />
                Bekijk je website live
              </>
            )}
          </button>

          {/* Spacer so the sticky mobile action bar never covers content */}
          {!isPublished && (
            <div
              className="lg:hidden h-[calc(0.5rem+env(safe-area-inset-bottom))]"
              aria-hidden="true"
            />
          )}

          {/* Navigation Controls — sticky on phones so "next" is always reachable */}
          {!isPublished && (
            <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 flex items-center gap-3 border-t border-stone-200 bg-stone-100/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pt-3 sm:pb-0 sm:backdrop-blur-none">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="h-14 px-6 rounded-full border-2 border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-base cursor-pointer transition-colors"
                >
                  ← Terug
                </button>
              )}
              <button
                onClick={step === 'afspraak' ? handleSubmitQuote : handleNext}
                disabled={step === 'afspraak' && isBooking}
                className="flex-1 h-14 rounded-full border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-base cursor-pointer shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                {step === 'afspraak' ? (isBooking ? 'Versturen…' : 'Offerte aanvragen →') : 'Volgende stap →'}
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Full live render of the generated website */}
        {showPreview && (
          <div className="lg:col-span-6 flex flex-col gap-3 w-full max-w-2xl mx-auto lg:max-w-none lg:mx-0 lg:sticky lg:top-24">
            <div id="wizard-preview" className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono font-semibold text-stone-500">
                <span>LIVE WEBSITE VOORBEELD</span>
                <span>
                  {STYLES[styleIndex].name} · {liveSite.name}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-stone-300/80 shadow-2xl max-h-[calc(100vh-7rem)] overflow-y-auto bg-white">
                <SiteView
                  site={liveSite}
                  selectedSector={sector}
                  selectedStyleIndex={styleIndex}
                  isCustomized={false}
                  embedded
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
