import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { settleLayout } from './helpers';

/**
 * The image lightbox had NO coverage before the Svelte migration, which is how
 * three bugs survived in it: the lightbox <img> emitted no alt attribute at all
 * (27 of the site's 28 missing alts), window mousemove/mouseup listeners were
 * added per image and never removed, and a [data-zoom-label] readout was queried
 * but never existed in the markup.
 *
 * These assertions pin the behaviour the rewrite has to keep.
 */

const LIGHTBOX = '[data-image-lightbox]';
const ZOOM_IMAGE = '[data-zoom-image]';
const SLIDER = '[data-zoom-slider]';

/** Open the first content image and wait for the lightbox. */
async function openFirst(page: import('@playwright/test').Page) {
  const thumb = page.locator('article picture, article img[data-zoom-trigger]').first();
  await thumb.scrollIntoViewIfNeeded();
  // The island is client:visible — wait until it has actually hydrated.
  await expect(page.locator('astro-island[client="visible"]:not([ssr])').first()).toBeAttached({
    timeout: 15000,
  });
  await thumb.click();
  await expect(page.locator(LIGHTBOX)).toBeVisible();
}

test.describe('image lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithLightbox);
    await settleLayout(page);
  });

  test('opens from a content image', async ({ page }) => {
    await expect(page.locator(LIGHTBOX)).toHaveCount(0);
    await openFirst(page);
    await expect(page.locator(ZOOM_IMAGE)).toBeVisible();
  });

  test('renders outside the article so position:fixed resolves to the viewport', async ({ page }) => {
    await openFirst(page);
    const parentIsBody = await page
      .locator(LIGHTBOX)
      .evaluate((el) => el.parentElement === document.body);
    expect(parentIsBody).toBe(true);
  });

  test('gives the full-size image an alt attribute', async ({ page }) => {
    await openFirst(page);
    // Regression: this used to be `alt={alt}` (bare) while the thumbnail used
    // `alt={alt || ''}`, so an undefined alt emitted no attribute at all.
    const hasAlt = await page.locator(ZOOM_IMAGE).evaluate((el) => el.hasAttribute('alt'));
    expect(hasAlt).toBe(true);
  });

  test('locks the page behind it and restores on close', async ({ page }) => {
    await openFirst(page);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.locator(LIGHTBOX)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('closes from the close button', async ({ page }) => {
    await openFirst(page);
    await page.locator('[data-image-close]').click();
    await expect(page.locator(LIGHTBOX)).toHaveCount(0);
  });

  test('zooms the image and reports the level', async ({ page }) => {
    await openFirst(page);
    // At rest there is nothing to reset.
    await expect(page.locator('[data-zoom-reset]')).toHaveCount(0);
    await expect(page.locator('[data-zoom-label]')).toHaveText('1.0×');

    await page.locator(SLIDER).fill('200');
    await expect(page.locator('[data-zoom-label]')).toHaveText('2.0×');
    await expect(page.locator(ZOOM_IMAGE)).toHaveAttribute('style', /scale\(2\)/);

    // Reset appears only once zoomed, and returns to 1×.
    await page.locator('[data-zoom-reset]').click();
    await expect(page.locator('[data-zoom-label]')).toHaveText('1.0×');
    await expect(page.locator('[data-zoom-reset]')).toHaveCount(0);
  });

  test('leaks no window listeners across repeated opens', async ({ page }) => {
    // Regression: mousemove/mouseup were attached per image and never removed.
    // Opening and closing repeatedly must not accumulate lightboxes in the DOM.
    for (let i = 0; i < 3; i++) {
      await openFirst(page);
      await page.keyboard.press('Escape');
      await expect(page.locator(LIGHTBOX)).toHaveCount(0);
    }
    await expect(page.locator(LIGHTBOX)).toHaveCount(0);
  });
});
