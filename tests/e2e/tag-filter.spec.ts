import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

/**
 * Only the tag-chip path exists in the rendered site — the select dropdowns
 * initializeFilters() also looks for are never rendered anywhere.
 */
test.describe('tag chips filter the garden grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithGardenStrip);
    await expect(page.locator('.post-item').first()).toBeVisible();
  });

  test('starts with every card showing', async ({ page }) => {
    const total = await page.locator('.post-item').count();
    const visible = await page.locator('.post-item:visible').count();
    expect(visible).toBe(total);
  });

  test('narrows the grid to cards carrying the chosen tag', async ({ page }) => {
    const chip = page.locator('a[data-tag]').nth(1);
    const tag = await chip.getAttribute('data-tag');
    await chip.click();

    await expect
      .poll(async () =>
        page
          .locator('.post-item:visible')
          .evaluateAll(
            (cards, t) =>
              cards.every((c) => (c.getAttribute('data-tags') ?? '').split(' ').includes(t)),
            tag as string,
          ),
      )
      .toBe(true);
  });

  test('filters in place instead of navigating to /tags/<tag>', async ({ page }) => {
    const before = page.url();
    await page.locator('a[data-tag]').nth(1).click();
    await page.waitForTimeout(300);
    expect(page.url()).toBe(before);
  });

  test('marks the chosen chip active, and only that one', async ({ page }) => {
    const chip = page.locator('a[data-tag]').nth(1);
    await chip.click();

    await expect(chip).toHaveClass(/active/);
    expect(await page.locator('a[data-tag].active').count()).toBe(1);
  });

  test('hides the cards that do not match', async ({ page }) => {
    const total = await page.locator('.post-item').count();
    await page.locator('a[data-tag]').nth(1).click();

    await expect.poll(async () => page.locator('.post-item:visible').count()).toBeLessThan(total);
  });
});
