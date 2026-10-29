import test from 'node:test';
import assert from 'node:assert/strict';
import { buildActiveSite } from '../data/tradesData';
import { defaultSiteContent } from './siteContent';
import { publishedSite, siteChecklist, NO_PHOTO } from './publishedContent';
import type { SiteContent } from '../types';

const FORM = {
  biz: 'Jansen Schilderwerken',
  owner: 'Jan Jansen',
  phone: '0698765432',
  city: 'Haarlem',
};

function content(overrides: Partial<SiteContent> = {}): SiteContent {
  const base = defaultSiteContent('schilder', 'modern', FORM);
  return { ...base, ...overrides };
}

function site(withContent: SiteContent) {
  return publishedSite(
    buildActiveSite('schilder', 0, withContent.form, withContent.disabledServices, undefined, true),
    withContent
  );
}

test('een gepubliceerde site toont geen voorbeeldreviews, cijfers of keurmerken', () => {
  const published = site(content());

  assert.deepEqual(published.reviews, []);
  assert.equal(published.rating, '');
  assert.equal(published.reviewCount, 0);
  assert.deepEqual(published.marks, []);
  assert.equal(published.since, '');
  assert.deepEqual(published.work, []);
  assert.equal(published.beforeAfter, undefined);
  assert.deepEqual(published.faqs, []);
});

test('een gepubliceerde site toont geen foto van iemand anders werk', () => {
  const published = site(content());

  assert.equal(published.img.hero, NO_PHOTO);
  assert.equal(published.img.d, NO_PHOTO);
});

test('een gepubliceerde site toont geen voorbeeldprijzen', () => {
  const published = site(content());

  assert.ok(published.services.length > 0);
  for (const service of published.services) {
    assert.equal(service.p, '', 'voorbeeldprijzen horen niet op een klantsite');
  }
});

test('een gepubliceerde site houdt de tekst van de vakman', () => {
  const published = site(
    content({
      text: {
        kicker: 'Schilder · HAARLEM',
        headline: 'Ik maak jouw muur mooi',
        intro: 'Ik schilder je huis in Haarlem en omgeving.',
        about: 'Ik ben Jan en ik werk al twintig jaar in de schilderij.',
        cta1: 'Vraag een offerte',
        cta2: 'Bel me direct',
      },
    })
  );

  assert.equal(published.headline, 'Ik maak jouw muur mooi');
  assert.equal(published.intro, 'Ik schilder je huis in Haarlem en omgeving.');
  assert.equal(published.about, 'Ik ben Jan en ik werk al twintig jaar in de schilderij.');
  assert.equal(published.cta1, 'Vraag een offerte');
  assert.equal(published.cta2, 'Bel me direct');
});

test('blokken die nog op de voorbeeldtekst staan, komen niet op de site', () => {
  const published = site(content());

  assert.ok(!published.blocks.includes('trust-bar'));
  assert.ok(!published.blocks.includes('opening-hours'));
  assert.ok(!published.blocks.includes('testimonial'));
  // De prijscalculator rekent met voorbeeldprijzen en blijft dus weg.
  assert.ok(!published.blocks.includes('price-calculator'));
});

test('een blok dat de vakman heeft aangepast, komt op de site', () => {
  const base = content();
  const published = site({
    ...base,
    blocks: [...base.blocks, 'opening-hours'],
    blockContent: {
      ...base.blockContent,
      'opening-hours': {
        hours: [
          { days: 'Maandag – vrijdag', time: '08:00 – 17:00' },
          { days: 'Zaterdag', time: '10:00 – 14:00' },
        ],
        note: 'Buiten deze tijden kun je een bericht achterlaten.',
      },
    },
  });

  assert.ok(published.blocks.includes('opening-hours'));
  const hours = published.blockContent['opening-hours'];
  assert.equal(hours?.hours.length, 2);
});

test('een bevestigd blok komt op de site, ook als het op de voorbeeldtekst staat', () => {
  const base = content();
  const published = site({
    ...base,
    blocks: [...base.blocks, 'opening-hours'],
    confirmed: ['opening-hours'],
  });

  assert.ok(published.blocks.includes('opening-hours'));
  const hours = published.blockContent['opening-hours'];
  assert.equal(hours?.hours.length, 3);
  assert.equal(hours?.note, 'Buiten deze tijden kun je gewoon een bericht achterlaten. Je krijgt zo snel mogelijk reactie.');
});

