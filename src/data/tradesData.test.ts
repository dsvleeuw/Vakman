import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS, buildActiveSite } from './tradesData';

test('buildActiveSite falls back to sector defaults when wizard fields are empty or whitespace', () => {
  const base = SECTORS.loodgieter;
  const site = buildActiveSite('loodgieter', 2, {
    biz: '',
    owner: '   ',
    phone: '',
    city: '  ',
  });

  assert.equal(site.biz, base.biz);
  assert.equal(site.owner, base.owner);
  assert.equal(site.phone, base.phone);
  assert.equal(site.city, base.city);
  assert.ok(site.kicker.includes(base.city.toUpperCase()));
});

test('buildActiveSite mixes partial wizard input with sector defaults', () => {
  const base = SECTORS.schilder;
  const site = buildActiveSite('schilder', 0, {
    biz: 'Schildersbedrijf Jansen',
    owner: '',
    phone: '',
    city: 'Delft',
  });

  assert.equal(site.biz, 'Schildersbedrijf Jansen');
  assert.equal(site.owner, base.owner);
  assert.equal(site.phone, base.phone);
  assert.equal(site.city, 'Delft');
  assert.ok(site.kicker.includes('DELFT'));
});
