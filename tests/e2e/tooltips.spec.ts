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

  test('binds nothing until the reader interacts', async ({ page }) => {
    // tippy is 36KB and loads on first pointerover/focusin, so an untouched page
    // must carry no instances at all — that is the whole point of deferring it.
    const bound = await page
      .locator('[data-link-tooltip]')
      .evaluateAll((els) => els.filter((el) => (el as any)._tippy).length);
    expect(bound).toBe(0);
  });

  test('binds every link exactly once, on first interaction', async ({ page }) => {
    // One interaction loads the library and binds the whole page. A second
    // instance on the same element would stack two popovers.
    // The attribute sits on the wrapper <span>, which is not focusable — focus the
    // anchor inside it. focusin bubbles, and the delegated handler walks back up
    // to the span via closest().
    await page.locator('[data-link-tooltip] a').first().focus();

    const total = await page.locator('[data-link-tooltip]').count();
    await expect
      .poll(
        async () =>
          page
            .locator('[data-link-tooltip]')
            .evaluateAll((els) => els.filter((el) => (el as any)._tippy).length),
        { timeout: 10000 },
      )
      .toBe(total);

    // Interacting again must not create a second instance anywhere.
    await page.locator('[data-link-tooltip] a').nth(1).focus();
    const bound = await page
      .locator('[data-link-tooltip]')
      .evaluateAll((els) => els.filter((el) => (el as any)._tippy).length);
    expect(bound).toBe(total);
  });
});

test.describe('tooltips outside MDX', () => {
  /**
   * REGRESSION GUARD. The tooltip markup and the script that binds it come from
   * different places: Link.astro emits both, but the resolver shells
   * (IntroSection, ExperienceLedger) emit the markup through LinkView.svelte and
   * have to import the binder themselves. When Footer and IntroSection stopped
   * rendering Link.astro during the Svelte migration, the homepage kept its
   * data-tippy-content attribute and silently lost the binding — no test noticed,
   * because every tooltip spec pointed at an MDX page.
   */
  test('the homepage intro link still binds a tooltip', async ({ page }) => {
    await page.goto(ROUTES.home);
    const anchor = page.locator('[data-link-tooltip]').first();
    await expect(anchor).toHaveCount(1);

    // LEARN: tippy is lazy now — it loads on the first pointerover/focusin, so
    // there is nothing bound until the reader interacts. Focus rather than hover:
    // mobile-chrome emulates touch, where a hover trigger never fires, and
    // focusin works everywhere. `_tippy` is what the binder attaches, and its
    // absence is exactly what the regression looked like.
    await anchor.locator('a').first().focus();
    await expect
      .poll(async () => anchor.evaluate((el) => '_tippy' in el), { timeout: 10000 })
      .toBe(true);
  });
});
