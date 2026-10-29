import type {
  ActiveSiteData,
  BlockContentMap,
  ContentBlockId,
  QuizQuestion,
  ServiceOffer,
  SiteContent,
  WizardFormData,
} from '../types';
import { SECTORS, buildSiteText } from '../data/tradesData';
import { defaultBlockContent, isContentBlockId } from '../data/blocks';
import { formatServicePrice, pricedOffers, serviceItems } from './services';
import { areaPrefixes } from './postcodes';

/**
 * The public page of a customer site shows only what the craftsman wrote or
 * supplied.
 *
 * The trade preset is demo material: its reviews, rating, photos, prices and
 * marks belong to nobody. They are a good starting point in the editor, but
 * they never end up on the craftsman's own page (VISION principle 2 and 6).
 * What he wrote stays; what is still the example is left out.
 */

/**
 * A 1×1 transparent image. A published site shows no photo of somebody
 * else's work until the craftsman uploads his own.
 */
export const NO_PHOTO =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** What a craftsman still has to fill in before his site is really his. */
export interface SiteChecklistItem {
  id: string;
  label: string;
  hint: string;
}

/**
 * Text the craftsman wrote himself. `null` when the field is empty or still
 * holds the example text: both mean "not his".
 */
function ownText(value: string | undefined, example: string): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  if (example && trimmed === example.trim()) return null;
  return trimmed;
}

/**
 * Items the craftsman wrote himself: every item that is not one of the
 * example items. Comparing by content instead of by position keeps his own
 * items when he deletes or reorders the example ones.
 */
function ownItems<T>(items: T[] | undefined, example: T[], claim: (item: T) => string): T[] {
  const examples = new Set(example.map(claim));
  return (items ?? []).filter((item) => !examples.has(claim(item)));
}

type PublishedBlock = (custom: never, example: never, form: WizardFormData) => unknown;

/**
 * Per block: what ends up on the public page. A block whose copy is still
 * the example disappears completely; a block he partly wrote keeps only the
 * parts he wrote.
 */
const PUBLISHED_BLOCKS: Record<ContentBlockId, PublishedBlock> = {
  'trust-bar': (custom, example) => {
    const items = ownItems(
      (custom as BlockContentMap['trust-bar']).items,
      (example as BlockContentMap['trust-bar']).items,
      (item) => `${item.title}|${item.text}`
    );
    return items.length ? { items } : null;
  },
  guarantees: (custom, example) => {
    const items = ownItems(
      (custom as BlockContentMap['guarantees']).items,
      (example as BlockContentMap['guarantees']).items,
      (item) => `${item.title}|${item.description}`
    );
    return items.length ? { items } : null;
  },
  testimonial: (custom, example) => {
    const c = custom as BlockContentMap['testimonial'];
    const e = example as BlockContentMap['testimonial'];
    const quote = ownText(c.quote, e.quote);
    if (!quote) return null;
    return {
      quote,
      who: ownText(c.who, e.who) ?? '',
      rating: c.rating === e.rating ? 0 : c.rating,
    };
  },
  'team-member': (custom, example, form) => {
    const c = custom as BlockContentMap['team-member'];
    const e = example as BlockContentMap['team-member'];
    const name = ownText(c.name, e.name) ?? form.owner.trim();
    const text = ownText(c.text, e.text) ?? '';
    if (!name && !text) return null;
    return {
      name,
      role: ownText(c.role, e.role) ?? '',
      text,
      since: ownText(c.since, e.since) ?? '',
    };
  },
  'project-stats': (custom, example) => {
    const stats = ownItems(
      (custom as BlockContentMap['project-stats']).stats,
      (example as BlockContentMap['project-stats']).stats,
      (item) => `${item.value}|${item.label}`
    );
    return stats.length ? { stats } : null;
  },
  'opening-hours': (custom, example) => {
    const c = custom as BlockContentMap['opening-hours'];
    const e = example as BlockContentMap['opening-hours'];
    const hours = ownItems(c.hours, e.hours, (item) => `${item.days}|${item.time}`);
    const note = ownText(c.note, e.note) ?? '';
    return hours.length || note ? { hours, note } : null;
  },
  availability: (custom, example) => {
    const c = custom as BlockContentMap['availability'];
    const e = example as BlockContentMap['availability'];
    const next = ownText(c.next, e.next) ?? '';
    const promises = ownItems(c.promises, e.promises, (item) => item);
    return next || promises.length ? { next, promises } : null;
  },
  promotion: (custom, example) => {
    const c = custom as BlockContentMap['promotion'];
    const e = example as BlockContentMap['promotion'];
    const title = ownText(c.title, e.title) ?? '';
    const description = ownText(c.description, e.description) ?? '';
    const cta = ownText(c.cta, e.cta) ?? '';
    return title || description || cta ? { title, description, cta } : null;
  },
  'service-areas': (custom, example, form) => {
    const c = custom as BlockContentMap['service-areas'];
    const e = example as BlockContentMap['service-areas'];
    const areas = ownItems(c.areas, e.areas, (item) => item);
    // His own place is his own: it never needs to be written.
    const city = form.city.trim();
    if (!areas.length && city) return { areas: [city] };
    return areas.length ? { areas } : null;
  },
  'contact-cta': (custom, example) => {
    const c = custom as BlockContentMap['contact-cta'];
    const e = example as BlockContentMap['contact-cta'];
    const title = ownText(c.title, e.title) ?? '';
    const description = ownText(c.description, e.description) ?? '';
    return title || description ? { title, description } : null;
  },
};

