import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AdminAccount, AdminSite, StoredLead } from '../types';
import { AdminQuoteForm } from './AdminQuoteForm';

const site: AdminSite = {
  slug: 'jansen-schilderwerken',
  biz: 'Jansen Schilderwerken',
  owner: 'Jan Jansen',
  phone: '0698765432',
  city: 'Haarlem',
  email: 'jan@jansen.nl',
  sector: 'schilder',
  styleId: 'klassiek',
  services: ['Binnenmuur schilderen'],
  updatedAt: 1_700_000_000_000,
  hasAccount: true,
  ownerId: 'account-1',
  manageUrl: '/mijn-site/jansen-schilderwerken?token=x',
};

const account: AdminAccount = {
  id: 'account-1',
  email: 'jan@jansen.nl',
  createdAt: 1_700_000_000_000,
  verified: true,
  sites: 1,
};

/** A customer who made an account but never published a site. */
const accountOnly: AdminAccount = {
  id: 'account-2',
  email: 'piet@bakker.nl',
  createdAt: 1_700_000_000_000,
  verified: false,
  sites: 0,
};

/** A request that came in through a form of Klusbaas itself. */
const request: StoredLead = {
  reference: 'L-AB12CD',
  createdAt: '2026-10-29T10:00:00.000Z',
  type: 'contact',
  site: { biz: 'Houtwerk De Vries', sector: 'timmerman', style: 'Vakwerk' },
  fields: {
    name: 'Jan de Vries',
    phone: '0612345678',
    email: 'jan@devries.nl',
    message: 'Ik wil een website.',
  },
};

test('in de klantenlijst staan de gepubliceerde sites, de accounts en de aanvragen', () => {
  const markup = renderToStaticMarkup(
    <AdminQuoteForm
      sites={[site]}
      accounts={[account, accountOnly]}
      leads={[request]}
      busy={false}
      onCreated={() => {}}
    />
  );

  // De klant met een site.
  assert.ok(markup.includes('Jansen Schilderwerken'));
  // De klant die alleen een account maakte.
  assert.ok(markup.includes('alleen een account'));
  // De klant die alleen een aanvraag stuurde.
  assert.ok(markup.includes('Jan de Vries'));
  assert.ok(markup.includes('L-AB12CD'));
});

test('een aanvraag op een klantsite is geen klant van Klusbaas', () => {
  const markup = renderToStaticMarkup(
    <AdminQuoteForm
      sites={[site]}
      accounts={[account, accountOnly]}
      leads={[{ ...request, site: { ...request.site, slug: 'jansen-schilderwerken' } }]}
      busy={false}
      onCreated={() => {}}
    />
  );

  assert.ok(!markup.includes('L-AB12CD'), 'die aanvraag hoort bij de vakman, niet bij Klusbaas');
});