test('een bevestigde vertrouwensbalk laat de cijfers van het voorbeeld achterwege', () => {
  const base = content();
  const published = site({
    ...base,
    blocks: [...base.blocks, 'trust-bar'],
    confirmed: ['trust-bar'],
  });

  const items = published.blockContent['trust-bar']?.items ?? [];
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.ok(
      !item.title.includes('uit 5') && !item.text.includes('klantbeoordelingen'),
      'een beoordelingscijfer uit het voorbeeld hoort nooit op een klantsite'
    );
  }
});

test('een half aangepast blok houdt alleen wat de vakman schreef', () => {
  const base = content();
  const published = site({
    ...base,
    blocks: [...base.blocks, 'trust-bar'],
    blockContent: {
      ...base.blockContent,
      'trust-bar': {
        items: [
          { icon: 'shield', title: 'VCA gecertificeerd', text: 'Erkend in Haarlem en omgeving' },
          { icon: 'clock', title: 'Snelle reactie', text: 'Meestal binnen één uur antwoord' },
        ],
      },
    },
  });

  const items = published.blockContent['trust-bar']?.items ?? [];
  assert.equal(items.length, 1, 'alleen het item dat de vakman zelf schreef blijft over');
  assert.equal(items[0].title, 'VCA gecertificeerd');
});

test('de checklijst zegt wat er nog ingevuld moet worden', () => {
  const items = siteChecklist(content());
  const ids = items.map((item) => item.id);

  assert.ok(ids.includes('headline'), 'de voorbeeldkop moet worden vervangen');
  assert.ok(ids.includes('about'), 'het voorbeeldverhaal moet worden vervangen');
});

test('een volledig ingevulde site heeft niets meer op de checklijst', () => {
  const base = content();
  const done = siteChecklist({
    ...base,
    services: [{ n: 'Binnen schilderwerk', d: 'Wanden en kozijnen', amount: 45, unit: 'per uur' }],
    workArea: ['2011 AB'],
    text: {
      kicker: 'Schilder · HAARLEM',
      headline: 'Ik maak jouw muur mooi',
      intro: 'Ik schilder je huis in Haarlem en omgeving.',
      about: 'Ik ben Jan.',
      cta1: 'Vraag een offerte',
      cta2: 'Bel me direct',
    },
  });

  assert.deepEqual(done, []);
});

test('de checklijst vraagt om eigen prijzen en een eigen werkgebied', () => {
  const ids = siteChecklist(content()).map((item) => item.id);
  assert.ok(ids.includes('prices'), 'zonder eigen prijzen blijft de calculator van de site');
  assert.ok(ids.includes('work-area'), 'zonder eigen werkgebied blijft de postcodecheck van de site');
});

test('de calculator komt op de site zodra de vakman zijn eigen prijzen heeft', () => {
  const base = content();
  const published = site({
    ...base,
    services: [{ n: 'Binnen schilderwerk', d: 'Wanden en kozijnen', amount: 45, unit: 'per uur' }],
  });

  assert.ok(published.blocks.includes('price-calculator'));
  assert.equal(published.flow.length, 1);
  assert.equal(published.flow[0].o.length, 1);
  assert.equal(published.flow[0].o[0].l, 'Binnen schilderwerk');
  assert.equal(published.flow[0].o[0].b, 45);
  assert.equal(published.flow[0].o[0].h, '€ 45 per uur');
});

test('de site toont de diensten en prijzen van de vakman', () => {
  const base = content();
  const published = site({
    ...base,
    services: [
      { n: 'Binnen schilderwerk', d: 'Wanden en kozijnen', amount: 45, unit: 'per uur' },
      { n: 'Advies op locatie', d: 'Kijk ik mee en geef ik advies', amount: 0 },
    ],
  });

  assert.equal(published.services.length, 2);
  assert.equal(published.services[0].n, 'Binnen schilderwerk');
  assert.equal(published.services[0].p, '€ 45 per uur');
  assert.equal(published.services[1].p, '', 'een dienst zonder prijs toont geen prijs');
});

test('de calculator blijft weg als de vakman geen prijzen heeft', () => {
  const published = site(content());
  assert.ok(!published.blocks.includes('price-calculator'));
});

test('de postcodecheck komt op de site met het werkgebied van de vakman', () => {
  const base = content();
  const published = site({ ...base, workArea: ['2011 AB'] });

  assert.ok(published.blocks.includes('area-checker'));
  assert.deepEqual(published.near, ['20']);
});

test('de postcodecheck blijft weg zonder het werkgebied van de vakman', () => {
  const published = site(content());
  assert.ok(!published.blocks.includes('area-checker'));
});
