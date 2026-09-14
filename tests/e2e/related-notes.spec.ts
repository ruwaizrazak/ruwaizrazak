import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('related notes', () => {
  test('reveals its cards once scrolled into view', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    await expect(grid.locator('.related-card:visible').first()).toBeVisible();
    await expect
      .poll(async () =>
        grid.locator('.related-card:visible').first().evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe('1');
  });

  test('shows the full related set at once with no Refresh control', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    const total = await grid.locator('.related-card').count();
    await expect.poll(async () => grid.locator('.related-card:visible').count()).toBe(total);
    await expect(page.locator('.related-refresh')).toHaveCount(0);
  });

  test('a series part lists its remaining parts, all at once, with no Refresh', async ({ page }) => {
    await page.goto(ROUTES.seriesPart);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    await expect(grid).toHaveAttribute('data-series', '');
    await expect(page.locator('.related-notes-section h2').first()).toContainText('More in');
    await expect(page.locator('.related-refresh')).toHaveCount(0);

    const total = await grid.locator('.related-card').count();
    await expect.poll(async () => grid.locator('.related-card:visible').count()).toBe(total);
  });
});
