import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';

/**
 * Public Firebase web config. The real values live in
 * `firebase-applet-config.json` at the repo root (public by design, see
 * AGENTS.md) and can be overridden with `VITE_FIREBASE_*` env vars.
 */
export interface GoogleConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  [key: string]: string | undefined;
}

type EnvRecord = Record<string, string | undefined>;

/**
 * Used when neither `firebase-applet-config.json` (prerender/tsx, see
 * `loadAppletConfig`) nor the env vars provide values. It deliberately has no
 * `apiKey`: `isGoogleConfigured()` then reports `false` and the Google option
 * stays hidden instead of failing at sign-in.
 */
const FALLBACK_CONFIG: GoogleConfig = {
  authDomain: 'localhost',
  projectId: 'gen-lang-client-0169081330',
};

/** Env vars that may override the committed applet config (public web keys only). */
const ENV_OVERRIDES: Record<string, keyof GoogleConfig> = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
};

/**
 * Read `firebase-applet-config.json` through Vite's `import.meta.glob`, which is
 * resolved at build time and therefore also works in the production browser
 * bundle (`require()` does not). Runtimes without Vite — `bun test` and the
 * prerender pass in `scripts/prerender.ts` via tsx — get `null` and fall back to
 * the env values or the keyless fallback config.
 */
function loadAppletConfig(): GoogleConfig | null {
  try {
    // `import.meta.glob` is compiled to a static map by Vite; in runtimes without
    // Vite the call throws and we fall through to env values / the keyless fallback.
    const modules = import.meta.glob('/firebase-applet-config.json', {
      eager: true,
      import: 'default',
    }) as unknown as Record<string, GoogleConfig | undefined>;
    const config = modules['/firebase-applet-config.json'];
    return config && typeof config === 'object' ? config : null;
  } catch {
    return null;
  }
}

function readEnv(): EnvRecord {
  const env = (import.meta as ImportMeta & { env?: EnvRecord }).env;
  return env ?? {};
}

/**
 * Pure merge of the fallback config, `firebase-applet-config.json` and the
 * `VITE_FIREBASE_*` env vars (non-empty env values win). A missing or empty
 * `apiKey` stays missing on purpose: `isGoogleConfigured()` must report `false`
 * instead of pretending the integration works.
 */
export function resolveGoogleConfig(
  appletConfig: GoogleConfig | null = loadAppletConfig(),
  env: EnvRecord = readEnv()
): GoogleConfig {
  const config: GoogleConfig = { ...FALLBACK_CONFIG };
  if (appletConfig) {
    for (const [key, value] of Object.entries(appletConfig)) {
      if (typeof value === 'string') config[key] = value;
    }
  }
  for (const [envKey, configKey] of Object.entries(ENV_OVERRIDES)) {
    const value = env[envKey]?.trim();
    if (value) config[configKey] = value;
  }
  return config;
}

const firebaseConfig: GoogleConfig = resolveGoogleConfig();

let cachedAuth: Auth | null = null;

/** Firebase is initialised on first use, so importing this module stays side-effect free. */
function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    const app: FirebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

function createProvider(): GoogleAuthProvider {
  const nextProvider = new GoogleAuthProvider();
  nextProvider.addScope('https://www.googleapis.com/auth/drive.file');
  nextProvider.addScope('https://www.googleapis.com/auth/calendar.events');
  return nextProvider;
}

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(getFirebaseAuth(), (user: User | null) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (!isGoogleConfigured()) {
    throw new Error('Google Agenda is niet geconfigureerd in deze omgeving.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(getFirebaseAuth(), createProvider());
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Geen OAuth access token ontvangen van Google');
    }
    const token = credential.accessToken;
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => cachedAccessToken;

export const logoutGoogle = async () => {
  await signOut(getFirebaseAuth());
  cachedAccessToken = null;
};

/**
 * Check if Google integration is properly configured: a usable apiKey is present.
 *
 * Google API keys always start with "AIza"; requiring that prefix rejects empty
 * values, whitespace and the non-credential placeholders older local builds used,
 * so the Google Agenda option stays hidden instead of failing at sign-in.
 */
export function isGoogleConfigured(config: GoogleConfig = firebaseConfig): boolean {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) return false;
  return apiKey.startsWith('AIza');
}

export interface CalendarEventPayload {
  summary: string;
  location?: string;
  description?: string;
  startTimeIso: string;
  endTimeIso: string;
  clientEmail?: string;
}

/**
 * Sync appointment to Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  eventData: CalendarEventPayload
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const payload = {
      summary: eventData.summary,
      location: eventData.location || '',
      description: eventData.description || '',
      start: {
        dateTime: eventData.startTimeIso,
        timeZone: 'Europe/Amsterdam',
      },
      end: {
        dateTime: eventData.endTimeIso,
        timeZone: 'Europe/Amsterdam',
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (err: any) {
    console.error('Calendar Event Creation Error:', err);
    return { success: false, error: err.message || 'Kon afspraak niet opslaan in Google Calendar' };
  }
}

/**
 * Upload Quote Summary file to Google Drive
 */
export async function uploadQuoteToGoogleDrive(
  accessToken: string,
  fileName: string,
  content: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const metadata = {
      name: fileName,
      mimeType: 'text/plain',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
      content +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, fileId: data.id };
  } catch (err: any) {
    console.error('Drive Upload Error:', err);
    return { success: false, error: err.message || 'Kon offerte niet opslaan in Google Drive' };
  }
}

/**
 * Pure helper function to format a quote text summary for Drive/Download
 */
export function buildQuoteTextSummary(
  bizName: string,
  ownerName: string,
  phone: string,
  city: string,
  clientName: string,
  clientPhone: string,
  serviceName: string,
  dateStr: string,
  timeSlot: string,
  estimatePrice: string,
  notes?: string
): string {
  return `====================================================
OFFERTE & AFSPRAAKBEVESTIGING - ${bizName.toUpperCase()}
====================================================

VAKMAN GEGEVENS:
Bedrijf: ${bizName}
Vakman: ${ownerName}
Plaats: ${city}
Telefoon: ${phone}

KLANT GEGEVENS:
Naam: ${clientName}
Telefoon: ${clientPhone}

AFSPRAAK DETAILS:
Dienst: ${serviceName}
Datum: ${dateStr}
Tijdslot: ${timeSlot}
Indicatieprijs: ${estimatePrice}
${notes ? `Notities: ${notes}\n` : ''}
----------------------------------------------------
Gegenereerd via Klusbaas.nl op ${new Date().toLocaleDateString('nl-NL')}
====================================================`;
}
