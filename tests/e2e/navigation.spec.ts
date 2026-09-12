import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

test.describe('desktop navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.home);
  });

  test('opens the garden dropdown and flips its chevron', async ({ page }) => {
    const dropdown = page.locator('#desktop-dropdown');
    await page.locator('#desktop-menu-button').click();

    await expect(dropdown).toBeVisible();
    await expect(page.locator('#desktop-chevron')).toHaveClass(/rotate-180/);
  });

  test('closes on a click outside', async ({ page }) => {
    await page.locator('#desktop-menu-button').click();
    await expect(page.locator('#desktop-dropdown')).toBeVisible();

    await page.locator('h1').first().click({ force: true });
    await expect(page.locator('#desktop-dropdown')).toBeHidden();
  });

  test('opening one dropdown closes the other', async ({ page }) => {
    await page.locator('#desktop-menu-button').click();
    await page.locator('#about-menu-button').click();

    await expect(page.locator('#about-dropdown')).toBeVisible();
    await expect(page.locator('#desktop-dropdown')).toBeHidden();
  });

  test('its links navigate', async ({ page }) => {
    await page.locator('#desktop-menu-button').click();
    const link = page.locator('#desktop-dropdown a').first();
    const href = await link.getAttribute('href');

    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});

test.describe('mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTES.home);
  });

  test('slides the sidebar in and locks the page behind it', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();

    await expect(page.locator('#mobile-sidebar')).not.toHaveClass(/translate-x-full/);
    await expect(page.locator('#mobile-overlay')).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.body.style.overflow))
      .toBe('hidden');
  });

  test('closes from the overlay and restores scrolling', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.locator('#mobile-overlay').click({ position: { x: 10, y: 10 } });

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
    await expect.poll(async () => page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('closes when a link inside it is followed', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.locator('#mobile-sidebar a').first().click();

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
  });

  test('closes itself when the viewport grows to desktop', async ({ page }) => {
    await page.locator('#mobile-menu-button').click();
    await page.setViewportSize({ width: 1280, height: 900 });

    await expect(page.locator('#mobile-sidebar')).toHaveClass(/translate-x-full/);
  });
});
