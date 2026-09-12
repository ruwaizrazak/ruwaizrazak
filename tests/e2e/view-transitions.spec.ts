import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('client-side navigation', () => {
  test('navigating between pages keeps the site interactive', async ({ page }) => {
    // Astro's ClientRouter swaps the document; every initOnLoad-wired script has
    // to re-bind against the fresh DOM. A dead toggle after navigation is the
    // classic symptom of a listener bound once to a now-detached element.
    await page.goto(ROUTES.garden);
    await page.locator('a[href^="/notes/"], a[href^="/essays/"]').first().click();
    await page.waitForLoadState('domcontentloaded');

    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('theme'))).not.toBeNull();
  });

  test('the TOC pill rebuilds itself after a navigation', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    const rowsBefore = await page.locator('[data-toc-link]').count();
    expect(rowsBefore).toBeGreaterThan(0);

    await page.goto(ROUTES.seriesPart);
    await page.goto(ROUTES.pageWithToc);

    await expect(page.locator('[data-toc-pill]')).toBeVisible();
    await expect.poll(async () => page.locator('[data-toc-link]').count()).toBe(rowsBefore);
  });

  test('the TOC pill does not accumulate duplicate rows across navigations', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    const rows = await page.locator('[data-toc-link]').count();

    await page.goto(ROUTES.home);
    await page.goto(ROUTES.pageWithToc);

    await expect.poll(async () => page.locator('[data-toc-link]').count()).toBe(rows);
  });

  test('there is never more than one TOC pill in the document', async ({ page }) => {
    // initTOC relocates the pill to <body>; a stale copy would leave two.
    await page.goto(ROUTES.pageWithToc);
    await page.goto(ROUTES.seriesPart);
    await expect(page.locator('[data-toc-pill]')).toHaveCount(1);
  });

  test('the theme survives a client-side navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(ROUTES.garden);
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.locator('a[href^="/notes/"], a[href^="/essays/"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
