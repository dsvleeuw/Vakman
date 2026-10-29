import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { BRAND_MARK, BRAND_WORDMARK } from '../data/brandMark';
import type { InvoiceDetails, PaymentDetails } from '../types';
import { formatDutchDate, formatEuroCents, type QuoteRecord } from '../utils/quote';
import { invoiceNumberFor } from './invoice';
import { drawLogo, pdfSafe } from './quotePdf';

/**
 * The invoice (factuur) of a paid offer.
 *
 * The offer says what it costs; the invoice says what was paid. A
 * customer who runs his own business needs a document with his own details,
 * the amount, the VAT and the date of payment — and Klusbaas needs one for
 * his own administration.
 *
 * Everything about Klusbaas comes from the environment (`invoiceDetailsFromEnv`):
 * no KvK number, no VAT number and no address is invented here. What is not
 * set is not printed.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.45, 0.42, 0.4);
const LINE = rgb(0.9, 0.89, 0.88);
const ACCENT = rgb(0.85, 0.47, 0.02);
const GREEN = rgb(0.05, 0.45, 0.25);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

/**
 * The invoice for a paid offer. `paidAt` is the day the money came in; it
 * is the moment the invoice exists.
 */
export async function renderInvoicePdf(
  record: QuoteRecord,
  options: {
    invoice: InvoiceDetails;
    payment?: PaymentDetails;
    /** The day the payment arrived. Defaults to the record's `paidAt`. */
    paidAt?: string;
    /** The day the invoice is written; defaults to today. */
    issuedAt?: string;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const number = invoiceNumberFor(record.id);
  doc.setTitle(`Factuur ${number}`);
  doc.setAuthor(options.invoice.name);
  doc.setSubject(`Factuur ${number} voor ${pdfSafe(record.customer.biz)}`);
  doc.setLanguage('nl-NL');
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([A4.width, A4.height]);
  let y = A4.height - MARGIN;
  const right = A4.width - MARGIN;
  const contentWidth = right - MARGIN;

  const text = (value: string, x: number, size = 10, font = regular, color = INK) =>
    page.drawText(pdfSafe(value), { x, y, size, font, color });
  const textRight = (value: string, size = 10, font = regular, color = INK, at = right) =>
    page.drawText(pdfSafe(value), { x: at - font.widthOfTextAtSize(pdfSafe(value), size), y, size, font, color });
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 30) {
      page = doc.addPage([A4.width, A4.height]);
      y = A4.height - MARGIN;
    }
  };
  const rule = (color = LINE, thickness = 1) =>
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness, color });

  const paidAt = options.paidAt ?? record.paidAt ?? record.createdAt;
  const issuedAt = options.issuedAt ?? paidAt;

  // Header
  page.drawRectangle({ x: 0, y: A4.height - 6, width: A4.width, height: 6, color: ACCENT });
  drawLogo(page, MARGIN, y + 20);
  textRight('FACTUUR', 20, bold);
  y -= 16;
  text('Websites voor vakmensen in Haarlemmermeer en omstreken', MARGIN, 9, regular, MUTED);
  textRight(number, 11, bold, ACCENT);
  y -= 28;
  rule(INK, 1.5);
  y -= 22;

  // Sender (Klusbaas) on the left, customer on the right
  const colRight = MARGIN + contentWidth / 2 + 10;
  const startY = y;
  text('VAN', MARGIN, 8, bold, MUTED);
  y -= 14;
  const senderLines = [
    options.invoice.name,
    ...(options.invoice.address ? [options.invoice.address] : []),
    ...(options.invoice.kvk ? [`KvK ${options.invoice.kvk}`] : []),
    ...(options.invoice.vat ? [`Btw-nr ${options.invoice.vat}`] : []),
    ...(options.invoice.email ? [options.invoice.email] : []),
  ];
  senderLines.forEach((line, index) => {
    text(line, MARGIN, index === 0 ? 11 : 10, index === 0 ? bold : regular);
    y -= 14;
  });
  const leftEnd = y;

  y = startY;
  text('AAN', colRight, 8, bold, MUTED);
  y -= 14;
  const customerLines = [
    record.customer.biz,
    `t.a.v. ${record.customer.owner}`,
    record.customer.city,
    record.customer.phone,
    ...(record.customer.email ? [record.customer.email] : []),
  ];
  customerLines.forEach((line, index) => {
    text(line, colRight, index === 0 ? 11 : 10, index === 0 ? bold : regular);
    y -= 14;
  });

  y = Math.min(y, leftEnd) - 16;

  // Meta
  const meta: [string, string][] = [
    ['Factuurnummer', number],
    ['Factuurdatum', formatDutchDate(issuedAt)],
    ['Betaald op', formatDutchDate(paidAt)],
    ['Offerte', record.id],
    ['Vak', record.sectorName],
    ['Pakket', record.planName],
  ];
  for (const [label, value] of meta) {
    text(label, MARGIN, 10, regular, MUTED);
    textRight(value, 10, bold);
    y -= 14;
  }
  y -= 16;

  // Lines
  ensure(60);
  page.drawRectangle({ x: MARGIN, y: y - 6, width: contentWidth, height: 20, color: rgb(0.96, 0.96, 0.95) });
  text('Omschrijving', MARGIN + 8, 9, bold);
  textRight('Bedrag (excl. btw)', 9, bold, INK, right - 8);
  y -= 26;
  for (const line of record.lines) {
    ensure(22);
    text(line.label, MARGIN + 8, 10, line.kind === 'plan' ? bold : regular);
    textRight(
      line.included ? 'inbegrepen' : formatEuroCents(line.amountCents),
      10,
      line.included ? regular : bold,
      line.included ? MUTED : INK,
      right - 8
    );
    y -= 8;
    rule();
    y -= 14;
  }

  // Totals
  ensure(70);
  y -= 4;
  const totalsX = MARGIN + contentWidth / 2 + 10;
  const totals: [string, string, boolean][] = [
    ['Subtotaal excl. btw', formatEuroCents(record.subtotalCents), false],
    ['Btw 21%', formatEuroCents(record.vatCents), false],
    ['Totaal incl. btw', formatEuroCents(record.totalCents), true],
  ];
  for (const [label, value, strong] of totals) {
    if (strong) {
      y -= 4;
      page.drawLine({ start: { x: totalsX, y: y + 14 }, end: { x: right, y: y + 14 }, thickness: 1.5, color: INK });
      y -= 4;
    }
    text(label, totalsX, strong ? 12 : 10, strong ? bold : regular, strong ? INK : MUTED);
    textRight(value, strong ? 12 : 10, bold, INK, right - 8);
    y -= strong ? 20 : 15;
  }
  y -= 16;

  // Paid
  ensure(46);
  text('BETAALD', MARGIN, 8, bold, GREEN);
  y -= 14;
  text(
    `Het bedrag van ${formatEuroCents(record.totalCents)} is op ${formatDutchDate(paidAt)} ontvangen.`,
    MARGIN,
    10,
    regular,
  );
  y -= 14;
  if (options.payment) {
    text(
      `Betaald via bankoverschrijving naar ${options.payment.iban} t.n.v. ${options.payment.name}.`,
      MARGIN,
      10,
      regular,
    );
    y -= 14;
  }
  y -= 10;

  // Notes
  const notes = [
    'Eenmalige prijs voor ontwerp en bouw van je website. Je site en de code zijn van jou; hosting en service spreken we apart af.',
    'Bedragen zijn in euro. Prijzen zijn exclusief btw; de btw (21%) staat apart vermeld.',
    'Bij vragen over deze factuur antwoord je op de mail waarin de factuur binnenkwam.',
  ];
  ensure(30);
  text('OPMERKINGEN', MARGIN, 8, bold, MUTED);
  y -= 14;
  for (const note of notes) {
    const lines = wrap(note, regular, 9, contentWidth - 12);
    ensure(lines.length * 12 + 4);
    text('•', MARGIN, 9, regular, MUTED);
    for (const line of lines) {
      text(line, MARGIN + 12, 9, regular, INK);
      y -= 12;
    }
    y -= 3;
  }

  // Footer on every page
  const pages = doc.getPages();
  pages.forEach((p, index) => {
    const footer = pdfSafe(
      `${options.invoice.name} · ${options.invoice.email ?? options.invoice.name} · Factuur ${number} · pagina ${index + 1} van ${pages.length}`
    );
    p.drawLine({ start: { x: MARGIN, y: 44 }, end: { x: right, y: 44 }, thickness: 0.5, color: LINE });
    p.drawText(footer, { x: MARGIN, y: 30, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}
