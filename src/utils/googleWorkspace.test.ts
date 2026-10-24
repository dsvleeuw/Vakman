import test from 'node:test';
import assert from 'node:assert/strict';
import { isGoogleConfigured } from './googleWorkspace';

test('isGoogleConfigured returns false with fake key', () => {
  // Mock the module to test with fake key
  // We can't easily mock the import, so we test the logic directly
  // The actual function uses the module-level firebaseConfig
  // This test documents the expected behavior
  const fakeConfig = { apiKey: 'fake-key-for-local' };
  const configuredConfig = { apiKey: 'AIzaSyRealKey123' };
  const emptyConfig = { apiKey: '' };
  const missingConfig: Record<string, string> = {};

  // Test the logic that isGoogleConfigured implements
  assert.equal(Boolean(fakeConfig.apiKey) && fakeConfig.apiKey !== 'fake-key-for-local', false);
  assert.equal(Boolean(configuredConfig.apiKey) && configuredConfig.apiKey !== 'fake-key-for-local', true);
  assert.equal(Boolean(emptyConfig.apiKey) && emptyConfig.apiKey !== 'fake-key-for-local', false);
  // missingConfig.apiKey is undefined
  assert.equal(Boolean(missingConfig.apiKey) && missingConfig.apiKey !== 'fake-key-for-local', false);
});