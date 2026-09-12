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

  test('shows at most four cards per page', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    await page.locator('.related-grid').scrollIntoViewIfNeeded();

    await expect.poll(async () => page.locator('.related-card:visible').count()).toBeLessThanOrEqual(4);
  });

  test('Refresh swaps in the next page of cards', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    const first = await grid.locator('.related-card:visible a').first().getAttribute('href');
    await page.locator('.related-refresh').click();

    await expect
      .poll(async () => grid.locator('.related-card:visible a').first().getAttribute('href'))
      .not.toBe(first);
  });

  test('Refresh wraps back to the first page', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    const first = await grid.locator('.related-card:visible a').first().getAttribute('href');
    const total = await grid.locator('.related-card').count();
    const pages = Math.ceil(total / 4);

    for (let i = 0; i < pages; i++) await page.locator('.related-refresh').click();

    await expect
      .poll(async () => grid.locator('.related-card:visible a').first().getAttribute('href'))
      .toBe(first);
  });

  test('a series part lists its remaining parts, all at once, with no Refresh', async ({ page }) => {
    await page.goto(ROUTES.seriesPart);
    const grid = page.locator('.related-grid');
    await grid.scrollIntoViewIfNeeded();

    await expect(grid).toHaveAttribute('data-series', '');
    await expect(page.locator('.related-notes-section h2')).toContainText('More in');
    await expect(page.locator('.related-refresh')).toHaveCount(0);

    const total = await grid.locator('.related-card').count();
    await expect.poll(async () => grid.locator('.related-card:visible').count()).toBe(total);
  });

  test('following a related card uses the slide transition flag', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    await page.locator('.related-grid').scrollIntoViewIfNeeded();

    await page.locator('.related-notes-section a').first().click();
    await page.waitForLoadState('domcontentloaded');

    // The flag is consumed on arrival, so its absence afterwards is the proof
    // it was both written and read.
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('nav-from-related')))
      .toBeNull();
  });
});
