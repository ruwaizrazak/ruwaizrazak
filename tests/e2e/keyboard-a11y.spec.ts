import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { scrollSmoothlyTo, documentTop, settleLayout } from './helpers';

/**
 * Behaviour-level accessibility only — the things these components already
 * declare through ARIA. No axe, no colour-contrast auditing.
 */
test.describe('keyboard and ARIA', () => {
  test('the TOC pill opens from the keyboard and reports its state', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    const toggle = page.locator('[data-toc-toggle]');
    await expect(toggle).toBeVisible();

    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[data-toc-panel]')).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('[data-toc-panel]')).toHaveAttribute('aria-hidden', 'true');
  });

  test('the TOC panel names itself for screen readers', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    await expect(page.locator('[data-toc-panel]')).toHaveAttribute('aria-label', 'Table of contents');
    await expect(page.locator('[data-toc-toggle]')).toHaveAttribute('aria-controls', 'toc-panel');
  });

  test('the active TOC row is announced as the current location', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    // This article grows ~1,700px as its 80+ lazy images decode, so any offset
    // measured before that settles aims the scroll at the wrong section.
    await settleLayout(page);
    // The scroll-spy marks nothing active until a heading crosses its band, so
    // at the very top of the page there is legitimately no current row.
    const secondHeadingTop = await documentTop(page, '.note-layout article :is(h1,h2,h3)', 1);
    await scrollSmoothlyTo(page, secondHeadingTop - 150);

    await page.locator('[data-toc-toggle]').click();
    await expect(page.locator('[data-toc-link][data-active]').first()).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  test('the theme toggle is reachable and labelled', async ({ page }) => {
    await page.goto(ROUTES.home);
    const toggle = page.locator('#theme-toggle');

    await expect(toggle).toHaveAttribute('aria-label', 'Toggle theme');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('theme'))).not.toBeNull();
  });

  test('the demo pill is operable by keyboard too', async ({ page }) => {
    await page.goto(ROUTES.pageWithTocDemo);
    const toggle = page.locator('[data-tocdemo-toggle]').first();

    // LEARN: the demo is a hydrated island now, and an island's dynamic import
    // resolves later than the DOMContentLoaded script it replaced. Pressing Enter
    // before hydration drops the keypress — webkit lost it consistently. Wait for
    // Astro to clear the `ssr` marker, which is when the handlers are live.
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached({
      timeout: 15000,
    });

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-tocdemo-pill]').first()).toHaveAttribute('data-expanded', '');

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-tocdemo-pill]').first()).not.toHaveAttribute('data-expanded', '');
  });

  test('every page exposes a main landmark and a single h1', async ({ page }) => {
    for (const route of [ROUTES.home, ROUTES.garden, ROUTES.pageWithToc, ROUTES.worksIndex]) {
      await page.goto(route);
      await expect(page.locator('h1'), `${route}`).toHaveCount(1);
      await expect(page.locator('main, article').first(), `${route}`).toBeAttached();
    }
  });

  test('images carry alt text on a content page', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    const missing = await page
      .locator('img')
      .evaluateAll((imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
    expect(missing).toBe(0);
  });
});
