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

  test('every page exposes a contentinfo landmark', async ({ page }) => {
    // CLAUDE.md requires semantic landmarks. This asserts the ROLE, not the tag:
    // `<footer>` scoped inside an <article> is not a landmark, and ContentCard
    // renders one per card — so /garden and /series carry three <footer> elements
    // and a `locator('footer')` count could never be 1. getByRole('contentinfo')
    // matches only the page-level one, which is the thing assistive tech and
    // search engines actually anchor to.
    for (const route of pages) {
      await page.goto(route);
      await expect(page.getByRole('contentinfo'), `${route} has no contentinfo landmark`).toHaveCount(1);
    }
  });
});
