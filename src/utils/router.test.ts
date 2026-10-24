import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STYLE_ID,
  buildPath,
  getRouteMeta,
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
  assert.match(getRouteMeta({ name: 'wizard', step: 'gegevens' }).title, /Stap 3 van 5/);
  assert.match(
    getRouteMeta({ name: 'site', sector: 'loodgieter', styleId: 'krachtig' }).title,
    /loodgieter/i
  );
});
