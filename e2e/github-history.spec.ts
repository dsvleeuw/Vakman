import { expect, test } from '@playwright/test';

test('de Klusbaas-homepage en de GitHub-geschiedenis blijven gescheiden', async ({ page }) => {
  // The history page uses a third-party styling CDN; the test checks content,
  // not that external service's availability.
  await page.route(/^https:\/\/cdn\.tailwindcss\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#main-content').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'GitHub Geschiedenis', exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="/github-history"]')).toHaveCount(0);

  await page.goto('/github-history/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'GitHub Geschiedenis', exact: true })).toBeVisible();
});