/**
 * The copy of the blocks that go on the public page. A block that is still
 * the example is left out entirely.
 */
export function publishedBlockContent(content: SiteContent): Partial<BlockContentMap> {
  const sector = SECTORS[content.sector];
  const confirmed = content.confirmed ?? [];
  const result: Record<string, unknown> = {};
  for (const id of content.blocks) {
    if (!isContentBlockId(id)) continue;
    const example = defaultBlockContent(sector, id);
    const isConfirmed = confirmed.includes(id);
    const custom = content.blockContent[id];
    // Zonder eigen tekst en zonder bevestiging blijft het blok op de
    // voorbeeldtekst en komt het niet op de site.
    if (!custom && !isConfirmed) continue;
    const base = custom ?? example;
    // Een bevestigd blok gaat mee zoals de vakman het heeft gezien; alleen
    // de cijfers van het voorbeeld blijven buiten de boot.
    const published = isConfirmed
      ? confirmedBlockContent(id, base as never, example as never, content.form)
      : PUBLISHED_BLOCKS[id](base as never, example as never, content.form);
    if (published) result[id] = published;
  }
  return result as Partial<BlockContentMap>;
}

/**
 * The copy of a block the craftsman confirmed. His own text goes as it is;
 * the numbers of the example (a rating, a review count) never do: those
 * belong to nobody.
 */
function confirmedBlockContent(
  id: ContentBlockId,
  custom: never,
  example: never,
  form: WizardFormData
): unknown {
  if (id === 'trust-bar') {
    const items = (custom as BlockContentMap['trust-bar']).items.filter(
      (item) => !/\b\d+[.,]?\d*\s*(uit 5|klantbeoordelingen|beoordelingen)\b/.test(`${item.title} ${item.text}`)
    );
    return items.length ? { items } : null;
  }
  if (id === 'team-member') {
    const c = custom as BlockContentMap['team-member'];
    return {
      name: c.name || form.owner.trim(),
      role: c.role,
      text: c.text,
      since: c.since,
    };
  }
  return custom;
}

/**
 * The services the craftsman wrote himself that carry a price. Only these
 * may be shown on a public page: the prices of the trade preset belong to
 * nobody.
 */
export function ownPricedOffers(content: SiteContent): ServiceOffer[] {
  return pricedOffers((content.services ?? []).filter((offer) => offer.n.trim()));
}

