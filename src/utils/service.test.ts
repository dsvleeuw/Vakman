import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICE_AMOUNT_CENTS,
  canRequestService,
  serviceAmountLabel,
  serviceAmountText,
  serviceAmountWithVat,
  servicePriceText,
  serviceReference,
  serviceStatusLabel,
} from './service';
import type { ServiceState } from '../types';

/**
 * The monthly service: the price, the reference and the wording.
 *
 * The customer must see the same price everywhere: on the price list, in
 * his account, in the mail and in the invoice.
 */

test('de service kost € 25 per maand, exclusief btw', () => {
  assert.equal(SERVICE_AMOUNT_CENTS, 2500);
  assert.equal(servicePriceText(), '€ 25,00 per maand (excl. btw)');
  // 21 % btw op € 25,00 is € 5,25: € 30,25 per maand.
  assert.equal(serviceAmountWithVat(), 3025);
  assert.equal(serviceAmountText(), '€ 30,25 per maand (incl. btw)');
});

test('de omschrijving van de betaling herkent de klant', () => {
  assert.equal(serviceReference('jansen-schilderwerken'), 'SERVICE-jansen-schilderwerken');
  assert.equal(serviceReference(''), 'SERVICE');
  assert.equal(serviceReference(undefined), 'SERVICE');
});

test('de klant kan de service aanvragen als hij er nog geen heeft', () => {
  assert.equal(canRequestService(undefined), true);
  assert.equal(canRequestService({ status: 'stopped', requestedAt: '', amountCents: 2500 }), true);
  assert.equal(canRequestService({ status: 'active', requestedAt: '', amountCents: 2500 }), false);
  assert.equal(canRequestService({ status: 'requested', requestedAt: '', amountCents: 2500 }), false);
});

test('de status staat in gewone woorden', () => {
  assert.equal(serviceStatusLabel('requested'), 'Aangevraagd');
  assert.equal(serviceStatusLabel('active'), 'Actief');
  assert.equal(serviceStatusLabel('stopped'), 'Gestopt');
});

test('de maanden die bij het pakket horen zijn gratis', () => {
  const service: ServiceState = {
    status: 'active',
    requestedAt: '2026-10-01T00:00:00.000Z',
    amountCents: 0,
  };
  assert.match(serviceAmountLabel(service), /gratis/);
});
