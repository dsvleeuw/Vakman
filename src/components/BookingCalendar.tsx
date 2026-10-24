import React, { useState, useEffect, useRef } from 'react';
import type { ActiveSiteData, AppointmentBooking } from '../types';
import {
  signInWithGoogle,
  createGoogleCalendarEvent,
  uploadQuoteToGoogleDrive,
  buildQuoteTextSummary,
  initAuthListener,
  logoutGoogle,
  isGoogleConfigured,
} from '../utils/googleWorkspace';
import type { User } from 'firebase/auth';
import { buildSiteWhatsAppUrl, normalizeDutchPhone } from '../utils/contact';
import { describeDelivery } from '../utils/leadClient';
import { useLeadForm } from '../hooks/useLeadForm';
import { PrivacyNote } from './PrivacyNote';
import { HoneypotField, LeadErrorNotice } from './LeadStatus';
import { buildNextDates, generateAppointmentId, saveAppointment, TIME_SLOTS, type TimeSlot } from '../utils/appointments';

interface BookingCalendarProps {
  site: ActiveSiteData;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ site }) => {
  // Generate next 14 available dates, skipping weekends
  const dates = buildNextDates(14);

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>(TIME_SLOTS[0]);
  const [selectedService, setSelectedService] = useState(
    site.services[0]?.n || 'Algemeen adviesgesprek'
  );

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // `isGoogleConfigured()` reads a Vite-only config source, so keep it out of the
  // render pass: SSR/prerender and the first client render both start hidden.
  const [googleConfigured, setGoogleConfigured] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    booking: AppointmentBooking;
    calendarSynced: boolean;
    driveSynced: boolean;
    syncError?: string;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const lead = useLeadForm('booking-calendar');

  const fallbackWaUrl = buildSiteWhatsAppUrl(
    site.contactPhone,
    [
      `Hallo ${site.biz}, ik wil graag een afspraak voor ${selectedService}.`,
      `Voorkeur: ${selectedDate.formatted}, ${selectedSlot}`,
      clientName.trim() ? `Naam: ${clientName.trim()}` : '',
      clientAddress.trim() ? `Adres: ${clientAddress.trim()}` : '',
      notes.trim() ? `Klus: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  );

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

  // Google Agenda/Drive is only offered when the deployed Firebase config is real.
  useEffect(() => {
    setGoogleConfigured(isGoogleConfigured());
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!clientName.trim()) errs.name = 'Vul je naam in';
    if (!normalizeDutchPhone(clientPhone)) {
      errs.phone = 'Gebruik een geldig nummer (bijv. 06 12345678 of +31 6 12345678)';
    }
    if (!clientAddress.trim()) errs.address = 'Vul je adres in';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Remembers which button started the last attempt, so 'Opnieuw proberen' repeats it.
  const lastSyncRef = useRef(false);

  const handleBook = async (withGoogleSync = false) => {
    lastSyncRef.current = withGoogleSync;
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);

    // The request itself goes to /api/lead first; Google sync is optional extra.
    const response = await lead.submit({
      type: 'appointment',
      site: { biz: site.biz, sector: site.id, style: site.styleName },
      fields: {
        name: clientName,
        phone: clientPhone,
        address: clientAddress,
        service: selectedService,
        date: selectedDate.formatted,
        slot: selectedSlot,
        notes,
      },
    });
    if (!response.ok) {
      setIsSubmitting(false);
      return;
    }

    let currentToken = accessToken;
    let currentUser = authUser;

    if (withGoogleSync && !currentToken && isGoogleConfigured()) {
      try {
        const authRes = await signInWithGoogle();
        if (authRes) {
          currentToken = authRes.accessToken;
          currentUser = authRes.user;
          setAuthUser(currentUser);
          setAccessToken(currentToken);
        }
      } catch (err) {
        console.error('Inloggen mislukt:', err);
        setIsSubmitting(false);
        return;
      }
    }

    const booking: AppointmentBooking = {
      id: response.reference ?? generateAppointmentId(),
      sectorId: site.id,
      bizName: site.biz,
      serviceName: selectedService,
      dateStr: selectedDate.formatted,
      timeSlot: selectedSlot,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      notes: notes.trim(),
      createdAt: Date.now(),
    };

    saveAppointment(booking);

    let calendarSynced = false;
    let driveSynced = false;
    let syncError: string | undefined = undefined;

    if (currentToken && withGoogleSync && isGoogleConfigured()) {
      // 1. Calendar Sync
      const startHour = selectedSlot.includes('Ochtend')
        ? '08:30:00'
        : selectedSlot.includes('Middag')
        ? '12:30:00'
        : '16:30:00';
      const endHour = selectedSlot.includes('Ochtend')
        ? '12:00:00'
        : selectedSlot.includes('Middag')
        ? '16:00:00'
        : '19:30:00';

      const calRes = await createGoogleCalendarEvent(currentToken, {
        summary: `Afspraak: ${site.biz} - ${selectedService}`,
        location: clientAddress,
        description: `Klant: ${clientName} (${clientPhone})\nVakman: ${site.owner} (${site.phone})\nNotities: ${notes}`,
        startTimeIso: `${selectedDate.iso}T${startHour}`,
        endTimeIso: `${selectedDate.iso}T${endHour}`,
      });

      if (calRes.success) {
        calendarSynced = true;
        booking.googleCalendarEventId = calRes.eventId;
      } else {
        syncError = calRes.error;
      }

      // 2. Drive Upload
      const textContent = buildQuoteTextSummary(
        site.biz,
        site.owner,
        site.phone,
        site.city,
        clientName,
        clientPhone,
        selectedService,
        selectedDate.formatted,
        selectedSlot,
        'Zie tariefkaart',
        notes
      );

      const driveRes = await uploadQuoteToGoogleDrive(
        currentToken,
        `Offerte_${site.biz}_${booking.id}.txt`,
        textContent
      );

      if (driveRes.success) {
        driveSynced = true;
        booking.googleDriveFileId = driveRes.fileId;
      }
    }

    setBookingResult({
      booking,
      calendarSynced,
      driveSynced,
      syncError,
    });
    setIsSubmitting(false);
  };

  const handleDownloadTextQuote = () => {
    if (!bookingResult) return;
    const { booking } = bookingResult;
    const content = buildQuoteTextSummary(
      site.biz,
      site.owner,
      site.phone,
      site.city,
      booking.clientName,
      booking.clientPhone,
      booking.serviceName,
      booking.dateStr,
      booking.timeSlot,
      'Op aanvraag',
      booking.notes
    );

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Offerte_${site.biz}_${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="afspraak" className="py-10 sm:py-24 px-4 sm:px-8 md:px-12 border-t border-stone-200/60 scroll-mt-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs font-semibold tracking-wider text-stone-500 uppercase">
              AFSPRAAK INPLANNEN
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black leading-tight tracking-tight m-0"
              style={{
                fontFamily: site.display,
                fontWeight: site.dw,
                letterSpacing: site.ls,
              }}
            >
              Plan direct een afspraak in
            </h2>
          </div>
          <span className="text-sm font-medium text-stone-500">
            {site.owner.split(' ')[0]} komt vrijblijvend langs voor inmeten en advies.
          </span>
        </div>

        {!bookingResult && !mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="sm:hidden h-13 px-6 font-extrabold text-base cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm"
            style={{
              background: site.accent,
              color: site.onAccent,
              borderRadius: site.radius,
              border: 0,
            }}
          >
            Kies een datum & tijdstip →
          </button>
        )}

        {!bookingResult ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleBook(false);
            }}
            noValidate
            className={`${mobileOpen ? 'grid' : 'hidden sm:grid'} grid-cols-1 lg:grid-cols-12 gap-8 items-start`}
          >
            {/* Step 1: Date & Time Slot Picker */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">
                  1. Kies een datum (komende 2 weken)
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {dates.map((d) => {
                    const isSelected = selectedDate.iso === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`p-2.5 rounded-xl border-2 text-center cursor-pointer flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-sm'
                            : 'border-stone-500 bg-white text-stone-800 hover:border-stone-700'
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
                <label className="block text-sm font-bold text-stone-900 mb-2">
                  2. Kies een dagdeel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-xl border-2 font-bold text-sm text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                            : 'border-stone-500 bg-white text-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-900 mb-2">
                  3. Voor welke dienst?
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-stone-500 bg-white text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900"
                >
                  {site.services.map((sv) => (
                    <option key={sv.n} value={sv.n}>
                      {sv.n} ({sv.p})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Contact Form & Google Sync CTA */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-stone-500 shadow-lg flex flex-col gap-4">
              <h3 className="text-xl font-bold text-stone-900 m-0">4. Jouw gegevens</h3>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Je naam *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="bijv. Sanne de Jong"
                  className={`w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none ${
                    errors.name ? 'border-rose-500' : 'border-stone-500 focus:border-stone-900'
                  }`}
                />
                {errors.name && (
                  <span className="text-xs text-rose-600 font-bold block mt-1">{errors.name}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Telefoonnummer *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={`w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none ${
                    errors.phone ? 'border-rose-500' : 'border-stone-500 focus:border-stone-900'
                  }`}
                />
                {errors.phone && (
                  <span className="text-xs text-rose-600 font-bold block mt-1">{errors.phone}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Adres / Plaats *
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Kerkstraat 12, Utrecht"
                  className={`w-full h-12 px-4 rounded-xl border-2 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none ${
                    errors.address ? 'border-rose-500' : 'border-stone-500 focus:border-stone-900'
                  }`}
                />
                {errors.address && (
                  <span className="text-xs text-rose-600 font-bold block mt-1">{errors.address}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Omschrijving klus (optioneel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bijv. 3 kozijnen aan de voorzijde schilderen"
                  rows={2}
                  className="w-full p-3 rounded-xl border-2 border-stone-500 bg-stone-50 text-stone-900 font-semibold text-base focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="relative flex flex-col gap-2.5 pt-2">
                <HoneypotField value={lead.honeypot} onChange={lead.setHoneypot} />
                {lead.status === 'error' && (
                  <LeadErrorNotice
                    message={lead.result?.error}
                    whatsappUrl={fallbackWaUrl}
                    onRetry={() => handleBook(lastSyncRef.current)}
                  />
                )}
                {googleConfigured && (
                  <button
                    type="button"
                    onClick={() => handleBook(true)}
                    disabled={isSubmitting}
                    className="h-14 px-6 rounded-2xl border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm sm:text-base cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" />
                    </svg>
                    {isSubmitting ? 'Versturen…' : 'Inplannen & Sync met Google Calendar'}
                  </button>
                )}

                {googleConfigured ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-4 rounded-xl border border-stone-500 bg-transparent hover:bg-stone-100 text-stone-700 font-bold text-xs cursor-pointer"
                  >
                    Inplannen zonder Google Account
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 px-6 rounded-2xl border-0 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm sm:text-base cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  >
                    {isSubmitting ? 'Versturen…' : 'Afspraak inplannen'}
                  </button>
                )}
                <PrivacyNote className="text-stone-500 text-center" />
              </div>

              {authUser && (
                <div className="flex justify-between items-center text-xs text-stone-500 pt-2 border-t border-stone-100">
                  <span>Ingelogd als: <strong>{authUser.email}</strong></span>
                  <button type="button" onClick={logoutGoogle} className="text-rose-600 underline cursor-pointer bg-none border-0 p-0">
                    Uitloggen
                  </button>
                </div>
              )}
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-500 shadow-xl flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-lg pulse-glow">
              ✓
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 m-0">
                Afspraak aangevraagd!
              </h3>
              <p className="text-stone-600 text-base m-0">
                Bedankt <strong>{bookingResult.booking.clientName}</strong>. Jouw afspraak voor{' '}
                <strong>{bookingResult.booking.serviceName}</strong> staat genoteerd op{' '}
                <strong>{bookingResult.booking.dateStr}</strong> ({bookingResult.booking.timeSlot}).{' '}
                {site.owner.split(' ')[0]} bevestigt het moment zo snel mogelijk.
              </p>
              {lead.result && (
                <p className="text-stone-500 text-sm m-0" aria-live="polite">
                  {describeDelivery(lead.result)}
                </p>
              )}
            </div>

            <div className="w-full bg-stone-50 p-5 rounded-2xl border border-stone-200 text-left flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b pb-2 border-stone-200">
                <span className="text-stone-500">Referentie:</span>
                <span className="font-mono font-bold">{bookingResult.booking.id}</span>
              </div>
              {googleConfigured && (
                <>
                  <div className="flex justify-between border-b pb-2 border-stone-200">
                    <span className="text-stone-500">Google Calendar Sync:</span>
                    <span className={`font-bold ${bookingResult.calendarSynced ? 'text-emerald-600' : 'text-stone-500'}`}>
                      {bookingResult.calendarSynced ? '✓ Gesynchroniseerd' : 'Niet gekoppeld'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Google Drive Quote PDF:</span>
                    <span className={`font-bold ${bookingResult.driveSynced ? 'text-emerald-600' : 'text-stone-500'}`}>
                      {bookingResult.driveSynced ? '✓ Opgeslagen in Drive' : 'Niet gekoppeld'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 flex-wrap justify-center pt-2">
              <button
                type="button"
                onClick={handleDownloadTextQuote}
                className="h-12 px-6 rounded-full border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm cursor-pointer shadow-sm"
              >
                📥 Download Offerte .TXT
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingResult(null);
                  lead.reset();
                }}
                className="h-12 px-6 rounded-full border-0 bg-stone-900 text-white font-bold text-sm cursor-pointer"
              >
                Nieuwe afspraak maken
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
