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

  test('every garden grid row is full and cards move at most one place', async ({ page }) => {
    // md = 2, lg = 3, xl = 4 columns
    for (const width of [800, 1100, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.garden);
      await waitForGardenHydration(page);

      // offsetTop/offsetLeft ignore the entrance cascade's staggered translateY,
      // so cards in the same row share a top even mid-animation.
      const grid = await page.locator('.garden-feature-grid').evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          width: node.clientWidth,
          gap: parseFloat(style.columnGap),
          items: [...node.children].map((child, index) => {
            const el = child as HTMLElement;
            return { index, top: el.offsetTop, left: el.offsetLeft, width: el.getBoundingClientRect().width };
          }),
        };
      });
      await expect(page.locator('.garden-feature-grid')).toHaveCount(1);

      const rows = new Map<number, typeof grid.items>();
      for (const item of grid.items) rows.set(item.top, [...(rows.get(item.top) ?? []), item]);
      const tops = [...rows.keys()].sort((a, b) => a - b);

      const visualOrder = tops.flatMap((top) =>
        rows.get(top)!.sort((a, b) => a.left - b.left).map((item) => item.index),
      );
      visualOrder.forEach((index, position) => {
        expect(Math.abs(index - position), `card ${index} moved too far at ${width}px`).toBeLessThanOrEqual(1);
      });

      // Today's content packs with every row full at every width (see gardenLayout tests).
      for (const top of tops) {
        const row = rows.get(top)!;
        const filled = row.reduce((sum, item) => sum + item.width, 0) + grid.gap * (row.length - 1);
        expect(Math.abs(filled - grid.width), `row fill at ${width}px`).toBeLessThanOrEqual(2);
      }
    }
  });

  test('every card in a row shares the row height', async ({ page }) => {
    for (const width of [800, 1100, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.garden);
      await waitForGardenHydration(page);

      const cards = await page.locator('.garden-feature-grid > .garden-card-item').evaluateAll((nodes) =>
        nodes.map((node) => {
          const card = node.firstElementChild as HTMLElement;
          return { top: (node as HTMLElement).offsetTop, height: card.getBoundingClientRect().height };
        }),
      );

      const rows = new Map<number, number[]>();
      for (const card of cards) rows.set(card.top, [...(rows.get(card.top) ?? []), card.height]);
      // Today's 4-column packing puts a note beside a series panel and an essay beside notes.
      expect([...rows.values()].some((heights) => heights.length > 1)).toBe(true);
      for (const heights of rows.values()) {
        expect(Math.max(...heights) - Math.min(...heights), `row heights at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('columns are equal width: each card is exactly its span of columns', async ({ page }) => {
    // Rows can add up to the full width even when the columns themselves are uneven
    // (an invalid grid-template-columns falls back to content-sized tracks), so pin
    // every card to span × column + (span − 1) × gap.
    for (const [width, key] of [[800, 0], [1100, 1], [1440, 2]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.garden);
      await waitForGardenHydration(page);

      const grid = await page.locator('.garden-feature-grid').evaluate((node, index) => {
        const style = getComputedStyle(node);
        const gap = parseFloat(style.columnGap);
        const cols = style.gridTemplateColumns.split(' ').length;
        const column = (node.clientWidth - gap * (cols - 1)) / cols;
        return [...node.children].map((child) => {
          const span = Number((child as HTMLElement).dataset.spans!.split('-')[index]);
          return { expected: span * column + (span - 1) * gap, actual: child.getBoundingClientRect().width };
        });
      }, key);

      for (const card of grid) {
        expect(Math.abs(card.actual - card.expected), `card width at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test('a stretched note grows sideways only: its band matches a 1-column note', async ({ page }) => {
    // 1100px packs grid0 as essay | note(1) + note(2), so both widths are on the page.
    for (const width of [800, 1100, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.garden);
      await waitForGardenHydration(page);

      const bands = await page
        .locator('.garden-feature-grid > [data-collection="notes"] .card-band')
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()).map((r) => ({ w: r.width, h: r.height })));
      const heights = bands.map((band) => band.h);

      if (width === 1100) {
        const widths = bands.map((band) => band.w);
        expect(Math.max(...widths), 'a 2-column note exists at 1100px').toBeGreaterThan(Math.min(...widths) * 1.5);
      }
      expect(Math.max(...heights) - Math.min(...heights), `band heights at ${width}px`).toBeLessThanOrEqual(1);
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

  test('/series renders only series panels, each a full row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(ROUTES.seriesIndex);
    await waitForGardenHydration(page);

    await expect(page.locator('.card-shell-series').first()).toBeVisible();
    const grid = page.locator('.garden-feature-grid');
    await expect(grid).toHaveCount(1);

    const gridWidth = await grid.evaluate((node) => node.clientWidth);
    const items = await grid.locator(':scope > .garden-card-item').evaluateAll((nodes) =>
      nodes.map((node) => ({
        collection: (node as HTMLElement).dataset.collection,
        width: node.getBoundingClientRect().width,
      })),
    );
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.collection).toBe('series');
      expect(Math.abs(item.width - gridWidth)).toBeLessThanOrEqual(2);
    }
  });

  test('/notes keeps the uniform grid', async ({ page }) => {
    await page.goto(ROUTES.notesIndex);
    await waitForGardenHydration(page);

    await expect(page.locator('.card-masonry')).toBeVisible();
    await expect(page.locator('.garden-feature-grid')).toHaveCount(0);
    await expect(page.locator('.card-shell-wide')).toHaveCount(0);
  });
});
