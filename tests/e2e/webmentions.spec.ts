import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

/**
 * These only render because playwright.config.ts builds with TEST_FIXTURES=1,
 * which swaps src/data/webmentions.json (empty in the repo) for the sample
 * cache in tests/fixtures. Without it none of this markup exists.
 */
test.describe('webmentions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithWebmentions);
    await expect(page.locator('.wm-mentions-section')).toBeVisible();
  });

  test('shows only the first four replies', async ({ page }) => {
    await expect(page.locator('.wm-reply:not(.wm-hidden)')).toHaveCount(4);
  });

  test('labels the button with how many are hidden', async ({ page }) => {
    const total = await page.locator('.wm-reply').count();
    await expect(page.locator('.wm-show-more')).toHaveText(`Show ${total - 4} more`);
  });

  test('reveals the rest and flips the label', async ({ page }) => {
    const total = await page.locator('.wm-reply').count();
    await page.locator('.wm-show-more').click();

    await expect(page.locator('.wm-reply:not(.wm-hidden)')).toHaveCount(total);
    await expect(page.locator('.wm-show-more')).toHaveText('Show less');
  });

  test('collapses back to four', async ({ page }) => {
    const button = page.locator('.wm-show-more');
    await button.click();
    await button.click();

    await expect(page.locator('.wm-reply:not(.wm-hidden)')).toHaveCount(4);
    await expect(button).not.toHaveText('Show less');
  });

  test('renders the likes row with a count', async ({ page }) => {
    await expect(page.locator('.wm-likes-count')).toContainText('Like');
  });

  test('opens reply sources safely in a new tab', async ({ page }) => {
    const link = page.locator('.wm-reply-meta').first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('rel', /noreferrer/);
  });
});
