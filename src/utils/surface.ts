/**
 * Pure calculation helpers for the painter's m² calculator.
 * Kept framework-free so the pricing logic is unit testable.
 */

export interface WallDimensions {
  length: number;
  height: number;
}

/** Standard surface deduction per door/window opening, in m². */
export const OPENING_DEDUCTION_M2 = 2;

/**
 * Parse a service price label such as "€ 18 per m²" into a number.
 * Returns null when the label does not contain a per-m² price.
 */
export function parsePricePerM2(priceLabel: string): number | null {
  if (!priceLabel) return null;
  const match = priceLabel.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*per m²/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * Total paintable surface: sum of wall (length x height) minus a fixed
 * deduction for every door/window opening. Never returns below zero.
 */
export function calculateSurfaceArea(
  walls: WallDimensions[],
  openings = 0
): number {
  const gross = walls.reduce(
    (sum, wall) =>
      sum +
      Math.max(0, wall.length || 0) * Math.max(0, wall.height || 0),
    0
  );
  const deduction = Math.max(0, openings) * OPENING_DEDUCTION_M2;
  return Math.max(0, gross - deduction);
}

/**
 * Round the m² estimate to whole euros, matching the platform's house style.
 */
export function calculateM2Estimate(surfaceM2: number, pricePerM2: number): number {
  return Math.round(Math.max(0, surfaceM2) * Math.max(0, pricePerM2));
}
