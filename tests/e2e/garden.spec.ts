import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

const waitForGardenHydration = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
};

test.describe('garden layout', () => {
  test('matches the viewport width and does not serialize article bodies', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      strip: document.querySelector('.garden-strip')?.getBoundingClientRect().width,
    }));
    expect(dimensions.document).toBe(dimensions.viewport);
    expect(dimensions.strip).toBe(dimensions.viewport);

    // Production component URLs are hashed, so identify the island by the
    // garden section it owns instead of coupling the test to a dev-only path.
    const props = await page.locator('.garden-cards-section').evaluate((section) =>
      section.closest('astro-island')?.getAttribute('props'),
    );
    expect(props).not.toContain('"body"');
    expect(props).not.toContain('"filePath"');
    expect(props).not.toContain('"digest"');
  });

  test('renders cards in descending date order with no console errors', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    await expect(page.locator('.card-shell-series').first()).toBeVisible();
    await expect(page.locator('.garden-feature-grid').first()).toBeVisible();

    const dates = await page.locator('.garden-card-item').evaluateAll((nodes) => {
      return nodes.map((node) => new Date((node as HTMLElement).dataset.date ?? '').valueOf());
    });

    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(errors).toEqual([]);
  });

  test('series panels list their parts and link to the full series', async ({ page }) => {
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const panel = page.locator('.card-shell-series').first();
    await expect(panel.locator('.series-post-row').first()).toBeVisible();

    const href = await panel.locator('.series-view-all').first().getAttribute('href');
    expect(href).toMatch(/^\/series\/[^/]+\/$/);
  });

  test('essays span wider than notes at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const essay = page.locator('.garden-feature-grid [data-collection="essays"]').first();
    const note = page.locator('.garden-feature-grid [data-collection="notes"]').first();

    const essayBox = await essay.boundingBox();
    const noteBox = await note.boundingBox();

    expect(essayBox?.width ?? 0).toBeGreaterThan((noteBox?.width ?? 0) * 1.5);
  });

  test('every garden grid row is full and cards read in date order', async ({ page }) => {
    // md = 2, lg = 3, xl = 4 columns
    for (const width of [800, 1100, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.garden);
      await waitForGardenHydration(page);

      // offsetTop/offsetLeft ignore the entrance cascade's staggered translateY,
      // so cards in the same row share a top even mid-animation.
      const grids = await page.locator('.garden-feature-grid').evaluateAll((nodes) =>
        nodes.map((grid) => {
          const style = getComputedStyle(grid);
          return {
            width: grid.clientWidth,
            gap: parseFloat(style.columnGap),
            cols: style.gridTemplateColumns.split(' ').length,
            items: [...grid.children].map((child, index) => {
              const el = child as HTMLElement;
              return {
                index,
                collection: el.dataset.collection,
                top: el.offsetTop,
                left: el.offsetLeft,
                width: el.getBoundingClientRect().width,
              };
            }),
          };
        }),
      );
      expect(grids.length).toBeGreaterThan(0);

      for (const grid of grids) {
        const rows = new Map<number, typeof grid.items>();
        for (const item of grid.items) rows.set(item.top, [...(rows.get(item.top) ?? []), item]);
        const tops = [...rows.keys()].sort((a, b) => a - b);

        const visualOrder = tops.flatMap((top) =>
          rows.get(top)!.sort((a, b) => a.left - b.left).map((item) => item.index),
        );
        expect(visualOrder, `visual order at ${width}px`).toEqual(grid.items.map((item) => item.index));

        const column = (grid.width - grid.gap * (grid.cols - 1)) / grid.cols;
        tops.forEach((top, rowIndex) => {
          const row = rows.get(top)!;
          const filled = row.reduce((sum, item) => sum + item.width, 0) + grid.gap * (row.length - 1);
          if (Math.abs(filled - grid.width) <= 2) return;

          // Only the final row may be short, and only when every card in it is a note
          // already at the 2-column cap, so nothing could have grown to close the gap.
          expect(rowIndex, `short row that is not the last, at ${width}px`).toBe(tops.length - 1);
          for (const item of row) {
            expect(item.collection, `short-row card at ${width}px`).not.toBe('essays');
            expect(Math.abs(item.width - (column * 2 + grid.gap)), `capped note at ${width}px`).toBeLessThanOrEqual(2);
          }
        });
      }
    }
  });

  // Playground entries are all `publish: false`, so /garden has no playground card to
  // assert on. Re-add a playground date check here once one is published.
  test('note cards show maturity while essays show dates', async ({ page }) => {
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const note = page.locator('.garden-feature-grid [data-collection="notes"]').first();
    await expect(note.locator('.maturity-badge')).toBeVisible();

    const essay = page.locator('.garden-feature-grid [data-collection="essays"]').first();
    await expect(essay.locator('.card-meta')).toContainText(/\d{4}/);
  });

  test('keeps cards visible when reduced motion is preferred', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    await expect
      .poll(async () => Number(await page.locator('.garden-card-item').first().evaluate((el) => getComputedStyle(el).opacity)))
      .toBe(1);
  });

  test('/series renders only series panels', async ({ page }) => {
    await page.goto(ROUTES.seriesIndex);
    await waitForGardenHydration(page);

    await expect(page.locator('.card-shell-series').first()).toBeVisible();
    await expect(page.locator('.garden-feature-grid')).toHaveCount(0);
  });

  test('/notes keeps the uniform grid', async ({ page }) => {
    await page.goto(ROUTES.notesIndex);
    await waitForGardenHydration(page);

    await expect(page.locator('.card-masonry')).toBeVisible();
    await expect(page.locator('.garden-feature-grid')).toHaveCount(0);
    await expect(page.locator('.card-shell-wide')).toHaveCount(0);
  });
});
