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

test.describe('tooltips outside MDX', () => {
  /**
   * REGRESSION GUARD. The tooltip markup and the script that binds it come from
   * different places: Link.astro emits both, but the resolver shells
   * (IntroSection, StickyExperience) emit the markup through LinkView.svelte and
   * have to import the binder themselves. When Footer and IntroSection stopped
   * rendering Link.astro during the Svelte migration, the homepage kept its
   * data-tippy-content attribute and silently lost the binding — no test noticed,
   * because every tooltip spec pointed at an MDX page.
   */
  test('the homepage intro link still binds a tooltip', async ({ page }) => {
    await page.goto(ROUTES.home);
    const anchor = page.locator('[data-link-tooltip]').first();
    await expect(anchor).toHaveCount(1);

    // Assert the BINDING, not a hover: mobile-chrome emulates touch, where
    // tippy's mouseenter trigger never fires. `_tippy` is what the binder
    // attaches, and its absence is exactly what the regression looked like.
    await expect
      .poll(async () => anchor.evaluate((el) => '_tippy' in el), { timeout: 5000 })
      .toBe(true);
  });
});

