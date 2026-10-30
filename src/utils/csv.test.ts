import test from 'node:test';
import assert from 'node:assert/strict';
import { csvFileContent, csvFilename, escapeCsvValue, toCsv } from './csv';

/**
 * De export van het overzicht: Klusbaas zet zijn aanvragen en offertes in
 * Excel. Nederlands Excel verwacht een puntkomma.
 */

test('een veld met een komma of puntkomma gaat tussen aanhalingstekens', () => {
  assert.equal(escapeCsvValue('Jan Jansen'), 'Jan Jansen');
  assert.equal(escapeCsvValue('a;b'), '"a;b"');
  assert.equal(escapeCsvValue('met, komma'), '"met, komma"');
  assert.equal(escapeCsvValue('met "quotes"'), '"met ""quotes"""');
  assert.equal(escapeCsvValue(undefined), '');
  assert.equal(escapeCsvValue(null), '');
});

test('de kolommen staan gescheiden met een puntkomma', () => {
  const csv = toCsv([
    ['Referentie', 'Naam', 'Bedrag'],
    ['L-AAAA01', 'Sanne de Vries', 1203.95],
  ]);
  assert.equal(csv, 'Referentie;Naam;Bedrag\r\nL-AAAA01;Sanne de Vries;1203.95');
});

test('het bestand heeft een BOM, zodat Excel de letters leest', () => {
  const content = csvFileContent([['Naam'], ['Sanne']]);
  assert.ok(content.startsWith('﻿'), 'de BOM staat voor de tekst');
  assert.ok(content.includes('Sanne'));
});

test('de bestandsnaam heeft de datum van vandaag', () => {
  assert.equal(csvFilename('aanvragen', new Date('2026-10-30T12:00:00.000Z')), 'aanvragen-2026-10-30.csv');
});
