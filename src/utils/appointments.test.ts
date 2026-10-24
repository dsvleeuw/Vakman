import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slotToHours,
  buildAppointmentCalendarPayload,
  TIME_SLOTS,
} from './appointments';

test('slotToHours maps each slot to its start and end times', () => {
  assert.deepEqual(slotToHours('Ochtend (08:30 - 12:00)'), {
    start: '08:30:00',
    end: '12:00:00',
  });
  assert.deepEqual(slotToHours('Middag (12:30 - 16:00)'), {
    start: '12:30:00',
    end: '16:00:00',
  });
  assert.deepEqual(slotToHours('Avond (16:30 - 19:30)'), {
    start: '16:30:00',
    end: '19:30:00',
  });
});

test('buildAppointmentCalendarPayload builds summary, location and full ISO range', () => {
  const payload = buildAppointmentCalendarPayload({
    bizName: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    phone: '06 12 34 56 78',
    city: 'Utrecht',
    clientName: 'Sanne de Jong',
    clientPhone: '06 98 76 54 32',
    serviceName: 'Kozijnen',
    dateIso: '2026-11-02',
    slot: 'Middag (12:30 - 16:00)',
    notes: '3 kozijnen voorzijde',
  });
  assert.equal(payload.summary, 'Afspraak: Houtwerk De Vries - Kozijnen');
  assert.equal(payload.location, 'Utrecht');
  assert.equal(payload.startTimeIso, '2026-11-02T12:30:00');
  assert.equal(payload.endTimeIso, '2026-11-02T16:00:00');
});

test('buildAppointmentCalendarPayload includes client, vakman and notes', () => {
  const payload = buildAppointmentCalendarPayload({
    bizName: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    phone: '06 12 34 56 78',
    city: 'Utrecht',
    clientName: 'Sanne de Jong',
    clientPhone: '06 98 76 54 32',
    serviceName: 'Kozijnen',
    dateIso: '2026-11-02',
    slot: 'Middag (12:30 - 16:00)',
    notes: '3 kozijnen voorzijde',
  });
  assert.ok((payload.description ?? '').includes('Klant: Sanne de Jong (06 98 76 54 32)'));
  assert.ok((payload.description ?? '').includes('Vakman: Jan de Vries (06 12 34 56 78)'));
  assert.ok((payload.description ?? '').includes('Notities: 3 kozijnen voorzijde'));
});

test('buildAppointmentCalendarPayload falls back to a dash when notes are omitted', () => {
  const payload = buildAppointmentCalendarPayload({
    bizName: 'Houtwerk De Vries',
    owner: 'Jan de Vries',
    phone: '06 12 34 56 78',
    city: 'Utrecht',
    clientName: 'Sanne de Jong',
    clientPhone: '06 98 76 54 32',
    serviceName: 'Kozijnen',
    dateIso: '2026-11-02',
    slot: 'Middag (12:30 - 16:00)',
  });
  assert.ok((payload.description ?? '').includes('Notities: -'));
});

test('TIME_SLOTS exposes the three expected slots', () => {
  assert.deepEqual(TIME_SLOTS, [
    'Ochtend (08:30 - 12:00)',
    'Middag (12:30 - 16:00)',
    'Avond (16:30 - 19:30)',
  ]);
});
