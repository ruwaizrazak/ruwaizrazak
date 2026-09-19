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

  // One route per card component RelatedNotes renders: ContentCard (essays/notes)
  // and SeriesPostCard (series parts).
  for (const [route, label] of [
    [ROUTES.pageWithRelated, 'ContentCard'],
    [ROUTES.seriesPart, 'SeriesPostCard'],
  ] as const) {
    test(`a press that straddles hydration still clicks through (${label})`, async ({ page }) => {
      // RelatedNotes is client:visible. Hold its script so the press lands BEFORE
      // hydration and the release AFTER. Hydration used to detach and re-insert
      // each card heading (<svelte:element>), and a click whose press straddles
      // that is dropped, so the router never ran.
      let release!: () => void;
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route(/RelatedNotesView\.[^/]*\.js$/, async (r) => {
        await held;
        await r.continue();
      });

      await page.goto(route);
      const startUrl = page.url();
      // Settle the layout first: lazy images above still loading shift the cards,
      // and a press that ends off the card is a geometry miss, not this bug.
      await page.evaluate(async () => {
        for (const img of document.images) if (img.loading === 'lazy') img.loading = 'eager';
        await Promise.all(
          [...document.images].map((img) =>
            img.complete
              ? null
              : new Promise((res) => {
                  img.addEventListener('load', res, { once: true });
                  img.addEventListener('error', res, { once: true });
                }),
          ),
        );
      });
      const island = page.locator('astro-island:has(.related-notes-section)');
      const title = page.locator('.related-notes-section a .card-title').first();
      // Centre the title itself: on a phone the cards stack, and a title left at the
      // bottom edge sits under the fixed TOC pill.
      await title.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await expect(island).toHaveAttribute('ssr', '');

      await page.evaluate(() => {
        const w = window as unknown as { removedHeadings: number };
        w.removedHeadings = 0;
        new MutationObserver((records) => {
          for (const record of records)
            for (const node of record.removedNodes) if (/^H[1-6]$/.test(node.nodeName)) w.removedHeadings++;
        }).observe(document.querySelector('.related-grid')!, { childList: true, subtree: true });
      });

      // In Chromium the scroll-driven .note-main-wrapper overlap (translateY 0 to
      // -120px on a view() timeline) catches up a frame after the scroll jump, so
      // measure only once the title has stopped moving.
      await expect
        .poll(() =>
          title.evaluate(async (el) => {
            const before = el.getBoundingClientRect().top;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            return el.getBoundingClientRect().top === before;
          }),
        )
        .toBe(true);
      const box = (await title.boundingBox())!;
      const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
      const onTitle = ([px, py]: number[]) =>
        !!document.elementFromPoint(px, py)?.closest('.related-notes-section a .card-title');
      expect(await page.evaluate(onTitle, [x, y]), 'press must start on the card title').toBe(true);
      await page.mouse.move(x, y);
      await page.mouse.down();
      release();
      await expect(island).not.toHaveAttribute('ssr', { timeout: 15_000 });
      expect(await page.evaluate(onTitle, [x, y]), 'release must end on the card title').toBe(true);
      await page.mouse.up();

      expect(await page.evaluate(() => (window as unknown as { removedHeadings: number }).removedHeadings)).toBe(0);
      await expect(page).not.toHaveURL(startUrl, { timeout: 15_000 });
    });
  }
});
