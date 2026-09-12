import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('link tooltips', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithTooltips);
    await expect(page.locator('[data-link-tooltip]').first()).toBeAttached();
  });

  test('appears on hover with the pre-rendered content', async ({ page }) => {
    const link = page.locator('[data-link-tooltip]').first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();

    // tippy is configured with a 300ms show delay.
    const tooltip = page.locator('.tippy-box');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip.locator('.link-tooltip')).toBeAttached();
  });

  test('carries a title or a description, never an empty shell', async ({ page }) => {
    const link = page.locator('[data-link-tooltip]').first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();

    const tooltip = page.locator('.tippy-box');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    const text = (await tooltip.innerText()).trim();
    expect(text.length).toBeGreaterThan(0);
  });

  test('shows the source URL in its footer', async ({ page }) => {
    const link = page.locator('[data-link-tooltip]').first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();

    await expect(page.locator('.tippy-box .link-tooltip-url')).toBeVisible({ timeout: 5000 });
  });

  test('hides again when the pointer leaves', async ({ page }) => {
    const link = page.locator('[data-link-tooltip]').first();
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(page.locator('.tippy-box')).toBeVisible({ timeout: 5000 });

    await page.locator('h1').first().hover();
    await expect(page.locator('.tippy-box')).toBeHidden({ timeout: 5000 });
  });

  test('binds each link exactly once', async ({ page }) => {
    // initLinkTooltips runs on both DOMContentLoaded and astro:page-load; a
    // second tippy instance on the same element would stack two popovers.
    const instances = await page
      .locator('[data-link-tooltip]')
      .evaluateAll((els) => els.filter((el) => (el as any)._tippy).length);
    const total = await page.locator('[data-link-tooltip]').count();

    expect(instances).toBe(total);
  });
});
