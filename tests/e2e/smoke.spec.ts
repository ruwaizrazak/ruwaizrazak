import { test, expect } from '@playwright/test';
import { htmlRoutes } from '../helpers/dist';

/**
 * Sweeps every built route once. Chromium only — running 70 routes across three
 * browser projects triples the wall-clock for no extra signal; the cross-browser
 * value is in the interaction specs, not in "does this page load".
 */
test.describe('every page loads clean', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'full sweep runs once');

  let routes: string[] = [];

  test.beforeAll(async () => {
    routes = await htmlRoutes();
    expect(routes.length).toBeGreaterThan(50);
  });

  test('no route 404s, errors in the console, or fails a request', async ({ page }) => {
    const problems: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(`console error on ${page.url()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      problems.push(`uncaught error on ${page.url()}: ${err.message}`);
    });

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} returned ${response?.status()}`).toBeLessThan(400);
      await expect(page.locator('h1').first(), `${route} has no visible h1`).toBeVisible();
    }

    expect(problems).toEqual([]);
  });
});

test.describe('core pages render their furniture', () => {
  const pages = ['/', '/about/', '/garden/', '/notes/', '/series/', '/works/', '/live/'];

  for (const route of pages) {
    test(`${route} has a header, a main heading and a footer`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('#theme-toggle').first()).toBeVisible();
      await expect(page.locator('footer').first()).toBeAttached();
    });
  }
});
