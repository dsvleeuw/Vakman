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

/** Generate the next `count` available dates starting tomorrow. */
export function buildNextDates(count = 14) {
  return Array.from({ length: count }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      iso: d.toISOString().split('T')[0],
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
