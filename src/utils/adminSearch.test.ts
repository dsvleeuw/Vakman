import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAccounts,
  filterLeads,
  filterQuotes,
  filterSites,
  leadsToCsv,
  matchesSearch,
  quotesToCsv,
} from './adminSearch';
import type { AdminAccount, AdminQuote, AdminSite, StoredLead } from '../types';

/**
 * Zoeken en exporteren in `/klusbaas`: zodra er veel aanvragen zijn, moet
 * Klusbaas één klant kunnen terugvinden en zijn lijst in Excel kunnen zetten.
 */

const lead = (reference: string, fields: Partial<StoredLead['fields']>): StoredLead =>
  ({
    reference,
    type: 'quote',
    createdAt: Date.parse('2026-10-20T10:00:00.000Z'),
    site: { slug: 'demo', biz: 'Demo Bedrijf' },
    fields: { name: '', phone: '', email: '', message: '', ...fields },
  }) as unknown as StoredLead;

test('een zoekopdracht met hoofdletters of spaties werkt', () => {
  assert.equal(matchesSearch('Sanne de Vries', 'sanne'), true);
  assert.equal(matchesSearch('Sanne de Vries', '  DE VRIES '), true);
  assert.equal(matchesSearch('Sanne de Vries', 'jan'), false);
  assert.equal(matchesSearch(undefined, 'jan'), false);
});

test('een lege zoekopdracht laat alles zien', () => {
  const leads = [lead('L-AAAA01', { name: 'Sanne' }), lead('L-AAAA02', { name: 'Jan' })];
  assert.equal(filterLeads(leads, '').length, 2);
  assert.equal(filterLeads(leads, '   ').length, 2);
});

test('de aanvragen worden gevonden op naam, telefoon, e-mail en referentie', () => {
  const leads = [
    lead('L-AAAA01', { name: 'Sanne de Vries', phone: '06-12345678', email: 'sanne@example.com' }),
    lead('L-AAAA02', { name: 'Jan Jansen', phone: '06-87654321', email: 'jan@example.com' }),
  ];
  assert.equal(filterLeads(leads, 'sanne').length, 1);
  assert.equal(filterLeads(leads, '06-87654321').length, 1);
  assert.equal(filterLeads(leads, 'L-AAAA02').length, 1);
  assert.equal(filterLeads(leads, 'example').length, 2);
  assert.equal(filterLeads(leads, 'niemand').length, 0);
});

test('de offertes, sites en accounts worden ook gevonden', () => {
  const quotes = [
    { id: 'KB-2026-0001', customerName: 'Sanne de Vries', customerBiz: 'Vries Schilderwerken' },
    { id: 'KB-2026-0002', customerName: 'Jan Jansen' },
  ] as unknown as AdminQuote[];
  assert.equal(filterQuotes(quotes, 'vries schilder').length, 1);
  assert.equal(filterQuotes(quotes, 'KB-2026-0002').length, 1);

  const sites = [
    { slug: 'sanne', biz: 'Vries Schilderwerken', owner: 'Sanne de Vries' },
    { slug: 'jan', biz: 'Jansen Timmer', owner: 'Jan Jansen' },
  ] as unknown as AdminSite[];
  assert.equal(filterSites(sites, 'sanne').length, 1);
  assert.equal(filterSites(sites, 'jansen timmer').length, 1);

  const accounts = [{ email: 'sanne@example.com' }, { email: 'jan@example.com' }] as AdminAccount[];
  assert.equal(filterAccounts(accounts, 'sanne').length, 1);
});

test('de export van de aanvragen heeft een kop en de gegevens', () => {
  const rows = leadsToCsv([
    lead('L-AAAA01', { name: 'Sanne de Vries', phone: '06-12345678', email: 'sanne@example.com' }),
  ]);
  assert.equal(rows[0][0], 'Referentie');
  assert.equal(rows[0].length, 9);
  assert.equal(rows[1][0], 'L-AAAA01');
  assert.equal(rows[1][4], 'Sanne de Vries');
  assert.equal(rows[1][6], 'sanne@example.com');
});

test('de export van de offertes heeft een kop en het bedrag', () => {
  const rows = quotesToCsv([
    {
      id: 'KB-2026-0001',
      customerName: 'Sanne de Vries',
      customerBiz: 'Vries Schilderwerken',
      totalCents: 120395,
      status: 'open',
      planName: 'Pro',
    } as unknown as AdminQuote,
  ]);
  assert.equal(rows[0][0], 'Offertenummer');
  assert.equal(rows[1][0], 'KB-2026-0001');
  assert.ok(String(rows[1][9]).includes('1.203'), `het bedrag staat erin: ${rows[1][9]}`);
});
