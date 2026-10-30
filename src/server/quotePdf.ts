import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { BRAND_MARK, BRAND_WORDMARK } from '../data/brandMark';
import { PLATFORM_CONTACT } from '../data/platform';
import type { PaymentDetails } from '../types';
import { QUOTE_VALID_DAYS, formatDutchDate, formatEuroCents, type QuoteRecord } from '../utils/quote';

/**
 * Server-side quote PDF (A4, Dutch). Uses the built-in Helvetica fonts so no
 * font files ship with the function; text is reduced to WinAnsi first.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const INK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.45, 0.42, 0.4);
const LINE = rgb(0.9, 0.89, 0.88);
const ACCENT = rgb(0.85, 0.47, 0.02);
/** Logo height in points; the brand paths live in a 64-unit-high box. */
const LOGO_HEIGHT = 26;

/** Draw the Klusbaas logo (vector paths) with its top-left corner at x, top. */
export function drawLogo(page: PDFPage, x: number, top: number, height = LOGO_HEIGHT) {
  const scale = height / 64;
  page.drawSvgPath(BRAND_MARK.stem, { x, y: top, scale, color: INK });
  page.drawSvgPath(BRAND_MARK.square, { x, y: top, scale, color: ACCENT });
  page.drawSvgPath(BRAND_WORDMARK.path, { x, y: top, scale, color: INK });
}

/** Replace characters Helvetica/WinAnsi cannot encode. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[→➔]/g, '->')
    .replace(/[✓✔]/g, 'v')
    .replace(/ | /g, ' ')
    .replace(/[^\x20-\x7e -ÿ€–—‘’“”•…·]/g, '');
}

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

export async function renderQuotePdf(
  record: QuoteRecord,
  options: { siteUrl?: string; payment?: PaymentDetails } = {}
): Promise<Uint8Array> {
  const privacyHost = (options.siteUrl ?? 'https://klusbaas.nl').replace(/\/$/, '').replace(/^https?:\/\//, '');
  const doc = await PDFDocument.create();
  doc.setTitle(`Offerte ${record.id}`);
  doc.setAuthor('Klusbaas');
  doc.setSubject(`Offerte ${record.id} voor ${pdfSafe(record.customer.biz)}`);
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

  // Header
  page.drawRectangle({ x: 0, y: A4.height - 6, width: A4.width, height: 6, color: ACCENT });
  drawLogo(page, MARGIN, y + 20);
  textRight('OFFERTE', 20, bold);
  y -= 16;
  text('Websites voor vakmensen in Haarlemmermeer en omstreken', MARGIN, 9, regular, MUTED);
  textRight(record.id, 11, bold, ACCENT);
  y -= 28;
  rule(INK, 1.5);
  y -= 22;

  // Meta + parties
  const colRight = MARGIN + contentWidth / 2 + 10;
  const startY = y;
  text('OFFERTE VOOR', MARGIN, 8, bold, MUTED);
  y -= 14;
  const customerLines = [
    record.customer.biz,
    `t.a.v. ${record.customer.owner}`,
    record.customer.city,
    record.customer.phone,
    ...(record.customer.email ? [record.customer.email] : []),
  ];
  customerLines.forEach((line, index) => {
    text(line, MARGIN, index === 0 ? 11 : 10, index === 0 ? bold : regular);
    y -= 14;
  });
  const leftEnd = y;

  y = startY;
  text('GEGEVENS', colRight, 8, bold, MUTED);
  y -= 14;
  const meta: [string, string][] = [
    ['Offertenummer', record.id],
    ['Offertedatum', formatDutchDate(record.createdAt)],
    ['Geldig tot', formatDutchDate(record.validUntil)],
    ['Vak', record.sectorName],
    ['Stijl', record.styleName],
    ['Offerte via', record.channel],
  ];
  for (const [label, value] of meta) {
    text(label, colRight, 10, regular, MUTED);
    textRight(value, 10, bold);
    y -= 14;
  }
  y = Math.min(y, leftEnd) - 16;

  // Services
  if (record.services.length) {
    ensure(40);
    text('DIENSTEN OP DE WEBSITE', MARGIN, 8, bold, MUTED);
    y -= 14;
    for (const line of wrap(record.services.join(' · '), regular, 10, contentWidth)) {
      ensure(14);
      text(line, MARGIN, 10);
      y -= 14;
    }
    y -= 10;
  }
  if (record.appointment) {
    ensure(20);
    text('Voorkeur kennismaking:', MARGIN, 10, regular, MUTED);
    text(`${record.appointment.date}${record.appointment.slot ? `, ${record.appointment.slot}` : ''}`, MARGIN + 120, 10, bold);
    y -= 24;
  }

  // Lines table
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

  // Wat Klusbaas doet voor de site: dat hoort bij wat de klant koopt, dus
  // het staat in de offerte. De stand van zaken staat in het account.
  if (record.delivery?.length) {
    ensure(60);
    text('WAT WIJ DOEN', MARGIN, 8, bold, MUTED);
    y -= 14;
    for (const item of record.delivery) {
      const lines = wrap(`- ${item.label}`, regular, 9.5, contentWidth - 10);
      ensure(lines.length * 12 + 4);
      for (const line of lines) {
        text(line, MARGIN + 6, 9.5);
        y -= 12;
      }
      y -= 2;
    }
    y -= 8;
  }

  // Betalen: de klant moet het bedrag kunnen overmaken vanaf de offerte
  // zelf, zonder eerst een account te maken.
  if (options.payment) {
    const payment = options.payment;
    ensure(70);
    text('BETALEN', MARGIN, 8, bold, MUTED);
    y -= 14;
    const payRows: [string, string][] = [
      ['Bankrekening (IBAN)', payment.iban],
      ['Ten name van', payment.name],
      ...(payment.email ? ([['E-mail', payment.email]] as [string, string][]) : []),
      ['Bedrag', `${formatEuroCents(record.totalCents)} incl. btw`],
      ['Omschrijving', record.id],
    ];
    for (const [label, value] of payRows) {
      ensure(14);
      text(label, MARGIN, 10, regular, MUTED);
      text(value, MARGIN + 150, 10, bold);
      y -= 14;
    }
    y -= 10;
  }

  // Conditions
  const conditions = [
    `Deze offerte is ${QUOTE_VALID_DAYS} dagen geldig, tot en met ${formatDutchDate(record.validUntil)}.`,
    'Alle bedragen zijn in euro. Prijzen zijn exclusief btw; de btw (21%) staat apart vermeld.',
    'Eenmalige prijs voor ontwerp en bouw van je website. Je site en de code zijn van jou; hosting en service spreken we apart af.',
    'Componenten die al in je pakket zitten, staan als "inbegrepen" vermeld en betaal je niet dubbel.',
    'Akkoord? Antwoord op de offertemail of stuur ons een WhatsApp. Pas na je akkoord plannen we de bouw in.',
    `Hoe we met je gegevens omgaan, lees je op ${privacyHost}/privacy.`,
  ];
  ensure(30);
  text('VOORWAARDEN', MARGIN, 8, bold, MUTED);
  y -= 14;
  for (const condition of conditions) {
    const lines = wrap(condition, regular, 9, contentWidth - 12);
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
    const footer = pdfSafe(`Klusbaas · ${PLATFORM_CONTACT.email} · Offerte ${record.id} · pagina ${index + 1} van ${pages.length}`);
    p.drawLine({ start: { x: MARGIN, y: 44 }, end: { x: right, y: 44 }, thickness: 0.5, color: LINE });
    p.drawText(footer, { x: MARGIN, y: 30, size: 8, font: regular, color: MUTED });
  });

  return doc.save();
}
