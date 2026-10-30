import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminView } from './AdminView';
import type { AdminOverview } from '../types';

/**
 * Het overzicht van Klusbaas: zoeken en exporteren. Zonder deze dingen is
 * het overzicht bij veel aanvragen niet meer te beheren.
 */

const overview: AdminOverview = {
  sites: [],
  leads: [
    {
      reference: 'L-AAAA01',
      type: 'quote',
      createdAt: Date.parse('2026-10-20T10:00:00.000Z'),
      site: { slug: 'sanne', biz: 'Vries Schilderwerken' },
      fields: {
        name: 'Sanne de Vries',
        phone: '06-12345678',
        email: 'sanne@example.com',
        message: 'Ik wil een offerte.',
      },
    } as unknown as AdminOverview['leads'][number],
  ],
  quotes: [],
  accounts: [],
  config: { checks: [], ready: true },
};

test('het overzicht heeft een zoekveld en een exportknop', () => {
  const markup = renderToStaticMarkup(<AdminView initial={overview} />);

  assert.ok(markup.includes('id="admin-search"'), 'er is een zoekveld');
  assert.ok(markup.includes('Exporteer de aanvragen'));
  assert.ok(markup.includes('Exporteer de offertes'));
});

test('het zoekveld is een echt zoekveld met een label', () => {
  const markup = renderToStaticMarkup(<AdminView initial={overview} />);

  assert.ok(markup.includes('for="admin-search"'), 'het label wijst naar het veld');
  assert.ok(markup.includes('type="search"'));
});

test('de aanvraag staat in het overzicht', () => {
  const markup = renderToStaticMarkup(<AdminView initial={overview} />);

  assert.ok(markup.includes('L-AAAA01'));
  assert.ok(markup.includes('Sanne de Vries'));
});
