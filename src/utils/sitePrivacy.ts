import type { PublicPublishedSite } from '../types';

/**
 * The privacy statement of a published customer site.
 *
 * On the site of a craftsman the craftsman is the party responsible for the
 * data: the visitor leaves his details on *his* site. Klusbaas only keeps
 * the site running and stores the request on his behalf. The statement says
 * exactly that, in the words of the site itself, and invents nothing: no
 * KvK number, no pretend address, no "certified" anything.
 */

export interface SitePrivacySection {
  title: string;
  items: string[];
}

export interface SitePrivacyStatement {
  /** The party responsible for the data on this site. */
  responsible: {
    name: string;
    biz: string;
    phone: string;
    email?: string;
    city: string;
  };
  /** Klusbaas, the party that runs the site. */
  processor: string;
  sections: SitePrivacySection[];
}

/** The e-mail address of Klusbaas, where the visitor can complain. */
export const PROCESSOR_EMAIL = 'info@klusbaas.nl';

/** How long Klusbaas keeps a request on behalf of the craftsman. */
export const RETENTION_MONTHS = 12;

/**
 * The statement of a published site. Every sentence is built from what the
 * craftsman himself filled in.
 */
export function buildSitePrivacy(site: PublicPublishedSite): SitePrivacyStatement {
  const biz = site.form.biz || 'deze ondernemer';
  const name = site.form.owner || biz;
  const responsible = {
    name,
    biz,
    phone: site.form.phone,
    ...(site.form.email ? { email: site.form.email } : {}),
    city: site.form.city,
  };

  return {
    responsible,
    processor: PROCESSOR_EMAIL,
    sections: [
      {
        title: 'Wie is verantwoordelijk',
        items: [
          `${biz} (${name}) is verantwoordelijk voor de gegevens die je op deze site achterlaat.`,
          `Je kunt ${biz} bereiken op ${site.form.phone}${
            site.form.email ? ` of op ${site.form.email}` : ''
          }.`,
        ],
      },
      {
        title: 'Welke gegevens worden verzameld',
        items: [
          'Als je een formulier op deze site invult, noteert deze site je naam, je telefoonnummer, je e-mailadres en wat je zelf schrijft.',
          'Er worden geen gegevens van anderen gevraagd en er worden geen trackers of advertentiecookies op deze site geplaatst.',
        ],
      },
      {
        title: 'Waar je gegevens terecht komen',
        items: [
          `Je bericht gaat per mail naar ${biz}.`,
          `Klusbaas bewaart je aanvraag daarnaast ${RETENTION_MONTHS} maanden in naam van ${biz}, zodat je bericht niet verloren gaat als de mail niet aankomt. Klusbaas gebruikt die gegevens voor niets anders.`,
        ],
      },
      {
        title: 'Hoe lang ze worden bewaard',
        items: [
          `Klusbaas bewaart je aanvraag ${RETENTION_MONTHS} maanden en verwijdert hem daarna.`,
          `${biz} bewaart de mail zelf zolang hij die nodig heeft voor zijn werk.`,
        ],
      },
      {
        title: 'Jouw rechten',
        items: [
          `Je mag vragen welke gegevens ${biz} van je heeft, ze laten corrigeren of laten verwijderen. Stuur daarvoor een mail naar ${biz}.`,
          `Klusbaas helpt ${biz} hierbij. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.`,
        ],
      },
    ],
  };
}
