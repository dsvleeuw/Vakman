import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEHOLDER_API_KEY,
  isGoogleConfigured,
  resolveGoogleConfig,
} from './googleWorkspace';

test('isGoogleConfigured is false when apiKey is missing', () => {
  assert.equal(isGoogleConfigured({}), false);
});

test('isGoogleConfigured is false when apiKey is empty or blank', () => {
  assert.equal(isGoogleConfigured({ apiKey: '' }), false);
  assert.equal(isGoogleConfigured({ apiKey: '   ' }), false);
});

test('isGoogleConfigured is false for the local placeholder key', () => {
  assert.equal(isGoogleConfigured({ apiKey: PLACEHOLDER_API_KEY }), false);
});

test('isGoogleConfigured is true for a real apiKey', () => {
  assert.equal(isGoogleConfigured({ apiKey: 'AIzaSyRealKeyFromFirebaseConsole' }), true);
  assert.equal(isGoogleConfigured({ apiKey: '  AIzaSyRealKeyFromFirebaseConsole  ' }), true);
});

test('resolveGoogleConfig falls back to the placeholder config without applet config or env', () => {
  const config = resolveGoogleConfig(null, {});
  assert.equal(config.apiKey, PLACEHOLDER_API_KEY);
  assert.equal(config.authDomain, 'localhost');
  assert.equal(isGoogleConfigured(config), false);
});

test('resolveGoogleConfig keeps an explicitly empty apiKey empty', () => {
  const config = resolveGoogleConfig({ apiKey: '', projectId: 'demo-project' }, {});
  assert.equal(config.apiKey, '');
  assert.equal(config.projectId, 'demo-project');
  assert.equal(isGoogleConfigured(config), false);
});

test('resolveGoogleConfig uses the apiKey from the applet config', () => {
  const config = resolveGoogleConfig(
    { apiKey: 'AIzaAppletKey', projectId: 'funky-entity-scb1c', authDomain: 'x.firebaseapp.com' },
    {}
  );
  assert.equal(config.apiKey, 'AIzaAppletKey');
  assert.equal(config.projectId, 'funky-entity-scb1c');
  assert.equal(config.authDomain, 'x.firebaseapp.com');
  assert.equal(isGoogleConfigured(config), true);
});

test('resolveGoogleConfig lets VITE_FIREBASE_* env values win over the applet config', () => {
  const config = resolveGoogleConfig(
    { apiKey: 'AIzaAppletKey', projectId: 'applet-project' },
    { VITE_FIREBASE_API_KEY: 'AIzaEnvKey', VITE_FIREBASE_PROJECT_ID: 'env-project' }
  );
  assert.equal(config.apiKey, 'AIzaEnvKey');
  assert.equal(config.projectId, 'env-project');
  assert.equal(isGoogleConfigured(config), true);
});

test('resolveGoogleConfig ignores blank env values', () => {
  const config = resolveGoogleConfig({ apiKey: 'AIzaAppletKey' }, { VITE_FIREBASE_API_KEY: '   ' });
  assert.equal(config.apiKey, 'AIzaAppletKey');
  assert.equal(isGoogleConfigured(config), true);
});
