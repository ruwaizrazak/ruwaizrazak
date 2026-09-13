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
const ZOOM_IN = '[data-zoom-in]';
const ZOOM_OUT = '[data-zoom-out]';

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
    await expect(page.locator('[data-zoom-reset]')).toBeVisible();
    await expect(page.locator('[data-zoom-label]')).toHaveText('1.0×');

    for (let click = 0; click < 4; click++) await page.locator(ZOOM_IN).click();
    await expect(page.locator('[data-zoom-label]')).toHaveText('2.0×');
    await expect(page.locator(ZOOM_IMAGE)).toHaveAttribute('style', /scale\(2\)/);

    await page.locator('[data-zoom-reset]').click();
    await expect(page.locator('[data-zoom-label]')).toHaveText('1.0×');
    await expect(page.locator(ZOOM_IMAGE)).toHaveAttribute('style', /scale\(1\)/);

    // Reset remains available at rest and is a safe no-op.
    await page.locator('[data-zoom-reset]').click();
    await expect(page.locator('[data-zoom-label]')).toHaveText('1.0×');
  });

  test('disables stepped zoom controls at both limits', async ({ page }) => {
    await openFirst(page);
    await expect(page.locator(ZOOM_OUT)).toBeDisabled();

    for (let click = 0; click < 12; click++) await page.locator(ZOOM_IN).click();
    await expect(page.locator('[data-zoom-label]')).toHaveText('4.0×');
    await expect(page.locator(ZOOM_IN)).toBeDisabled();
  });

  test('uses the circular close control', async ({ page }) => {
    await openFirst(page);
    const close = page.locator('[data-image-close]');
    // The panel deliberately grows from the thumbnail, so wait for the visual
    // box to reach its final size rather than sampling mid-transition.
    await expect.poll(async () => (await close.boundingBox())?.width).toBeGreaterThanOrEqual(51);
    const box = await close.boundingBox();
    const radius = await close.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderRadius),
    );

    expect(box?.width).toBeGreaterThanOrEqual(51);
    expect(box?.width).toBeLessThanOrEqual(53);
    expect(box?.height).toBeGreaterThanOrEqual(51);
    expect(box?.height).toBeLessThanOrEqual(53);
    expect(radius).toBeGreaterThan(20);
  });

  test('uses the themed backdrop in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await openFirst(page);
    const background = await page
      .locator(LIGHTBOX)
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(background).not.toMatch(/rgba?\(255,\s*255,\s*255/);
  });

  test('keeps the control pill below the image and inside the viewport', async ({ page }) => {
    await openFirst(page);
    const imageBox = await page.locator(ZOOM_IMAGE).boundingBox();
    const controlsBox = await page.locator('[data-zoom-controls]').boundingBox();
    const viewport = page.viewportSize();

    expect(imageBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(controlsBox!.y).toBeGreaterThanOrEqual(imageBox!.y + imageBox!.height);
    expect(controlsBox!.y + controlsBox!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('pans with pointer events while zoomed', async ({ page }) => {
    await openFirst(page);
    await page.locator(ZOOM_IN).click();
    const container = page.locator('[data-zoom-container]');

    await container.dispatchEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 1,
      clientX: 200,
      clientY: 200,
    });
    await container.dispatchEvent('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 1,
      clientX: 245,
      clientY: 225,
    });
    await container.dispatchEvent('pointerup', {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: 245,
      clientY: 225,
    });

    await expect(page.locator(ZOOM_IMAGE)).toHaveAttribute(
      'style',
      /translate\((?!0px, 0px)[^)]+\)/,
    );
  });

  test('pinch zoom is continuous on touch', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Touch gesture coverage runs on Pixel 7');
    await openFirst(page);
    const container = page.locator('[data-zoom-container]');

    await container.dispatchEvent('pointerdown', {
      pointerId: 11,
      pointerType: 'touch',
      isPrimary: true,
      clientX: 100,
      clientY: 160,
    });
    await container.dispatchEvent('pointerdown', {
      pointerId: 12,
      pointerType: 'touch',
      isPrimary: false,
      clientX: 200,
      clientY: 160,
    });
    await container.dispatchEvent('pointermove', {
      pointerId: 12,
      pointerType: 'touch',
      isPrimary: false,
      clientX: 237,
      clientY: 160,
    });

    const zoom = Number.parseFloat(
      (await page.locator('[data-zoom-label]').textContent())?.replace('×', '') ?? '1',
    );
    expect(zoom).toBeGreaterThan(1);
    expect(Math.abs(zoom * 4 - Math.round(zoom * 4))).toBeGreaterThan(0.01);
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
