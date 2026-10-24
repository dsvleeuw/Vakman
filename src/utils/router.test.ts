import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STYLE_ID,
  buildPath,
  getRouteMeta,
  mergeDemoPersonalization,
  parseRoute,
  routeFromLegacyQuery,
  styleIdFromIndex,
  styleIndexFromId,
  type Route,
} from './router';
import { STYLES } from '../data/tradesData';

test('home is the root path and can preselect a trade', () => {
  assert.deepEqual(parseRoute('/'), { name: 'home' });
  assert.deepEqual(parseRoute('/', '?vak=loodgieter'), { name: 'home', sector: 'loodgieter' });
  assert.equal(buildPath({ name: 'home' }), '/');
  assert.equal(buildPath({ name: 'home', sector: 'schilder' }), '/?vak=schilder');
});

test('a generated site gets a readable sector/style URL', () => {
  assert.deepEqual(parseRoute('/voorbeeld/hovenier/modern'), {
    name: 'site',
    sector: 'hovenier',
    styleId: 'modern',
  });
  assert.equal(
    buildPath({ name: 'site', sector: 'hovenier', styleId: 'modern' }),
    '/voorbeeld/hovenier/modern'
  );
});

test('a site URL without a style falls back to the first style', () => {
  const route = parseRoute('/voorbeeld/stukadoor');
  assert.deepEqual(route, { name: 'site', sector: 'stukadoor', styleId: DEFAULT_STYLE_ID });
  assert.equal(buildPath(route), '/voorbeeld/stukadoor/klassiek');
});

test('unknown sectors and styles are a 404, not a crash', () => {
  assert.deepEqual(parseRoute('/voorbeeld/spacex/modern'), {
    name: 'notFound',
    path: '/voorbeeld/spacex/modern',
  });
  assert.deepEqual(parseRoute('/voorbeeld/loodgieter/neon'), {
    name: 'notFound',
    path: '/voorbeeld/loodgieter/neon',
  });
  assert.deepEqual(parseRoute('/iets-anders'), { name: 'notFound', path: '/iets-anders' });
});

test('every wizard step has its own path', () => {
  assert.deepEqual(parseRoute('/start'), { name: 'wizard', step: 'vak' });
  assert.deepEqual(parseRoute('/start/vak'), { name: 'wizard', step: 'vak' });
  assert.deepEqual(parseRoute('/start/stijl'), { name: 'wizard', step: 'stijl' });
  assert.deepEqual(parseRoute('/start/gegevens'), { name: 'wizard', step: 'gegevens' });
  assert.deepEqual(parseRoute('/start/diensten'), { name: 'wizard', step: 'diensten' });
  assert.deepEqual(parseRoute('/start/afspraak'), { name: 'wizard', step: 'afspraak' });
  assert.deepEqual(parseRoute('/start/klaar'), { name: 'wizard', step: 'klaar' });
  assert.deepEqual(parseRoute('/start/onzin'), { name: 'notFound', path: '/start/onzin' });
});

test('wizard URLs carry the selected trade and style', () => {
  const route = parseRoute('/start/gegevens', '?vak=elektricien&stijl=krachtig');
  assert.deepEqual(route, {
    name: 'wizard',
    step: 'gegevens',
    sector: 'elektricien',
    styleId: 'krachtig',
  });
  assert.equal(
    buildPath({ name: 'wizard', step: 'gegevens', sector: 'elektricien', styleId: 'krachtig' }),
    '/start/gegevens?vak=elektricien&stijl=krachtig'
  );
});

test('the chosen package travels through the wizard URL', () => {
  assert.deepEqual(parseRoute('/start/vak', '?pakket=pro'), {
    name: 'wizard',
    step: 'vak',
    plan: 'pro',
  });
  assert.equal(
    buildPath({ name: 'wizard', step: 'afspraak', plan: 'premium', sector: 'schilder' }),
    '/start/afspraak?vak=schilder&pakket=premium'
  );
  // An unknown package is ignored instead of breaking the wizard.
  assert.deepEqual(parseRoute('/start/vak', '?pakket=goud'), { name: 'wizard', step: 'vak' });
});

test('component library selections are deep-linkable', () => {
  assert.deepEqual(parseRoute('/componenten'), { name: 'components' });
  assert.deepEqual(parseRoute('/componenten/trust-bar'), {
    name: 'components',
    componentId: 'trust-bar',
  });
  assert.equal(
    buildPath({ name: 'components', componentId: 'trust-bar' }),
    '/componenten/trust-bar'
  );
});

test('parsing then rebuilding a path is stable', () => {
  const paths = [
    '/',
    '/?vak=timmerman',
    '/voorbeeld/loodgieter/krachtig',
    '/start/vak',
    '/start/gegevens?vak=schilder&stijl=donker',
    '/start/vak?pakket=pro',
    '/start/klaar',
    '/componenten',
    '/componenten/price-calculator',
  ];
  for (const path of paths) {
    const [pathname, search = ''] = path.split('?');
    assert.equal(buildPath(parseRoute(pathname, search ? `?${search}` : '')), path);
  }
});

test('style ids and indexes round-trip and clamp', () => {
  STYLES.forEach((style, index) => {
    assert.equal(styleIndexFromId(style.id), index);
    assert.equal(styleIdFromIndex(index), style.id);
  });
  assert.equal(styleIdFromIndex(-4), STYLES[0].id);
  assert.equal(styleIdFromIndex(99), STYLES[STYLES.length - 1].id);
});

