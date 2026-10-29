import test from 'node:test';
import assert from 'node:assert/strict';
import type { PublicPublishedSite } from '../types';
import { buildSitePrivacy, PROCESSOR_EMAIL, RETENTION_MONTHS } from './sitePrivacy';

const site: PublicPublishedSite = {
  slug: 'jansen-schilderwerken',
  sector: 'schilder',
  styleId: 'modern',
  form: {
    biz: 'Jansen Schilderwerken',
    owner: 'Jan Jansen',
    phone: '0698765432',
    city: 'Haarlem',
    email: 'jan@jansen.nl',
  },
  disabledServices: {},
  blocks: [],
  blockContent: {},
  text: {
    kicker: 'Schilderen',
    headline: 'De muur die je blijft bewonderen',
    intro: 'Sinds 1998',
    about: 'Ik ben Jan.',
    cta1: 'Bekijk mijn werk',
    cta2: 'Vraag een offerte',
  },
  updatedAt: 1,
};

test('de vakman is verantwoordelijk, niet Klusbaas', () => {
  const statement = buildSitePrivacy(site);
  assert.equal(statement.responsible.biz, 'Jansen Schilderwerken');
  assert.equal(statement.responsible.name, 'Jan Jansen');
  assert.equal(statement.responsible.phone, '0698765432');
  assert.equal(statement.responsible.email, 'jan@jansen.nl');
  assert.equal(statement.processor, PROCESSOR_EMAIL);
  const all = statement.sections.flatMap((section) => section.items).join(' ');
  assert.match(all, /Jansen Schilderwerken \(Jan Jansen\) is verantwoordelijk/);
});

test('de verklaring zegt wat er met de gegevens gebeurt en hoe lang', () => {
  const statement = buildSitePrivacy(site);
  const all = statement.sections.flatMap((section) => section.items).join(' ');
  assert.match(all, /naam, je telefoonnummer, je e-mailadres/);
  assert.match(all, /Je bericht gaat per mail naar Jansen Schilderwerken/);
  assert.match(all, new RegExp(`${RETENTION_MONTHS} maanden`));
  assert.match(all, /in naam van Jansen Schilderwerken/);
});

test('de verklaring noemt de rechten van de bezoeker', () => {
  const statement = buildSitePrivacy(site);
  const all = statement.sections.flatMap((section) => section.items).join(' ');
  assert.match(all, /Je mag vragen welke gegevens/);
  assert.match(all, /Autoriteit Persoonsgegevens/);
});

test('zonder e-mailadres blijft de verklaring kloppen', () => {
  const statement = buildSitePrivacy({
    ...site,
    form: { ...site.form, email: undefined },
  });
  assert.equal(statement.responsible.email, undefined);
  const all = statement.sections.flatMap((section) => section.items).join(' ');
  assert.match(all, /0698765432/);
  assert.doesNotMatch(all, /undefined/);
});
