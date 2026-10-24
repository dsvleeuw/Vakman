import type { AppointmentBooking } from '../types';
import type { CalendarEventPayload } from './googleWorkspace';

export type TimeSlot =
  | 'Ochtend (08:30 - 12:00)'
  | 'Middag (12:30 - 16:00)'
  | 'Avond (16:30 - 19:30)';

export const TIME_SLOTS: TimeSlot[] = [
  'Ochtend (08:30 - 12:00)',
  'Middag (12:30 - 16:00)',
  'Avond (16:30 - 19:30)',
];

/** Map a time slot label to its start/end clock times (used for calendar events). */
export function slotToHours(slot: TimeSlot): { start: string; end: string } {
  if (slot.startsWith('Ochtend')) return { start: '08:30:00', end: '12:00:00' };
  if (slot.startsWith('Middag')) return { start: '12:30:00', end: '16:00:00' };
  return { start: '16:30:00', end: '19:30:00' };
}

/**
 * Pure builder for a Google Calendar event payload describing a Klusbaas
 * intake appointment. Kept free of `Date`/`window` so it can be unit tested.
 */
export function buildAppointmentCalendarPayload(input: {
  bizName: string;
  owner: string;
  phone: string;
  city: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  dateIso: string;
  slot: TimeSlot;
  notes?: string;
}): CalendarEventPayload {
  const { start, end } = slotToHours(input.slot);
  return {
    summary: `Afspraak: ${input.bizName} - ${input.serviceName}`,
    location: input.city,
    description: `Klant: ${input.clientName} (${input.clientPhone})\nVakman: ${input.owner} (${input.phone})\nNotities: ${
      input.notes || '-'
    }`,
    startTimeIso: `${input.dateIso}T${start}`,
    endTimeIso: `${input.dateIso}T${end}`,
  };
}

export function generateAppointmentId(): string {
  return 'KB-' + Date.now().toString(36).toUpperCase();
}

const STORAGE_KEY = 'klusbaas_appointments';

export function saveAppointment(booking: AppointmentBooking): void {
  try {
    const existing = loadAppointments();
    existing.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable (private mode / SSR) — booking still returns in memory
  }
}

export function loadAppointments(): AppointmentBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppointmentBooking[]) : [];
  } catch {
    return [];
  }
}

/** Local YYYY-MM-DD; toISOString() would shift to the previous day before 02:00 in NL. */
function localIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The next `count` working days (Mon–Fri) after `from`; Saturdays and Sundays are skipped. */
export function buildNextDates(count = 14, from: Date = new Date()) {
  const days: Date[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
  }
  return days.map((d) => {
    return {
      iso: localIsoDate(d),
      dayName: d.toLocaleDateString('nl-NL', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('nl-NL', { month: 'short' }),
      formatted: d.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    };
  });
}
