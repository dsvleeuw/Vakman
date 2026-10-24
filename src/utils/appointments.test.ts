import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slotToHours,
  buildAppointmentCalendarPayload,
  TIME_SLOTS,
  buildNextDates,
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

// Deterministic test using a fixed start date (Monday 2026-10-26)
test('buildNextDates returns exactly count weekdays skipping weekends', () => {
  // Start from a known Monday (2026-10-26 is a Monday)
  const from = new Date('2026-10-26T00:00:00');
  const dates = buildNextDates(5, from);
  assert.equal(dates.length, 5);

  // Check that all dates are weekdays (Monday=1 to Friday=5)
  dates.forEach((date) => {
    const d = new Date(date.iso + 'T00:00:00');
    const dayOfWeek = d.getDay();
    assert.ok(dayOfWeek >= 1 && dayOfWeek <= 5, `Date ${date.iso} is a weekend day (${dayOfWeek})`);
  });
});

test('buildNextDates returns 14 weekdays by default', () => {
  const from = new Date('2026-10-26T00:00:00');
  // No explicit count: exercises the default parameter (14 working days).
  const dates = buildNextDates(undefined, from);
  assert.equal(dates.length, 14);
  assert.equal(dates[0].iso, '2026-10-27');

  dates.forEach((date) => {
    const d = new Date(date.iso + 'T00:00:00');
    const dayOfWeek = d.getDay();
    assert.ok(dayOfWeek >= 1 && dayOfWeek <= 5, `Date ${date.iso} is a weekend day (${dayOfWeek})`);
  });

  // 14 working days after Monday 2026-10-26 end on Friday 2026-11-13.
  assert.equal(dates[dates.length - 1].iso, '2026-11-13');
});

test('buildNextDates skips Saturday and Sunday', () => {
  // Start from a Friday (2026-10-30) - next day is Saturday, should skip to Monday
  const from = new Date('2026-10-30T00:00:00');
  const dates = buildNextDates(7, from);
  assert.equal(dates.length, 7);
  assert.equal(dates[0].iso, '2026-11-02');

  // All should be weekdays
  dates.forEach((date) => {
    const d = new Date(date.iso + 'T00:00:00');
    const dayOfWeek = d.getDay();
    assert.notEqual(dayOfWeek, 0, 'Sunday should be skipped');
    assert.notEqual(dayOfWeek, 6, 'Saturday should be skipped');
  });
});

test('buildNextDates returns strictly increasing distinct dates', () => {
  const from = new Date('2026-10-26T00:00:00');
  const dates = buildNextDates(5, from);

  // Check dates are strictly increasing
  for (let i = 1; i < dates.length; i++) {
    assert.ok(dates[i].iso > dates[i - 1].iso, `Date ${i} (${dates[i].iso}) is not after date ${i-1} (${dates[i-1].iso})`);
  }
});

test('buildNextDates has correct date properties', () => {
  const from = new Date('2026-10-26T00:00:00');
  const dates = buildNextDates(2, from);
  assert.equal(dates.length, 2);

  dates.forEach((date) => {
    assert.ok(date.iso);
    assert.ok(date.dayName);
    assert.ok(date.dayNum > 0);
    assert.ok(date.monthName);
    assert.ok(date.formatted);
  });
});
