/**
 * The work area of a craftsman: the postcodes where he works.
 *
 * The postcode check on a page only means something when the areas belong
 * to the craftsman. The trade preset carries the areas of the example
 * (around the city of the sector); on a published page those are somebody
 * else's area, so the check stays off the page until the craftsman writes
 * down his own postcodes.
 */

/** The postcodes as the craftsman typed them, cleaned up. */
export function parseWorkArea(text: string): string[] {
  return (text ?? '')
    .split(/[,;\n]+/)
    .map((part) => part.trim().toUpperCase())
    .filter((part) => /^\d{4}\s?[A-Z]{0,2}$/.test(part))
    // Dutch notation: four digits, a space and two letters.
    .map((part) => part.replace(/^(\d{4})\s*([A-Z]{0,2})$/, (_, digits, letters) =>
      letters ? `${digits} ${letters}` : digits
    ));
}

/** The first two digits of every postcode: the area a postcode belongs to. */
export function areaPrefixes(postcodes: string[]): string[] {
  const prefixes = new Set<string>();
  for (const postcode of postcodes) {
    const digits = postcode.replace(/\D/g, '').slice(0, 2);
    if (digits.length === 2) prefixes.add(digits);
  }
  return [...prefixes];
}

/** The work area as one line, for the editor and for the page. */
export function formatWorkArea(postcodes: string[]): string {
  return postcodes.join(', ');
}
