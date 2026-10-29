import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, passwordProblem, verifyPassword } from './password';

test('een wachtwoord slaat op als hash en niet als wachtwoord', async () => {
  const hash = await hashPassword('moeilijk-wachtwoord');
  assert.ok(!hash.includes('moeilijk-wachtwoord'));
  assert.ok(hash.startsWith('scrypt$'));
  assert.equal(await verifyPassword('moeilijk-wachtwoord', hash), true);
  assert.equal(await verifyPassword('moeilijk-wachtwoor', hash), false);
});

test('twee hashes van hetzelfde wachtwoord verschillen', async () => {
  const first = await hashPassword('hetzelfde');
  const second = await hashPassword('hetzelfde');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('hetzelfde', first), true);
  assert.equal(await verifyPassword('hetzelfde', second), true);
});

test('een kapotte hash geeft nooit toegang', async () => {
  assert.equal(await verifyPassword('whatever', ''), false);
  assert.equal(await verifyPassword('whatever', 'plaintext'), false);
  assert.equal(await verifyPassword('whatever', 'bcrypt$abc$def'), false);
  assert.equal(await verifyPassword('whatever', 'scrypt$$'), false);
});

test('een te kort wachtwoord krijgt een Nederlandse uitleg', () => {
  assert.match(passwordProblem('abc') ?? '', /minimaal 8 tekens/);
  assert.equal(passwordProblem('achtienletters'), null);
});
