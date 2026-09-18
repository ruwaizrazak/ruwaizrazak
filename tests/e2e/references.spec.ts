import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

test.describe('references shelf', () => {
  test('groups the AidsinGames references into books and the web', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);
    await page.goto(ROUTES.pageWithBookReferences);

    const shelf = page.locator('[data-references]');
    await expect(shelf).toHaveCount(1);
    await expect(shelf.locator('h2#references')).toHaveText('References');

    const groups = await shelf.locator('[data-reference-group]').evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLElement).dataset.referenceGroup),
    );
    expect(groups).toEqual(['books', 'web']);

    // Books with no URL are plain entries, never dead links.
    const books = shelf.locator('[data-reference-group="books"] [data-reference-item]');
    await expect(books).toHaveCount(3);
    expect(await books.evaluateAll((nodes) => nodes.map((node) => node.tagName))).toEqual(['DIV', 'DIV', 'DIV']);

    const web = shelf.locator('[data-reference-group="web"] a[data-reference-item]');
    await expect(web).toHaveCount(1);
    await expect(web).toHaveAttribute('target', '_blank');
    await expect(web).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(web).toContainText('gamedeveloper.com');

    expect(errors).toEqual([]);
  });

  test('renders an all-web list with one row per source', async ({ page }) => {
    await page.goto(ROUTES.pageWithWebReferences);

    const shelf = page.locator('[data-references]');
    await expect(shelf.locator('[data-reference-group]')).toHaveCount(1);
    await expect(shelf.locator('[data-reference-group="web"] a[data-reference-item]')).toHaveCount(5);
  });

  test('lays the book shelf out in two columns on desktop and one on a phone', async ({ page }) => {
    for (const [width, columns] of [[1280, 2], [375, 1]] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(ROUTES.pageWithBookReferences);

      const lefts = await page
        .locator('[data-reference-group="books"] [data-reference-item]')
        .evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().left)));
      expect(new Set(lefts).size, `book columns at ${width}px`).toBe(columns);
    }
  });

  test('gives the shelf exactly one TOC pill row, and its group labels none', async ({ page }) => {
    await page.goto(ROUTES.pageWithBookReferences);
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();

    // The shelf itself must be the new component, and its h2 must reach the real pill.
    await expect(page.locator('[data-references] h2#references')).toHaveCount(1);
    await expect(page.locator('[data-toc-link="references"]')).toHaveCount(1);

    // The group labels are plain text: they must not become TOC rows.
    const rows = await page.locator('[data-toc-link]').evaluateAll((nodes) =>
      nodes.map((node) => node.textContent?.trim() ?? ''),
    );
    for (const label of ['Books', 'On the web', 'From the garden']) {
      expect(rows.some((text) => text === label), `TOC row "${label}"`).toBe(false);
    }
  });

  test('draws the covers as sized boxes, not zero-height images', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.pageWithBookReferences);

    const box = await page
      .locator('[data-reference-group="books"] [data-reference-item] > div')
      .first()
      .boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(52);
    expect(Math.round(box?.height ?? 0)).toBe(76);
  });
});
