import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

const THIRD_PARTY = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/;

test.describe('self-hosted fonts', () => {
  test('makes no request to a font or CDN origin', async ({ page }) => {
    const offending: string[] = [];
    page.on('request', (request) => {
      if (THIRD_PARTY.test(request.url())) offending.push(request.url());
    });
    await page.goto(ROUTES.pageWithToc);
    await page.evaluate(() => document.fonts.ready);
    expect(offending).toEqual([]);
  });

  test('renders body text and headings in the web fonts, not the fallbacks', async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    // Astro hashes the family name ("IBM Plex Serif-6893…"), and its metric fallback shares the
    // prefix, so match the real face by prefix and exclude the "fallback:" one.
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts]
        .filter((f) => f.status === 'loaded' && !f.family.includes('fallback'))
        .map((f) => `${f.family.replace(/-[0-9a-f]+$/, '')}|${f.weight}|${f.style}`);
    });
    expect(loaded).toContain('IBM Plex Serif|400|normal');
    expect(loaded).toContain('Saira Condensed|500|normal');
  });
});

test.describe('theme toggle icon', () => {
  const rays = '#theme-toggle .theme-toggle__classic g path';
  const opacity = (page: import('@playwright/test').Page) =>
    page.locator(rays).first().evaluate((el) => getComputedStyle(el).opacity);

  test('shows the sun rays in light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(ROUTES.home);
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
    await expect.poll(() => opacity(page)).toBe('1');
  });

  test('hides the sun rays once dark mode is on, with the vendored timing', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(ROUTES.home);
    await expect(page.locator('#theme-toggle')).toHaveClass(/theme-toggle--toggled/);
    await expect.poll(() => opacity(page)).toBe('0');
    const duration = await page.locator(rays).first().evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe('0.4s');
  });
});
