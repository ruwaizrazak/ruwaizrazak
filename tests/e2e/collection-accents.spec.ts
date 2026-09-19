import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

// Resolved values of the accent tokens in src/styles/global.css (@theme and .dark).
const LIGHT = {
  konpeki: 'rgb(0, 74, 143)',
  tokusa: 'rgb(61, 93, 66)',
  kincha: 'rgb(138, 90, 18)',
  muted: 'rgb(92, 112, 112)',
  onAccent: 'rgb(255, 255, 255)',
};
const DARK = {
  tokusa: 'rgb(156, 197, 161)',
  kincha: 'rgb(224, 181, 106)',
  onAccent: 'rgb(26, 26, 26)',
};

const openAs = async (page: Page, theme: 'light' | 'dark', route: string) => {
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
};

test.describe('collection accents', () => {
  test('each collection paints its eyebrow and icon in its own accent', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);
    await openAs(page, 'light', ROUTES.garden);

    const note = page.locator('.card-shell[data-collection="notes"]').first();
    const essay = page.locator('.card-shell[data-collection="essays"]').first();
    await expect(note.locator('.card-eyebrow')).toHaveCSS('color', LIGHT.tokusa);
    await expect(essay.locator('.card-eyebrow')).toHaveCSS('color', LIGHT.konpeki);

    // The mask icon paints currentColor; a 0x0 box would mean it lost its flex parent.
    const icon = note.locator('.card-eyebrow .card-collection-icon');
    await expect(icon).toHaveCSS('background-color', LIGHT.tokusa);
    const iconBox = await icon.boundingBox();
    expect(iconBox?.width).toBe(15);
    expect(iconBox?.height).toBe(15);

    // Published notes have no heroImage, so the band shows the large collection mark.
    const bandIconBox = await note.locator('.card-band .card-collection-icon').boundingBox();
    expect(bandIconBox?.width).toBe(34);
    expect(bandIconBox?.height).toBe(34);

    await expect(note.locator('.maturity-badge > span')).toHaveCSS('color', LIGHT.muted);
    expect(errors).toEqual([]);
  });

  test('the series panel carries the series accent, including its CTA', async ({ page }) => {
    await openAs(page, 'light', ROUTES.seriesIndex);

    const panel = page.locator('.card-shell-series').first();
    await expect(panel).toHaveAttribute('data-collection', 'series');
    await expect(panel.locator('.card-eyebrow')).toHaveCSS('color', LIGHT.kincha);

    const cta = panel.locator('.series-view-all');
    await expect(cta).toHaveCSS('background-color', LIGHT.kincha);
    await expect(cta).toHaveCSS('color', LIGHT.onAccent);
  });

  test('dark theme swaps every accent and the CTA text', async ({ page }) => {
    await openAs(page, 'dark', ROUTES.garden);
    await expect(page.locator('html')).toHaveClass(/dark/);

    const note = page.locator('.card-shell[data-collection="notes"]').first();
    await expect(note.locator('.card-eyebrow')).toHaveCSS('color', DARK.tokusa);

    const cta = page.locator('.card-shell-series .series-view-all').first();
    await expect(cta).toHaveCSS('background-color', DARK.kincha);
    await expect(cta).toHaveCSS('color', DARK.onAccent);
  });

  test('cards outside the collection system keep konpeki', async ({ page }) => {
    await openAs(page, 'light', ROUTES.about);

    const eyebrow = page.locator('.card-shell:not([data-collection]) .card-eyebrow').first();
    await expect(eyebrow).toHaveCSS('color', LIGHT.konpeki);
  });
});
