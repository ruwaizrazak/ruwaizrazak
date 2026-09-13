import { test, expect } from '@playwright/test';
import { watchPage } from './helpers';
import { ROUTES } from './routes';

test.describe('about page v2', () => {
  test('keeps the portrait rail visible while the page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.about);

    const portrait = page.locator('[data-about-portrait]');
    const before = await portrait.boundingBox();
    await page.evaluate(() => window.scrollTo(0, 1200));
    const after = await portrait.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after!.y).toBeGreaterThanOrEqual(0);
    expect(after!.y + after!.height).toBeLessThanOrEqual(900);
  });

  test('uses two columns on desktop and one column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(ROUTES.about);

    const railDesktop = await page.locator('[data-about-rail]').boundingBox();
    const headingDesktop = await page.locator('h1').boundingBox();
    expect(railDesktop).not.toBeNull();
    expect(headingDesktop).not.toBeNull();
    expect(railDesktop!.x).toBeLessThan(headingDesktop!.x);
    expect(Math.max(railDesktop!.y, headingDesktop!.y)).toBeLessThan(
      Math.min(railDesktop!.y + railDesktop!.height, headingDesktop!.y + headingDesktop!.height),
    );

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();

    const portraitMobile = await page.locator('[data-about-portrait]').boundingBox();
    const headingMobile = await page.locator('h1').boundingBox();
    expect(portraitMobile).not.toBeNull();
    expect(headingMobile).not.toBeNull();
    expect(headingMobile!.y).toBeGreaterThanOrEqual(portraitMobile!.y + portraitMobile!.height);
  });

  test('renders experience as a flat bordered ledger', async ({ page }) => {
    await page.goto(ROUTES.about);

    const rows = page.locator('[data-experience-row]');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().locator('[data-experience-company]')).toHaveText('Nordeus');

    const logoBox = await rows.first().locator('[data-experience-logo]').boundingBox();
    const rowStyle = await rows.first().evaluate((row) => {
      const style = getComputedStyle(row);
      return {
        position: style.position,
        borderTopWidth: style.borderTopWidth,
        borderRadius: getComputedStyle(row.querySelector('[data-experience-logo]')!).borderRadius,
      };
    });

    expect(logoBox?.width).toBe(44);
    expect(logoBox?.height).toBe(44);
    expect(rowStyle.position).toBe('static');
    expect(rowStyle.borderTopWidth).not.toBe('0px');
    expect(rowStyle.borderRadius).not.toBe('0px');
  });

  test('uses garden rows on About while the homepage keeps cards', async ({ page }) => {
    await page.goto(ROUTES.about);
    const aboutGarden = page.locator('[data-about-garden]');
    await expect(aboutGarden.locator('[data-garden-preview="list"]')).toBeVisible();
    await expect(aboutGarden.locator('.card-shell')).toHaveCount(0);

    await page.goto(ROUTES.home);
    await expect(page.locator('.card-shell').first()).toBeVisible();
    await expect(page.locator('[data-garden-preview="list"]')).toHaveCount(0);
  });

  test('keeps selected projects as work cards', async ({ page }) => {
    await page.goto(ROUTES.about);
    const projects = page.locator('[data-about-projects]');
    await expect(projects.locator('.card-shell').first()).toBeVisible();
    await expect(projects.locator('a[href^="/works/"]').first()).toBeVisible();
  });

  test('links the email pill to the contact address', async ({ page }) => {
    await page.goto(ROUTES.about);
    await expect(page.locator('[data-about-email]')).toHaveAttribute(
      'href',
      'mailto:hello@ruwaizrazak.com',
    );
  });

  test('renders exactly one page heading', async ({ page }) => {
    await page.goto(ROUTES.about);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders without console errors', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);
    await page.goto(ROUTES.about);
    expect(errors).toEqual([]);
  });
});
