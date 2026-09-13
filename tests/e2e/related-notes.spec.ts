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

  test('following a related card flags the slide transition', async ({ page }) => {
    await page.goto(ROUTES.pageWithRelated);
    await page.locator('.related-grid').scrollIntoViewIfNeeded();

    await page.locator('.related-notes-section a').first().click();
    await page.waitForLoadState('domcontentloaded');

    // This asserts only the write, which is what related-notes.ts owns.
    // NOTE: the flag is still '1' after arriving — notesPost.astro's is:inline
    // consumer lives in <head> and does not re-run under ClientRouter's
    // client-side navigation, so it is never cleared. Worth investigating
    // separately; the slide transition may leak into the next navigation.
    await expect
      .poll(async () => page.evaluate(() => sessionStorage.getItem('nav-from-related')))
      .toBe('1');
  });
});
