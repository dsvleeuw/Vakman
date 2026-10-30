import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_FAQS, FaqSection } from './FaqSection';

/**
 * The questions and answers stand in the page, also without JavaScript.
 *
 * The homepage is prerendered to real HTML for search engines and for
 * visitors with a slow connection. A closed accordion that only paints its
 * answer after a click would leave them without the text that matters most.
 */

/** React escapes the text it puts in the markup. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

test('elk antwoord staat in de pagina, zonder klik', () => {
  const markup = renderToStaticMarkup(<FaqSection />);

  for (const faq of DEFAULT_FAQS) {
    assert.ok(markup.includes(escapeHtml(faq.q)), `de vraag ontbreekt: ${faq.q}`);
    assert.ok(markup.includes(escapeHtml(faq.a)), `het antwoord ontbreekt: ${faq.q}`);
  }
});

test('de vragen zijn native details, dus ze werken zonder JavaScript', () => {
  const markup = renderToStaticMarkup(<FaqSection />);

  assert.equal((markup.match(/<details/g) ?? []).length, DEFAULT_FAQS.length);
  assert.equal((markup.match(/<summary/g) ?? []).length, DEFAULT_FAQS.length);
  // Geen eigen knoppen meer: de browser doet het openen en sluiten.
  assert.equal(markup.includes('aria-expanded'), false);
});
