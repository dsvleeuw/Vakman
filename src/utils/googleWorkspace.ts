import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';

// Use firebase applet config if present, or fallback gracefully
let firebaseConfig: Record<string, string> = {
  apiKey: 'fake-key-for-local',
  authDomain: 'localhost',
  projectId: 'gen-lang-client-0169081330',
};

// Load config via Vite-compatible ESM import
try {
  const config = await import('../../firebase-applet-config.json', { with: { type: 'json' } });
  if (config && config.default) {
    firebaseConfig = config.default;
  }
} catch {
  // Use default fallback
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
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
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Check if Google integration is properly configured (not using the fake local key).
 */
export function isGoogleConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey) && firebaseConfig.apiKey !== 'fake-key-for-local';
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
