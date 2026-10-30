/**
 * De tuinprijs van de hovenier.
 *
 * De bezoeker geeft de grootte van de tuin en het werk dat hij wil laten
 * doen. Voor het werk waar een prijs per m² staat, komt daar meteen een
 * indicatie uit. Voor het werk zonder prijs per m² zegt de pagina eerlijk
 * dat de prijs op aanvraag is: een verzonnen bedrag zou een belofte zijn
 * die de hovenier niet heeft gedaan.
 */

/** The work the gardener does, with his own price per m² where he has one. */
export interface GardenService {
  /** The name of the work, as the gardener wrote it. */
  name: string;
  /** The price per m² in euros, when the work has one. */
  pricePerM2?: number;
}

/** The size of a garden in m². */
export function parseGardenSize(value: string): number {
  const cleaned = value.replace(',', '.').replace(/[^\d.\-]/g, '');
  // Een minteken is geen tuin: weggooien.
  if (cleaned.includes('-')) return 0;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 10) / 10;
}

/**
 * The price indication: the size times the price per m². Without a price
 * per m² there is no indication: the gardener prices that work himself.
 */
export function gardenEstimate(sizeM2: number, service: GardenService): number | null {
  if (!service.pricePerM2 || !Number.isFinite(sizeM2) || sizeM2 <= 0) return null;
  return Math.round(sizeM2 * service.pricePerM2);
}

/** The estimate as the visitor reads it: `€ 580`. */
export function formatGardenEstimate(euros: number | null): string {
  if (euros === null) return '';
  return `€ ${Math.round(euros).toLocaleString('nl-NL')}`;
}
