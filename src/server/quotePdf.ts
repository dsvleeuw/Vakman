import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { PLATFORM_CONTACT } from '../data/platform';
import { formatDutchDate, formatEuroCents, type QuoteDocument } from '../utils/quote';

/**
 * Render a quote as a one- or two-page A4 PDF. Uses the built-in Helvetica
 * (WinAnsi), so no font files ship with the function; characters outside
 * that set are replaced instead of crashing the request.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.47, 0.44, 0.42);
const LINE = rgb(0.9, 0.89, 0.88);
const ACCENT = rgb(0.98, 0.75, 0.14);

function winAnsiSafe(font: PDFFont, text: string): string {
  let out = '';
  for (const char of text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')) {
    try {
      font.encodeText(char);
      out += char;
    } catch {
      out += char === '−' || char === '–' || char === '—' ? '-' : '?';
    }
  }
  return out;
}

/** Greedy word wrap for a given width. */
function wrap(font: PDFFont, text: string, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function renderQuotePdf(doc: QuoteDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Offerte ${doc.number}`);
  pdf.setAuthor('Klusbaas');
  pdf.setSubject(`Offerte voor ${doc.customer.biz}`);
  pdf.setLanguage('nl-NL');
  pdf.setCreationDate(new Date(doc.issuedAt));

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = pdf.addPage(A4);
  let y = A4[1] - MARGIN;
  const right = A4[0] - MARGIN;
  const contentWidth = right - MARGIN;

  const text = (value: string, x: number, size: number, font = regular, color = INK) =>
    page.drawText(winAnsiSafe(font, value), { x, y, size, font, color });
  const textRight = (value: string, x: number, size: number, font = regular, color = INK) => {
    const safe = winAnsiSafe(font, value);
    page.drawText(safe, { x: x - font.widthOfTextAtSize(safe, size), y, size, font, color });
  };
  const rule = (color = LINE, thickness = 1) =>
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness, color });
  const ensureSpace = (needed: number) => {
    if (y - needed > MARGIN + 40) return;
    page = pdf.addPage(A4);
    y = A4[1] - MARGIN;
  };

  // Header: word mark and quote meta
  page.drawRectangle({ x: MARGIN, y: y - 22, width: 22, height: 22, color: INK });
  page.drawText('K', { x: MARGIN + 6, y: y - 16, size: 14, font: bold, color: ACCENT });
  page.drawText('Klusbaas', { x: MARGIN + 30, y: y - 16, size: 16, font: bold, color: INK });
  y -= 6;
  textRight('OFFERTE', right, 20, bold);
  y -= 22;
  textRight(doc.number, right, 11, bold, MUTED);
  y -= 36;

  // Two columns: customer / dates
  const colRight = MARGIN + contentWidth / 2 + 20;
  const top = y;
  text('Voor', MARGIN, 9, bold, MUTED);
  y -= 15;
  for (const value of [doc.customer.biz, doc.customer.owner, doc.customer.city, doc.customer.phone, doc.customer.email]) {
    if (!value) continue;
    text(value, MARGIN, 10.5, value === doc.customer.biz ? bold : regular);
    y -= 14;
  }
  const leftBottom = y;
  y = top;
  const meta: [string, string][] = [
    ['Offertedatum', formatDutchDate(doc.issuedAt)],
    ['Geldig tot', formatDutchDate(doc.validUntil)],
    ['Vak', doc.sectorName],
    ['Stijl', doc.styleName],
  ];
  for (const [label, value] of meta) {
    text(label, colRight, 9, bold, MUTED);
    textRight(value, right, 10.5);
    y -= 15;
  }
  y = Math.min(leftBottom, y) - 18;

  // Lines table
  text('Omschrijving', MARGIN, 9, bold, MUTED);
  textRight('Bedrag (excl. btw)', right, 9, bold, MUTED);
  y -= 8;
  rule(INK, 1.2);
  y -= 18;
  for (const line of doc.lines) {
    const notes = line.note ? wrap(regular, line.note, 8.5, contentWidth - 130) : [];
    ensureSpace(24 + notes.length * 11);
    text(line.label, MARGIN, 10.5, bold);
    textRight(line.included ? 'inbegrepen' : formatEuroCents(line.amount), right, 10.5, line.included ? regular : bold, line.included ? MUTED : INK);
    for (const note of notes) {
      y -= 12;
      text(note, MARGIN, 8.5, regular, MUTED);
    }
    y -= 12;
    rule();
    y -= 18;
  }

  // Totals
  ensureSpace(90);
  const totalsX = MARGIN + contentWidth / 2;
  const totals: [string, string, boolean][] = [
    ['Subtotaal excl. btw', formatEuroCents(doc.subtotal), false],
    [`Btw ${Math.round(doc.vatRate * 100)}%`, formatEuroCents(doc.vat), false],
  ];
  for (const [label, value] of totals) {
    text(label, totalsX, 10.5, regular, MUTED);
    textRight(value, right, 10.5);
    y -= 16;
  }
  y += 4;
  page.drawLine({ start: { x: totalsX, y }, end: { x: right, y }, thickness: 1.2, color: INK });
  y -= 18;
  text('Totaal incl. btw', totalsX, 13, bold);
  textRight(formatEuroCents(doc.total), right, 13, bold);
  y -= 34;

  // Services and terms
  if (doc.services.length) {
    const serviceLines = wrap(regular, doc.services.join(', '), 9.5, contentWidth);
    ensureSpace(30 + serviceLines.length * 13);
    text('Diensten op je website', MARGIN, 9, bold, MUTED);
    y -= 14;
    for (const line of serviceLines) {
      text(line, MARGIN, 9.5);
      y -= 13;
    }
    y -= 10;
  }
  const terms = [
    `Alle bedragen zijn eenmalig. Prijzen excl. btw tenzij anders vermeld; btw ${Math.round(doc.vatRate * 100)}% is apart vermeld.`,
    `Deze offerte is geldig tot en met ${formatDutchDate(doc.validUntil)}.`,
    'Je website en de broncode zijn na oplevering van jou. Oplevering binnen 2 weken na akkoord.',
    doc.appointment
      ? `We bellen je op ${doc.appointment.date}${doc.appointment.slot ? ` (${doc.appointment.slot})` : ''} om alles door te nemen.`
      : 'We nemen binnen één werkdag contact met je op om alles door te nemen.',
  ];
  const termLines = terms.flatMap((term) => wrap(regular, term, 9, contentWidth));
  ensureSpace(30 + termLines.length * 12);
  text('Voorwaarden', MARGIN, 9, bold, MUTED);
  y -= 14;
  for (const line of termLines) {
    text(line, MARGIN, 9, regular, MUTED);
    y -= 12;
  }

  // Footer on every page
  for (const p of pdf.getPages()) {
    const footer = winAnsiSafe(regular, `Klusbaas · ${PLATFORM_CONTACT.email} · Offerte ${doc.number}`);
    p.drawText(footer, { x: MARGIN, y: MARGIN - 20, size: 8, font: regular, color: MUTED });
  }

  return pdf.save();
}

export const quotePdfFilename = (number: string) => `Offerte-${number}.pdf`;
