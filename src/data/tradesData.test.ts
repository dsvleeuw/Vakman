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
  }, undefined, null);

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
  }, undefined, null);

  assert.equal(site.biz, 'Schildersbedrijf Jansen');
  assert.equal(site.owner, base.owner);
  assert.equal(site.phone, base.phone);
  assert.equal(site.city, 'Delft');
  assert.ok(site.kicker.includes('DELFT'));
});

test('buildActiveSite never links demo buttons to the sample sector number', () => {
  const base = SECTORS.loodgieter;

  const unsafe = buildActiveSite('loodgieter', 0, undefined, undefined, null);
  assert.equal(unsafe.phone, base.phone);
  assert.equal(unsafe.contactPhone, null);

  const demo = buildActiveSite('loodgieter', 0, undefined, undefined, '0201234567');
  assert.equal(demo.phone, '02 01 23 45 67');
  assert.equal(demo.contactPhone, demo.phone);
  assert.ok(!demo.callLabel.includes(base.phone));

  const own = buildActiveSite(
    'loodgieter',
    0,
    { biz: '', owner: '', phone: '0698765432', city: '' },
    undefined,
    '0201234567'
  );
  assert.equal(own.contactPhone, '06 98 76 54 32');
});
