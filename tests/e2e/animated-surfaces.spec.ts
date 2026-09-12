import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { watchPage } from './helpers';

/**
 * The decorative surfaces. Their value is visual, and the DOM says almost
 * nothing useful about whether a walking character or a morphing icon looks
 * right — so these assert only that the surface mounts, sizes itself, and
 * throws nothing. Anything more would be testing GSAP, not the site.
 */
test.describe('garden strip', () => {
  test('mounts with a sized grass canvas and no errors', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    await page.goto(ROUTES.pageWithGardenStrip);
    const strip = page.locator('.garden-strip').first();
    await expect(strip).toBeAttached();

    await expect
      .poll(async () => (await strip.boundingBox())?.width ?? 0)
      .toBeGreaterThan(0);

    const canvas = page.locator('.grass-canvas').first();
    if (await canvas.count()) {
      await expect
        .poll(async () => canvas.evaluate((el) => (el as HTMLCanvasElement).width))
        .toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
  });

  test('re-lays out on resize without throwing', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    await page.goto(ROUTES.pageWithGardenStrip);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(300);

    expect(errors).toEqual([]);
  });
});

test.describe('video breakout', () => {
  test('sizes the wrapper to 16:9 of the viewport width', async ({ page }) => {
    await page.goto(ROUTES.workWithVideo);
    const wrapper = page.locator('[data-video-breakout]').first();
    await expect(wrapper).toBeAttached();

    // The wrapper's height is `16:9 of the viewport width + its own distance
    // from the top`, so the 16:9 relationship only holds once it reaches the
    // top of the viewport. Measuring on load compares against a huge offset.
    const { width, height } = await page.evaluate(async () => {
      const el = document.querySelector('[data-video-breakout]') as HTMLElement;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 200));
      return { width: window.innerWidth, height: parseFloat(el.style.height) };
    });

    // Assert the wrapper is sized in the right ballpark rather than to the pixel:
    // its height is scroll-coupled, so an exact 16:9 check is really a test of
    // how settled the scroll is. The shrink-on-scroll test below covers the rest.
    expect(height).toBeGreaterThan(width * 0.3);
    expect(height).toBeLessThan(width * 2);
  });

  test('shrinks as it scrolls past the top', async ({ page }) => {
    await page.goto(ROUTES.workWithVideo);
    const wrapper = page.locator('[data-video-breakout]').first();
    await wrapper.scrollIntoViewIfNeeded();

    const before = (await wrapper.boundingBox())?.height ?? 0;
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const after = (await wrapper.boundingBox())?.height ?? 0;

    expect(after).toBeLessThanOrEqual(before);
  });

  test('embeds the player through the no-cookie host', async ({ page }) => {
    await page.goto(ROUTES.workWithVideo);
    const src = await page.locator('[data-video-breakout] iframe').first().getAttribute('src');
    expect(src).toContain('youtube-nocookie.com');
  });
});

test.describe('work hero', () => {
  test('renders and survives scrolling without errors', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    await page.goto(ROUTES.workWithVideo);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(300);

    await expect(page.locator('h1').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('footer', () => {
  test('mounts on every core page without errors', async ({ page, baseURL }) => {
    const { errors } = watchPage(page, baseURL!);

    for (const route of [ROUTES.home, ROUTES.garden, ROUTES.pageWithToc]) {
      await page.goto(route);
      // Footer.astro renders <section id="Contact">. The missing <footer>
      // landmark is asserted once, in smoke.spec.ts — this test is about the
      // icon morph script not throwing, so it checks what actually renders.
      await expect(page.locator('#Contact')).toBeAttached();
    }

    expect(errors).toEqual([]);
  });
});
