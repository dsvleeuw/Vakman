import test from 'node:test';
import assert from 'node:assert/strict';
import { RETENTION_MONTHS, planRetention, retentionCutoff, runRetention } from './retention';
import type { StoredLead } from '../types';

/**
 * De bewaartermijn van de aanvragen.
 *
 * In de privacyverklaring staat dat Klusbaas een aanvraag twaalf maanden
 * bewaart. Deze tests bewaken dat die belofte klopt.
 */

const NOW = Date.parse('2026-10-30T12:00:00.000Z');

const lead = (reference: string, createdAt: string): StoredLead =>
  ({
    reference,
    type: 'contact',
    createdAt,
    site: { biz: 'Test', sector: 'schilder' },
    fields: { name: 'Sanne', phone: '0612345678', email: 'sanne@example.com', message: 'Hoi' },
  }) as StoredLead;

test('de termijn is twaalf maanden', () => {
  assert.equal(RETENTION_MONTHS, 12);
});

test('de grens ligt twaalf maanden terug', () => {
  assert.equal(retentionCutoff(NOW), Date.parse('2025-10-30T12:00:00.000Z'));
});

test('de grens is een kalendermaand, geen jaar van dagen', () => {
  // 1 maart 2025 plus 12 maanden is 1 maart 2026, ook in een schrikkeljaar.
  assert.equal(retentionCutoff(Date.parse('2026-03-01T00:00:00.000Z')), Date.parse('2025-03-01T00:00:00.000Z'));
});

test('alleen de aanvragen ouder dan de termijn gaan weg', () => {
  const leads = [
    lead('L-OUDE01', '2024-05-01T10:00:00.000Z'),
    lead('L-NIEUW01', '2026-09-01T10:00:00.000Z'),
    lead('L-RAUW01', '2026-10-30T11:00:00.000Z'),
  ];
  const plan = planRetention(leads, NOW);
  assert.deepEqual(
    plan.expired.map((record) => record.reference),
    ['L-OUDE01']
  );
  assert.equal(plan.kept, 2);
});

test('een aanvraag zonder datum blijft: weggooien zonder te weten is niet netjes', () => {
  const plan = planRetention([lead('L-RAUW02', 'geen datum')], NOW);
  assert.equal(plan.expired.length, 0);
  assert.equal(plan.kept, 1);
});

test('de opruiming verwijdert de oude aanvragen en houdt de rest', async () => {
  const leads = [
    lead('L-OUDE02', '2023-01-01T10:00:00.000Z'),
    lead('L-OUDE03', '2024-12-31T23:59:00.000Z'),
    lead('L-NIEUW02', '2026-01-01T10:00:00.000Z'),
  ];
  const removed: string[] = [];
  const result = await runRetention(
    {
      leads: {
        async listLeads() {
          return leads;
        },
        async deleteLead(reference) {
          removed.push(reference);
        },
      },
    },
    NOW
  );

  assert.deepEqual(removed.sort(), ['L-OUDE02', 'L-OUDE03']);
  assert.equal(result.removed, 2);
  assert.equal(result.kept, 1);
});

test('één aanvraag die niet weg gaat, houdt de rest niet tegen', async () => {
  const result = await runRetention(
    {
      leads: {
        async listLeads() {
          return [lead('L-OUDE04', '2023-01-01T10:00:00.000Z'), lead('L-OUDE05', '2023-02-01T10:00:00.000Z')];
        },
        async deleteLead(reference) {
          if (reference === 'L-OUDE04') throw new Error('opslag gaat niet');
        },
      },
    },
    NOW
  );
  assert.equal(result.removed, 1);
});
