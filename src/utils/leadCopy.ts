import type { ActiveSiteData } from '../types';

/**
 * Where a lead from a page goes, in plain Dutch.
 *
 * On a published site (`/site/<slug>`) the lead belongs to the craftsman who
 * owns that site: it is mailed to him. On a Klusbaas demo site (and in the
 * editor's preview) it comes to Klusbaas. The page says exactly that, so
 * the text on the page is always true.
 */
export interface LeadRecipient {
  /** Who receives the lead: the craftsman or Klusbaas. */
  name: string;
  /** The line under the form. */
  line: string;
  /** A short note about the data, next to the privacy link. */
  privacy: string;
}

export function leadRecipient(site: ActiveSiteData): LeadRecipient {
  if (site.publishedSlug) {
    return {
      name: site.biz,
      line: `Je bericht gaat direct naar ${site.biz}. Je krijgt meteen te zien of het is aangekomen.`,
      privacy: `Je bericht gaat naar ${site.biz}.`,
    };
  }
  return {
    name: 'Klusbaas',
    line: 'Dit is een demosite: je bericht komt bij Klusbaas binnen.',
    privacy: 'Je bericht komt bij Klusbaas binnen.',
  };
}
