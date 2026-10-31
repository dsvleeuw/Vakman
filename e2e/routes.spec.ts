import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  { path: '/', label: 'homepage' },
  { path: '/voorbeeld/loodgieter/krachtig', label: 'loodgieter-voorbeeld' },
  { path: '/voorbeeld/hovenier/donker', label: 'hovenier-voorbeeld' },
  { path: '/voorbeeld/aannemer/klassiek', label: 'aannemer-voorbeeld' },
  { path: '/start/vak', label: 'wizard' },
  { path: '/privacy', label: 'privacyverklaring' },
  { path: '/nieuwsbrief', label: 'nieuwsbrief' },
  { path: '/componenten', label: 'componentenbibliotheek' },
  { path: '/mijn-site', label: 'site-editor' },
  {
    path: '/deze-route-bestaat-niet',
    label: 'onbekende route',
    expectedHeading: 'Deze pagina bestaat niet (meer).',
  },
] as const;

const FORM_FONT_ROUTES = ROUTES.filter((route) => route.path !== '/componenten');
const DEMO_PHONE_NUMBERS = ['06 12 34 56 78', '06 45 67 89 01'];

async function visit(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#main-content').first()).toBeVisible();
}

async function expectNoEmptyLinks(page: Page): Promise<void> {
  const invalidLinks = await page.locator('a').evaluateAll((links) =>
    links.flatMap((link) => {
      const href = link.getAttribute('href')?.trim();
      if (href && href !== '#') return [];
      return [
        {
          href: href ?? null,
          text: link.textContent?.trim() || '(zonder tekst)',
        },
      ];
    })
  );

  expect(invalidLinks).toEqual([]);
}

async function expectFormControlsAtLeast16Px(page: Page): Promise<void> {
  const undersizedControls = await page.locator('input, select, textarea').evaluateAll((controls) =>
    controls.flatMap((control) => {
      const fontSize = Number.parseFloat(window.getComputedStyle(control).fontSize);
      if (!Number.isFinite(fontSize) || fontSize >= 16) return [];
      return [
        {
          fontSize,
          id: control.id || null,
          name: control.getAttribute('name'),
          tagName: control.tagName.toLowerCase(),
          type: control.getAttribute('type'),
        },
      ];
    })
  );

  expect(undersizedControls).toEqual([]);
}

test('publieke routes renderen zonder consolefouten of lege links', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  for (const route of ROUTES) {
    const errorCount = consoleErrors.length;
    await visit(page, route.path);

    if ('expectedHeading' in route) {
      await expect(page.getByRole('heading', { name: route.expectedHeading })).toBeVisible();
    }

    await expectNoEmptyLinks(page);
    expect(consoleErrors.slice(errorCount), `${route.label} logged console errors`).toEqual([]);
  }
});

test('formuliervelden gebruiken minstens 16px tekst buiten de componentengalerij', async ({ page }) => {
  for (const route of FORM_FONT_ROUTES) {
    await visit(page, route.path);
    await expectFormControlsAtLeast16Px(page);
  }
});

test('de componentengalerij gebruikt minstens 16px tekst in formuliervelden', async ({ page }) => {
  test.fixme(
    true,
    'Op desktop gebruikt #component-search in src/components/ComponentGallery.tsx sm:text-sm (14px). App-code valt buiten deze taak.'
  );

  await visit(page, '/componenten');
  await expectFormControlsAtLeast16Px(page);
});

async function expectNoDemoPhoneNumbers(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  for (const phoneNumber of DEMO_PHONE_NUMBERS) {
    expect(text).not.toContain(phoneNumber);
  }
}

test('de site-editor opent met de site en de blokken', async ({ page }) => {
  await visit(page, '/mijn-site');

  await expect(page.getByRole('heading', { name: 'Je eigen site' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Blok toevoegen/ })).toBeVisible();
});

test('het hovenier-voorbeeld toont geen voorbeeldtelefoonnummers', async ({ page }) => {
  await visit(page, '/voorbeeld/hovenier/donker');
  await expectNoDemoPhoneNumbers(page);
});

test('het aannemer-voorbeeld toont zijn eigen projecttijdlijn', async ({ page }) => {
  await visit(page, '/voorbeeld/aannemer/klassiek');

  await expect(
    page.getByRole('heading', { name: 'Van de eerste scheppen spade tot de sleutel.' })
  ).toBeVisible();
  await expect(page.getByText('Casco: fundering, muren en dak')).toBeVisible();
  // De belofte van de timmerman hoort niet op de site van de aannemer.
  await expect(page.getByText('in 2 weken')).toHaveCount(0);
});

test('het loodgieter-voorbeeld toont geen voorbeeldtelefoonnummers', async ({ page }) => {
  test.fixme(
    true,
    'Het loodgieter-voorbeeld toont nog 06 45 67 89 01 uit src/data/tradesData.ts. App-data valt buiten deze taak.'
  );

  await visit(page, '/voorbeeld/loodgieter/krachtig');
  await expectNoDemoPhoneNumbers(page);
});
