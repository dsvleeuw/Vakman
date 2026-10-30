import { runRetention } from '../../src/server/retention';
import { createBlobStorage } from '../../src/server/storage';

/**
 * De bewaartermijn van de aanvragen.
 *
 * In de privacyverklaring staat dat Klusbaas een aanvraag twaalf maanden
 * bewaart. Deze functie ruimt de aanvragen op die ouder zijn, elke nacht
 * om vier uur (UTC). De belofte in de privacyverklaring wordt dus niet
 * met de hand waargemaakt, maar door de server zelf.
 *
 * Klusbaas kan het ook zelf doen, met de knop in `/klusbaas`. Dat is
 * handig als de automatische run een keer niet gelukt is.
 */
export default async (): Promise<Response> => {
  const result = await runRetention({ leads: await createBlobStorage() });
  console.log(
    `[retention] ${result.removed} aanvragen ouder dan twaalf maanden verwijderd, ${result.kept} blijven.`
  );
  return Response.json({ ok: true, removed: result.removed, kept: result.kept });
};

// Elke nacht om vier uur (UTC). Netlify draait dit alleen voor een
// gepubliceerde deploy.
export const config = { schedule: '0 4 * * *' };
