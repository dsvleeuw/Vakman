import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS, buildActiveSite } from './tradesData';

test('elk vak met een m2-calculator heeft diensten met een prijs per m2', () => {
  // De calculator leest de prijs uit "€ 18 per m2"; zonder zo'n dienst valt
  // hij terug op een naam die niet bij het vak hoort.
  for (const sector of Object.values(SECTORS)) {
    if (sector.tool !== 'm2-calculator') continue;
    const withPrice = sector.services.filter((service) => /€\s*\d+\s*per m²/.test(service.p ?? ''));
    assert.ok(withPrice.length > 0, `${sector.name} heeft geen dienst met een prijs per m²`);
  }
});

test('de stukadoor krijgt de oppervlaktecalculator', () => {
  assert.equal(SECTORS.stukadoor.tool, 'm2-calculator');
  assert.equal(SECTORS.schilder.tool, 'm2-calculator');
});

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

test('a customer site never shows a demo or sample number', () => {
  const base = SECTORS.loodgieter;

  // Zonder eigen nummer: geen nummer en geen demo-nummer.
  const empty = buildActiveSite('loodgieter', 0, { biz: ' Jansen', owner: '', phone: '', city: '' }, undefined, '0201234567', true);
  assert.equal(empty.contactPhone, null);
  assert.equal(empty.phone, '');
  assert.notEqual(empty.phone, base.phone);
  assert.equal(empty.callLabel, 'Bellen');
  assert.equal(empty.isCustomerSite, true);

  // Met eigen nummer: alleen dat nummer.
  const own = buildActiveSite(
    'loodgieter',
    0,
    { biz: ' Jansen', owner: '', phone: '0698765432', city: '' },
    undefined,
    '0201234567',
    true
  );
  assert.equal(own.contactPhone, '06 98 76 54 32');
  assert.ok(!own.callLabel.includes('02 01 23 45 67'));
});

test('the KvK number is only shown when the owner entered one', () => {
  const without = buildActiveSite('loodgieter', 0, undefined, undefined, null);
  assert.equal(without.kvk, null);

  const withKvk = buildActiveSite(
    'loodgieter',
    0,
    { biz: ' Jansen', owner: '', phone: '0698765432', city: '', kvk: ' 12345678 ' },
    undefined,
    null
  );
  assert.equal(withKvk.kvk, '12345678');
});