test('old query-param links redirect to real routes', () => {
  assert.deepEqual(routeFromLegacyQuery('?sector=loodgieter&style=2&view=site'), {
    name: 'site',
    sector: 'loodgieter',
    styleId: 'krachtig',
  });
  assert.deepEqual(routeFromLegacyQuery('?autostart=1'), {
    name: 'site',
    sector: 'timmerman',
    styleId: 'klassiek',
  });
  assert.deepEqual(routeFromLegacyQuery('?view=components'), { name: 'components' });
  assert.deepEqual(routeFromLegacyQuery('?view=start'), {
    name: 'wizard',
    step: 'vak',
    sector: undefined,
    styleId: undefined,
  });
  assert.deepEqual(routeFromLegacyQuery('?vak=hovenier'), null);
  assert.equal(routeFromLegacyQuery(''), null);
});

test('every route gets a unique, descriptive document title', () => {
  const routes: Route[] = [
    { name: 'home' },
    { name: 'site', sector: 'loodgieter', styleId: 'krachtig' },
    { name: 'wizard', step: 'gegevens' },
    { name: 'wizard', step: 'klaar' },
    { name: 'components' },
    { name: 'notFound', path: '/x' },
  ];

  const titles = routes.map((route) => getRouteMeta(route).title);
  assert.equal(new Set(titles).size, titles.length);
  for (const title of titles) {
    assert.ok(title.length > 0);
  }
  assert.match(getRouteMeta({ name: 'wizard', step: 'gegevens' }).title, /Stap 3 van 6/);
  assert.deepEqual(parseRoute('/start/extras', '?pakket=pro'), { name: 'wizard', step: 'extras', plan: 'pro' });
  assert.match(
    getRouteMeta({ name: 'site', sector: 'loodgieter', styleId: 'krachtig' }).title,
    /loodgieter/i
  );
});

test('a personal demo link carries name, place and a valid phone', () => {
  const route = parseRoute(
    '/voorbeeld/schilder/modern',
    '?naam=Schildersbedrijf%20Jansen&plaats=Hoofddorp&tel=%2B31%206%2012345670'
  );
  assert.deepEqual(route, {
    name: 'site',
    sector: 'schilder',
    styleId: 'modern',
    personal: { biz: 'Schildersbedrijf Jansen', city: 'Hoofddorp', phone: '0612345670' },
  });
  assert.equal(
    buildPath(route),
    '/voorbeeld/schilder/modern?naam=Schildersbedrijf+Jansen&plaats=Hoofddorp&tel=0612345670'
  );
  assert.deepEqual(parseRoute(buildPath(route).split('?')[0], `?${buildPath(route).split('?')[1]}`), route);
});

test('personal demo params are trimmed, capped and validated', () => {
  const route = parseRoute(
    '/voorbeeld/schilder/modern',
    `?naam=${encodeURIComponent('  Jansen   &  Zn  ')}&plaats=%20%20&tel=12345&extra=1`
  );
  assert.deepEqual(route, {
    name: 'site',
    sector: 'schilder',
    styleId: 'modern',
    personal: { biz: 'Jansen & Zn' },
  });
  const long = parseRoute('/voorbeeld/schilder/modern', `?naam=${'a'.repeat(200)}`);
  assert.equal(long.name === 'site' && long.personal?.biz?.length, 60);
  // Nothing usable means no personalization at all, so the canonical URL stays clean.
  const empty = parseRoute('/voorbeeld/schilder/modern', '?naam=&tel=abc');
  assert.deepEqual(empty, { name: 'site', sector: 'schilder', styleId: 'modern' });
  assert.equal(buildPath(empty), '/voorbeeld/schilder/modern');
});

test('the wizard accepts prefilled details from "Maak dit mijn website"', () => {
  const route: Route = {
    name: 'wizard',
    step: 'gegevens',
    sector: 'schilder',
    styleId: 'modern',
    prefill: { biz: 'Schildersbedrijf Jansen', city: 'Hoofddorp' },
  };
  const path = buildPath(route);
  assert.equal(
    path,
    '/start/gegevens?vak=schilder&stijl=modern&naam=Schildersbedrijf+Jansen&plaats=Hoofddorp'
  );
  const [pathname, query] = path.split('?');
  assert.deepEqual(parseRoute(pathname, `?${query}`), route);
});

test('mergeDemoPersonalization lets the link win and keeps sector fallbacks', () => {
  assert.equal(mergeDemoPersonalization(undefined, undefined), undefined);
  const saved = { biz: 'Oud BV', owner: 'Piet', phone: '0611111111', city: 'Delft' };
  assert.equal(mergeDemoPersonalization(saved, undefined), saved);
  assert.deepEqual(mergeDemoPersonalization(undefined, { biz: 'Jansen' }), {
    biz: 'Jansen',
    owner: '',
    phone: '',
    city: '',
  });
  assert.deepEqual(mergeDemoPersonalization(saved, { city: 'Hoofddorp' }), {
    ...saved,
    city: 'Hoofddorp',
  });
});

test('quote links keep the token and round-trip', () => {
  const token = 'f'.repeat(64);
  const route = parseRoute('/offerte/KB-2026-0001', `?token=${token}`);
  assert.deepEqual(route, { name: 'quote', quoteId: 'KB-2026-0001', token });
  assert.equal(buildPath(route), `/offerte/KB-2026-0001?token=${token}`);
  assert.deepEqual(parseRoute('/offerte/KB-2026-0001'), { name: 'quote', quoteId: 'KB-2026-0001' });
  assert.equal(parseRoute('/offerte').name, 'notFound');
  assert.equal(parseRoute('/offerte/a/b').name, 'notFound');
  assert.match(getRouteMeta(route).title, /KB-2026-0001/);
});
