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
  test('does not put scroll-behavior:smooth on the scrolling element', async ({ page }) => {
    // ClientRouter restores scroll with its own scrollTo(). `scroll-behavior:
    // smooth` on <html> turns that into an ANIMATION over the full document
    // height, which on a long essay never lands — Back silently drops the reader
    // at the top. TocPill does its own scrollIntoView({behavior:'smooth'}), so
    // nothing needs the CSS. This is the direct guard; the behavioural one below
    // only bites once the document is tall enough.
    for (const route of [ROUTES.pageWithToc, ROUTES.workWithVideo]) {
      await page.goto(route);
      const behavior = await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      );
      expect(behavior, `${route} must not smooth-scroll the root`).not.toBe('smooth');
    }
  });

  test('restores scroll position on browser back', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);

    // The bug needs DISTANCE: a short smooth scroll still completes, so with
    // lazy images unloaded the document is too short to reproduce it. Promote
    // them and wait, so the page reaches its real height first.
    await page.evaluate(async () => {
      for (const img of document.images) if (img.loading === 'lazy') img.loading = 'eager';
      await Promise.all(
        [...document.images].map((img) =>
          img.complete
            ? null
            : new Promise((res) => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
                setTimeout(res, 8000);
              }),
        ),
      );
    });

    const from = await page.evaluate(() => {
      const y = Math.round(document.documentElement.scrollHeight * 0.8);
      window.scrollTo(0, y);
      return Math.round(window.scrollY);
    });
    // Guard the setup itself: below ~20k px the bug does not reproduce, so a
    // pass would be meaningless.
    expect(from, 'document must be tall enough to reproduce the bug').toBeGreaterThan(20_000);

    // RelatedNotes is client:visible — a click before hydration is swallowed.
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached({ timeout: 15_000 });
    await page.locator('.related-notes-section a').first().click();
    await page.waitForURL((u) => !u.pathname.includes('deconstructionofcodm'), { timeout: 15_000 });

    await page.goBack();

    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10_000 })
      .toBeGreaterThan(from - 2000);
  });
  test('does not replay the open animation when going back', async ({ page }) => {
    // `main` carries a per-post transition:name, so old and new never pair and
    // work-scale-in plays as an ENTER animation on every arrival — including a
    // back navigation, where zooming in reads as opening something new. The rule
    // is scoped to :root:not([data-nav-direction="back"]); BaseHead records the
    // direction on the INCOMING document during the swap.
    await page.goto(ROUTES.pageWithToc);

    const scoped = await page.evaluate(() =>
      [...document.querySelectorAll('style')].some(
        (s) =>
          s.textContent!.includes('view-transition-new') &&
          s.textContent!.includes('data-nav-direction'),
      ),
    );
    expect(scoped, 'the open animation must be direction-scoped').toBe(true);

    await page.locator('.related-notes-section').scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached({ timeout: 15_000 });
    await page.locator('.related-notes-section a').first().click();
    await page.waitForURL((u) => !u.pathname.includes('deconstructionofcodm'), { timeout: 15_000 });

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.navDirection))
      .toBe('forward');

    await page.goBack();

    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.navDirection))
      .toBe('back');

    // With direction=back the scale-in selector must no longer match the root.
    const wouldApply = await page.evaluate(
      () => !document.documentElement.matches('[data-nav-direction="back"]'),
    );
    expect(wouldApply, 'the open animation must not apply on a back navigation').toBe(false);
  });
});
