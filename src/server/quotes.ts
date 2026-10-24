import { randomBytes } from 'node:crypto';
import {
  buildQuoteDocument,
  formatQuoteNumber,
  isQuoteNumber,
  isQuoteToken,
  tokensMatch,
  type QuoteDocument,
  type QuoteRequest,
} from '../utils/quote';
import { quotePdfFilename, renderQuotePdf } from './quotePdf';
import type { JsonStore } from './store';

/**
 * Quotes live in the `quotes` store: `KB-2026-0001` holds the JSON record,
 * `KB-2026-0001.pdf` the PDF exactly as it was mailed, and `counter-2026`
 * the last number used that year.
 */

export interface StoredQuote {
  number: string;
  /** 32 random bytes as hex; required to view the quote. */
  token: string;
  createdAt: string;
  document: QuoteDocument;
  request: QuoteRequest;
}

export const createQuoteToken = () => randomBytes(32).toString('hex');

/**
 * Number, save and render a new quote. The quote key is written with
 * `onlyIfNew`, so two requests racing for the same number cannot overwrite
 * each other: the loser simply takes the next number.
 */
export async function createQuote(
  store: JsonStore,
  request: QuoteRequest,
  now: Date
): Promise<{ record: StoredQuote; pdf: Uint8Array; filename: string }> {
  const year = now.getUTCFullYear();
  const counterKey = `counter-${year}`;
  let sequence = ((await store.get<{ last: number }>(counterKey))?.last ?? 0) + 1;
  const token = createQuoteToken();

  for (let attempt = 0; attempt < 20; attempt++, sequence++) {
    const number = formatQuoteNumber(year, sequence);
    const record: StoredQuote = {
      number,
      token,
      createdAt: now.toISOString(),
      document: buildQuoteDocument(request, number, now),
      request,
    };
    if (await store.set(number, record, { onlyIfNew: true })) {
      await store.set(counterKey, { last: sequence });
      const pdf = await renderQuotePdf(record.document);
      await store.setBytes(`${number}.pdf`, pdf);
      return { record, pdf, filename: quotePdfFilename(number) };
    }
  }
  throw new Error('Geen vrij offertenummer gevonden.');
}

export type QuoteLookup =
  | { ok: true; record: StoredQuote }
  | { ok: false; status: 400 | 404 };

/** Find a quote by number, only when the token matches. Wrong token looks like not found. */
export async function findQuote(store: JsonStore, number: string | null, token: string | null): Promise<QuoteLookup> {
  if (!isQuoteNumber(number) || !isQuoteToken(token)) return { ok: false, status: 400 };
  const record = await store.get<StoredQuote>(number);
  if (!record || !tokensMatch(record.token, token)) return { ok: false, status: 404 };
  return { ok: true, record };
}

export interface QuoteViewResult {
  status: number;
  headers: Record<string, string>;
  body: string | Uint8Array;
}

/** GET /api/offerte/:id?token=…[&format=pdf] */
export async function handleQuoteView(
  store: JsonStore,
  number: string | null,
  token: string | null,
  format: string | null
): Promise<QuoteViewResult> {
  const json = (status: number, body: unknown): QuoteViewResult => ({
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    body: JSON.stringify(body),
  });
  const found = await findQuote(store, number, token);
  if (!found.ok) {
    return json(found.status, {
      ok: false,
      error: found.status === 400 ? 'Ongeldige offertelink.' : 'Deze offerte bestaat niet of de link is niet compleet.',
    });
  }
  const { record } = found;
  if (format === 'pdf') {
    const pdf = (await store.getBytes(`${record.number}.pdf`)) ?? (await renderQuotePdf(record.document));
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${quotePdfFilename(record.number)}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
      body: pdf,
    };
  }
  return json(200, { ok: true, quote: record.document });
}
