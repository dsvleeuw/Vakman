import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MEDIA_BYTES,
  contentTypeFor,
  handleGetMedia,
  handleUploadMedia,
  isValidMediaKey,
  newMediaKey,
  readDataUrl,
  type MediaStorage,
} from './mediaHandler';

/** A storage that keeps the photos in memory. */
function memoryStorage(): MediaStorage & { photos: Map<string, { data: Uint8Array; contentType: string }> } {
  const photos = new Map<string, { data: Uint8Array; contentType: string }>();
  return {
    photos,
    async saveMedia(key, data, contentType) {
      photos.set(key, { data, contentType });
      return `memory:${key}`;
    },
    async getMedia(key) {
      return photos.get(key) ?? null;
    },
  };
}

/** A small, real JPEG as a data URL. */
const JPEG = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01, 0xff, 0xd9]).toString(
  'base64'
)}`;

test('een foto wordt opgeslagen en krijgt een adres', async () => {
  const storage = memoryStorage();
  const result = await handleUploadMedia({ data: JPEG }, { storage });

  assert.equal(result.status, 200);
  const body = result.body as { ok: boolean; url: string; key: string };
  assert.equal(body.ok, true);
  assert.match(body.url, /^\/api\/media\?key=[a-z0-9-]+\.jpg$/);
  assert.equal(storage.photos.size, 1);
});

test('alleen foto’s van het type jpg, png en webp zijn toegestaan', async () => {
  const storage = memoryStorage();
  const result = await handleUploadMedia(
    { data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' },
    { storage }
  );

  assert.equal(result.status, 400);
  assert.equal(storage.photos.size, 0);
});

test('een te grote foto wordt geweigerd', () => {
  const huge = `data:image/jpeg;base64,${'A'.repeat(Math.ceil((MAX_MEDIA_BYTES * 4) / 3) + 32)}`;
  const parsed = readDataUrl(huge);

  assert.equal(parsed.ok, false);
  if (parsed.ok) return;
  assert.match(parsed.error, /te groot/);
});

test('iets anders dan een foto wordt geweigerd', () => {
  assert.equal(readDataUrl('geen data').ok, false);
  assert.equal(readDataUrl(undefined).ok, false);
  assert.equal(readDataUrl('data:text/plain;base64,aGk=').ok, false);
});

test('een foto wordt weer opgehaald', async () => {
  const storage = memoryStorage();
  const uploaded = await handleUploadMedia({ data: JPEG }, { storage });
  const key = (uploaded.body as { key: string }).key;

  const result = await handleGetMedia(new URLSearchParams(`key=${key}`), { storage });
  assert.equal(result.status, 200);
  assert.equal(result.contentType, 'image/jpeg');
  assert.ok(result.body && result.body.length > 0);
});

test('een sleutel die niet van ons is wordt niet geserveerd', async () => {
  const storage = memoryStorage();
  const result = await handleGetMedia(new URLSearchParams('key=../../etc/passwd'), { storage });

  assert.equal(result.status, 400);
  assert.equal(result.body, null);
});

test('een foto die er niet is geeft 404', async () => {
  const storage = memoryStorage();
  const result = await handleGetMedia(new URLSearchParams('key=aaaaaa.jpg'), { storage });

  assert.equal(result.status, 404);
});

test('de sleutel en het type zijn voorspelbaar', () => {
  const key = newMediaKey('image/png');
  assert.match(key, /^[a-z0-9-]{16}\.png$/);
  assert.ok(isValidMediaKey(key));
  assert.ok(!isValidMediaKey('photo.jpg'));
  assert.equal(contentTypeFor('a.png'), 'image/png');
  assert.equal(contentTypeFor('a.webp'), 'image/webp');
  assert.equal(contentTypeFor('a.jpg'), 'image/jpeg');
});
