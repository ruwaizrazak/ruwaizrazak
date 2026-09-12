import { test, expect } from '@playwright/test';
import { htmlRoutes } from '../helpers/dist-routes';
import { watchPage } from './helpers';

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
    expect(routes.length).toBeGreaterThan(40);
  });

  test('no route 404s, errors in the console, or fails a request', async ({ page, baseURL }) => {
    const { errors: problems } = watchPage(page, baseURL!);

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} returned ${response?.status()}`).toBeLessThan(400);
    }

    expect(problems).toEqual([]);
  });
});

test.describe('core pages render their furniture', () => {
  const pages = ['/', '/about/', '/garden/', '/notes/', '/series/', '/works/', '/live/'];

  for (const route of pages) {
    test(`${route} renders its header chrome and a heading`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('#theme-toggle').first()).toBeVisible();
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  }

  test('every page closes with the contact section', async ({ page }) => {
    // Footer.astro renders <section id="Contact">, not <footer> — see the
    // landmark test below, which holds it to the semantic-HTML rule.
    for (const route of pages) {
      await page.goto(route);
      await expect(page.locator('#Contact'), route).toBeAttached();
    }
  });

  test('every page exposes a <footer> landmark', async ({ page }) => {
    // CLAUDE.md requires semantic <article>/<nav>/<main>/<section>/<header>/<footer>.
    // Footer.astro currently renders a <section>, so no page has a footer landmark
    // for assistive tech or search engines. Expected to fail until that changes.
    for (const route of pages) {
      await page.goto(route);
      await expect(page.locator('footer'), `${route} has no <footer>`).toHaveCount(1);
    }
  });
});
