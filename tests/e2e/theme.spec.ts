import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

const html = (page: import('@playwright/test').Page) => page.locator('html');
const storedTheme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => localStorage.getItem('theme'));

test.describe('theme toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
  });

  test('cycles light -> dark -> system and back', async ({ page }) => {
    // Three states are intentional. `system` has no distinct icon, so the
    // stored preference is the only place the third state is observable.
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(ROUTES.home);

    const toggle = page.locator('#theme-toggle');
    await toggle.click();
    expect(await storedTheme(page)).toBe('light');

    await toggle.click();
    expect(await storedTheme(page)).toBe('dark');
    await expect(html(page)).toHaveClass(/dark/);

    await toggle.click();
    expect(await storedTheme(page)).toBe('system');
  });

  test('applies dark mode to the document', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    // Set via addInitScript, not evaluate+reload: the clear() in beforeEach is
    // itself an init script and re-runs on every navigation, wiping the value
    // before the page's inline theme script can read it.
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(ROUTES.home);

    await expect(html(page)).toHaveClass(/dark/);
  });

  test('follows the OS when the preference is system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => localStorage.setItem('theme', 'system'));
    await page.goto(ROUTES.home);

    await expect(html(page)).toHaveClass(/dark/);
  });

  test('overrides the OS when the reader has chosen light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(ROUTES.home);

    await expect(html(page)).not.toHaveClass(/dark/);
  });

  test('survives navigation to another page', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await page.goto(ROUTES.home);
    await expect(html(page)).toHaveClass(/dark/);

    await page.goto(ROUTES.pageWithToc);
    await expect(html(page)).toHaveClass(/dark/);
  });

  test('paints a dark background, not just a class', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(ROUTES.home);
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(dark).not.toBe(light);
  });
});
