import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

const waitForGardenHydration = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
};

test.describe('garden layout', () => {
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

  test('dense packing fills the slot beside the first essay', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const firstEssay = page.locator('.garden-feature-grid [data-collection="essays"]').first();
    const firstEssayBox = await firstEssay.boundingBox();
    const noteBoxes = await page
      .locator('.garden-feature-grid [data-collection="notes"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON() as DOMRect));

    expect(noteBoxes.some((box) => Math.abs(box.y - (firstEssayBox?.y ?? -9999)) <= 2)).toBe(true);
  });

  test('note cards show maturity while essays and playground show dates', async ({ page }) => {
    await page.goto(ROUTES.garden);
    await waitForGardenHydration(page);

    const note = page.locator('.garden-feature-grid [data-collection="notes"]').first();
    await expect(note.locator('.maturity-badge')).toBeVisible();

    const essay = page.locator('.garden-feature-grid [data-collection="essays"]').first();
    await expect(essay.locator('.card-meta')).toContainText(/\d{4}/);

    const playground = page.locator('.garden-feature-grid [data-collection="playground"]').first();
    await expect(playground.locator('.card-meta')).toContainText(/\d{4}/);
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
