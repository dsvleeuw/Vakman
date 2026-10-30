/**
 * CSV, zo dat Klusbaas zijn aanvragen en offertes in Excel kan zetten.
 *
 * Nederlands Excel verwacht een puntkomma als scheiding en een komma in
 * het decimalteken. Daarom staat er een puntkomma tussen de kolommen en
 * krijgt elk veld zijn komma's en puntkomma's tussen aanhalingstekens.
 */

const SEPARATOR = ';';

/** One value in a CSV: quotes around it, and the quotes inside doubled. */
export function escapeCsvValue(value: unknown): string {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",;\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** The rows of a table as one CSV text, with the first row as the header. */
export function toCsv(rows: (string | number | undefined | null)[][]): string {
  return rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(SEPARATOR)).join('\r\n');
}

/**
 * The name of the file: `aanvragen-2026-10-30.csv`. The date makes it clear
 * when the file was made.
 */
export function csvFilename(base: string, now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `${base}-${stamp}.csv`;
}

/**
 * The content of a CSV file for the browser: a BOM so Excel reads the
 * UTF-8 (the Dutch letters would go wrong without it).
 */
export function csvFileContent(rows: (string | number | undefined | null)[][]): string {
  return `﻿${toCsv(rows)}`;
}
