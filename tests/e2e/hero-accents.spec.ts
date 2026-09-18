import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from './routes';

// Resolved accent tokens (src/styles/global.css, @theme and .dark).
const LIGHT = {
  konpeki: 'rgb(0, 74, 143)',
  tokusa: 'rgb(61, 93, 66)',
  kincha: 'rgb(138, 90, 18)',
};
const DARK = { tokusa: 'rgb(156, 197, 161)' };

const SERIES_LANDING = '/series/prototyping-in-code/';

const openAs = async (page: Page, route: string, theme: 'light' | 'dark' = 'light') => {
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
  await page.goto(route);
};

const hero = (page: Page) => page.locator('#note-hero-content');
const heroBackground = (page: Page) => hero(page).evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe('post hero accents', () => {
  test('each collection paints the eyebrow and marks the band with its accent', async ({ page }) => {
    const cases = [
      { route: ROUTES.pageWithWebmentions, accent: 'notes', color: LIGHT.tokusa },
      { route: ROUTES.pageWithHeroImage, accent: 'essays', color: LIGHT.konpeki },
      { route: ROUTES.seriesPart, accent: 'series', color: LIGHT.kincha },
    ];
    for (const { route, accent, color } of cases) {
      await openAs(page, route);
      await expect(hero(page)).toHaveAttribute('data-accent', accent);
      await expect(page.locator('.hero-eyebrow')).toHaveCSS('color', color);
    }
  });

  test('a series landing page is labelled Series, not Notes', async ({ page }) => {
    await openAs(page, SERIES_LANDING);

    const eyebrow = page.locator('.hero-eyebrow');
    await expect(eyebrow).toContainText('Series');
    await expect(eyebrow).toHaveAttribute('href', '/series/');
    await expect(eyebrow).toHaveCSS('color', LIGHT.kincha);
    await expect(hero(page)).toHaveAttribute('data-accent', 'series');
  });

  test('/live keeps a neutral hero labelled Live', async ({ page }) => {
    await openAs(page, ROUTES.pageWithWebmentions);
    const noteBand = await heroBackground(page);

    await openAs(page, ROUTES.live);
    const eyebrow = page.locator('.hero-eyebrow');
    await expect(eyebrow).toContainText('Live');
    await expect(eyebrow).toHaveAttribute('href', '/live/');
    await expect(eyebrow).toHaveCSS('color', LIGHT.konpeki);
    await expect(eyebrow.locator('.card-collection-icon')).toHaveAttribute('style', /\/icons\/garden\.svg/);
    await expect(hero(page)).not.toHaveAttribute('data-accent', /.+/);
    expect(await heroBackground(page)).not.toBe(noteBand);
  });

  test('dark theme swaps the hero accent', async ({ page }) => {
    await openAs(page, ROUTES.pageWithWebmentions, 'dark');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('.hero-eyebrow')).toHaveCSS('color', DARK.tokusa);
  });
});
