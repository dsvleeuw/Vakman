import { expect, test } from '@playwright/test';

test('wizard doorloopt vak tot en met offerte met een gemockte leadaanvraag', async ({ page }) => {
  let leadPayload: Record<string, unknown> | undefined;

  await page.route('**/api/lead', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }

    leadPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        mode: 'preview',
        reference: 'KB-TEST-0001',
        delivery: {
          team: { to: 'hallo@klusbaas.nl', status: 'preview' },
          customer: { to: 'sanne@example.test', status: 'preview' },
        },
      }),
    });
  });

  await page.goto('/start/vak', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Wat is jouw vak?' })).toBeVisible();

  await page.getByRole('button', { name: 'Kies Loodgieter' }).click();
  await expect(page).toHaveURL(/\/start\/vak\?vak=loodgieter&stijl=klassiek$/);
  await page.getByRole('button', { name: 'Volgende stap →' }).click();
  await expect(page).toHaveURL(/\/start\/stijl(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Welke stijl past bij jou?' })).toBeVisible();

  await page.getByRole('button', { name: /Signaal/ }).click();
  await expect(page).toHaveURL(/\/start\/stijl\?vak=loodgieter&stijl=krachtig$/);
  await page.getByRole('button', { name: 'Volgende stap →' }).click();
  await expect(page).toHaveURL(/\/start\/gegevens(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Jouw bedrijfsgegevens' })).toBeVisible();

  await page.locator('#wizard-biz').fill('Testbedrijf Tilburg');
  await page.locator('#wizard-owner').fill('Sanne Jansen');
  await page.locator('#wizard-phone').fill('06 98 76 54 32');
  await page.locator('#wizard-city').fill('Tilburg');
  await page.getByRole('button', { name: 'Volgende stap →' }).click();
  await expect(page).toHaveURL(/\/start\/diensten(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Welke diensten bied je aan?' })).toBeVisible();

  await page.getByRole('button', { name: 'Volgende stap →' }).click();
  await expect(page).toHaveURL(/\/start\/afspraak(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Je website staat klaar.' })).toBeVisible();

  await page.getByRole('group', { name: 'Kanaal voor de offerte' }).getByRole('button', { name: 'E-mail' }).click();
  await page.locator('#wizard-email').fill('sanne@example.test');
  await page.getByRole('button', { name: /^Offerte aanvragen/ }).click();

  await expect(page).toHaveURL(/\/start\/klaar(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Offerte aangevraagd!' })).toBeVisible();
  expect(leadPayload).toMatchObject({
    type: 'quote',
    sector: 'loodgieter',
    channel: 'E-mail',
    form: {
      biz: 'Testbedrijf Tilburg',
      owner: 'Sanne Jansen',
      phone: '06 98 76 54 32',
      city: 'Tilburg',
      email: 'sanne@example.test',
    },
  });
});