/**
 * The blocks that go on the public page: the ones the craftsman switched on
 * and whose copy is his own, plus the tools that do not show a price.
 *
 * A calculator shows prices, so it only goes on the page when the
 * craftsman wrote his own prices. The example prices of the trade belong to
 * nobody.
 */
export function publishedBlocks(content: SiteContent): ActiveSiteData['blocks'] {
  const sector = SECTORS[content.sector];
  const published = publishedBlockContent(content);
  const priced = ownPricedOffers(content);
  const area = areaPrefixes(content.workArea ?? []);
  return content.blocks.filter((id) => {
    if (id === 'price-calculator') return priced.length > 0;
    // The postcode check says whether the craftsman comes: only with his
    // own work area, never with the area of the trade example.
    if (id === 'area-checker') return area.length > 0;
    if (id === 'trade-tool' && sector.tool === 'm2-calculator') {
      // The m²-calculator works with a price per square metre, so it needs
      // a service with a price per square metre.
      return priced.some((offer) => /m²|m2/i.test(offer.unit ?? ''));
    }
    if (!isContentBlockId(id)) return true; // a tool without prices
    return published[id] !== undefined;
  });
}

/**
 * The page of a customer site, as it must look in public: only what the
 * craftsman wrote or supplied.
 */
export function publishedSite(site: ActiveSiteData, content: SiteContent): ActiveSiteData {
  const sector = SECTORS[content.sector];
  const form = content.form;
  const exampleText = buildSiteText(sector, form);
  const biz = form.biz.trim();
  const city = form.city.trim();
  const owner = form.owner.trim();

  const kicker = ownText(content.text.kicker, exampleText.kicker) ?? sector.name;
  const headline = ownText(content.text.headline, exampleText.headline) ?? biz;
  const intro =
    ownText(content.text.intro, exampleText.intro) ??
    (city
      ? `${sector.name} in ${city}. Neem contact op voor een vrijblijvende offerte.`
      : `${sector.name}. Neem contact op voor een vrijblijvende offerte.`);
  const about = ownText(content.text.about, exampleText.about) ?? '';
  const cta1 = ownText(content.text.cta1, exampleText.cta1) ?? 'Bekijk je diensten';
  const cta2 = ownText(content.text.cta2, exampleText.cta2) ?? '';

  // Prices come from the example until the craftsman writes his own.
  const examplePrices = new Set(sector.services.map((service) => service.p));
  const ownServices = (content.services ?? []).filter((offer) => offer.n.trim());
  const services = ownServices.length
    ? serviceItems(ownServices)
    : site.services.map((service) => ({
        ...service,
        p: examplePrices.has(service.p) ? '' : service.p,
      }));

  // The calculator on the public page works with the craftsman's own
  // services and his own prices.
  const priced = ownPricedOffers(content);
  const flow: QuizQuestion[] = priced.length
    ? [
        {
          q: 'Welke klus wil je laten doen?',
          o: priced.map((offer) => ({
            l: offer.n,
            h: formatServicePrice(offer),
            b: offer.amount,
          })),
        },
      ]
    : site.flow;

  // The work area of the craftsman, not the area of the trade example.
  const near = areaPrefixes(content.workArea ?? []);

  // His own work, with his own photos. The work of the trade preset is demo
  // material: it shows the work of somebody else.
  const ownWork = (content.work ?? []).filter((project) => project.t.trim());
  const heroPhoto = content.heroPhoto ?? '';

  return {
    ...site,
    published: true,
    kicker,
    headline,
    intro,
    about,
    cta1,
    cta2,
    // The example's claims, reviews and photos stay in the editor.
    reviews: [],
    rating: '',
    reviewCount: 0,
    work: ownWork,
    beforeAfter: undefined,
    marks: [],
    since: '',
    faqs: [],
    services,
    near: near.length ? near : site.near,
    servicesTitle: 'Mijn diensten',
    workNote: '',
    estNote: priced.length
      ? 'Vanaf-prijs per klus. De echte prijs hangt af van jouw situatie, dus vraag een offerte.'
      : '',
    flow,
    ownerFirstUpper: owner ? owner.toUpperCase() : '',
    blocks: publishedBlocks(content),
    blockContent: publishedBlockContent(content),
    img: {
      hero: heroPhoto || NO_PHOTO,
      a: NO_PHOTO,
      b: NO_PHOTO,
      c: NO_PHOTO,
      d: NO_PHOTO,
      e: NO_PHOTO,
    },
  };
}

