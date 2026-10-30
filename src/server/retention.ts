import type { StoredLead } from '../types';

/**
 * De bewaartermijn van een aanvraag.
 *
 * In de privacyverklaring staat dat een aanvraag twaalf maanden wordt
 * bewaard. Deze module is de taal van die belofte: hij bepaalt wat er te
 * oud is, en hij ruimt het op. De belofte staat op papier; hier staat de
 * uitvoering.
 */

/** Hoe lang een aanvraag bewaard wordt, in maanden. */
export const RETENTION_MONTHS = 12;

/**
 * Het moment waarop de bewaartermijn begint: twaalf maanden geleden.
 *
 * Klokken met maanden zijn niet gelijk aan maanden van dagen, dus het is
 * een echte kalendermaand: 30 juni 2025 valt buiten de termijn op 30 juni
 * 2026.
 */
export function retentionCutoff(now: number, months: number = RETENTION_MONTHS): number {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date.getTime();
}

/** Wat er opgeruimd kan worden, en wat blijft. */
export interface RetentionPlan {
  /** De aanvragen die ouder zijn dan de bewaartermijn. */
  expired: StoredLead[];
  /** Het aantal aanvragen dat blijft. */
  kept: number;
  /** Het moment waarop de termijn begon. */
  cutoff: number;
}

/**
 * Welke aanvragen zijn te oud? Een aanvraag zonder datum blijft: we weten
 * niet hoe oud hij is, en weggooien zonder te weten is niet netjes.
 */
export function planRetention(leads: StoredLead[], now: number, months: number = RETENTION_MONTHS): RetentionPlan {
  const cutoff = retentionCutoff(now, months);
  const expired: StoredLead[] = [];
  let kept = 0;
  for (const lead of leads) {
    const created = Date.parse(lead.createdAt);
    if (Number.isFinite(created) && created < cutoff) {
      expired.push(lead);
    } else {
      kept += 1;
    }
  }
  return { expired, kept, cutoff };
}

/** The result of a clean-up. */
export interface RetentionResult {
  /** How many requests were removed. */
  removed: number;
  /** How many requests stay. */
  kept: number;
  /** The moment the term started. */
  cutoff: number;
}

/**
 * The clean-up itself: everything that is too old goes, the rest stays.
 * One request that cannot be deleted does not stop the others.
 */
export async function runRetention(
  deps: { leads: { listLeads(): Promise<StoredLead[]>; deleteLead(reference: string): Promise<void> } },
  now: number = Date.now(),
  months: number = RETENTION_MONTHS
): Promise<RetentionResult> {
  const plan = planRetention(await deps.leads.listLeads(), now, months);
  let removed = 0;
  for (const lead of plan.expired) {
    try {
      await deps.leads.deleteLead(lead.reference);
      removed += 1;
    } catch {
      // Eén aanvraag die niet weg gaat, mag de rest niet tegenhouden.
    }
  }
  return { removed, kept: plan.kept, cutoff: plan.cutoff };
}