/**
 * What the craftsman still has to fill in. The editor shows this, because a
 * site that only says true things needs real content from him.
 */
export function siteChecklist(content: SiteContent): SiteChecklistItem[] {
  const sector = SECTORS[content.sector];
  const exampleText = buildSiteText(sector, content.form);
  const items: SiteChecklistItem[] = [];

  const form = content.form;
  if (!form.biz.trim()) {
    items.push({
      id: 'biz',
      label: 'Je bedrijfsnaam',
      hint: 'Zonder naam staat er geen bedrijfsnaam op je site.',
    });
  }
  if (!form.phone.trim()) {
    items.push({
      id: 'phone',
      label: 'Je telefoonnummer',
      hint: 'Zonder nummer kan niemand je bellen of appen.',
    });
  }
  if (!form.city.trim()) {
    items.push({
      id: 'city',
      label: 'Je plaats',
      hint: 'Je plaats staat in de titel en helpt bij lokale zoekopdrachten.',
    });
  }
  if (!ownText(content.text.headline, exampleText.headline)) {
    items.push({
      id: 'headline',
      label: 'Een eigen kop boven je site',
      hint: 'Nu staat de voorbeeldkop. Schrijf zelf wat je belooft.',
    });
  }
  if (!ownText(content.text.about, exampleText.about)) {
    items.push({
      id: 'about',
      label: 'Wie je bent',
      hint: 'Een paar eigen woorden over jezelf maken de site van jou.',
    });
  }

  const published = publishedBlockContent(content);
  for (const id of content.blocks) {
    if (!isContentBlockId(id)) continue;
    if (published[id] !== undefined) continue;
    if ((content.confirmed ?? []).includes(id)) continue;
    const label = BLOCK_LABELS[id];
    if (!label) continue;
    items.push({
      id: `block-${id}`,
      label,
      hint: 'Dit blok staat nog op de voorbeeldtekst en komt daarom niet op je site.',
    });
  }

  // The calculator without prices of his own would show the prices of the
  // example, so it stays off the page until he fills them in.
  if (content.blocks.includes('price-calculator') && ownPricedOffers(content).length === 0) {
    items.push({
      id: 'prices',
      label: 'Je eigen prijzen',
      hint: 'Zonder je eigen prijzen blijft de prijscalculator van je site af, want hij zou de voorbeeldprijzen tonen.',
    });
  }

  // The postcode check answers with the work area of the craftsman, so it
  // needs one.
  if (content.blocks.includes('area-checker') && areaPrefixes(content.workArea ?? []).length === 0) {
    items.push({
      id: 'work-area',
      label: 'Je werkgebied',
      hint: 'Typ de postcodes waar je werkt. Zonder je eigen werkgebied blijft de postcodecheck van je site af.',
    });
  }

  return items;
}

const BLOCK_LABELS: Partial<Record<ContentBlockId, string>> = {
  'trust-bar': 'Vertrouwensbalk',
  guarantees: 'Garantielijst',
  testimonial: 'Uitgelichte review',
  'team-member': 'Vakman-introductie',
  'project-stats': 'Projectcijfers',
  'opening-hours': 'Openingstijden',
  availability: 'Beschikbaarheid',
  promotion: 'Actiebanner',
  'service-areas': 'Werkgebied',
  'contact-cta': 'Contactbanner',
};
