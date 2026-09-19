import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

// PSI's mobile profile: a 412px-wide phone at 1.75 device pixels per CSS pixel.
test.use({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1.75 });

test.describe('work card images on a phone', () => {
  test('fetches an AVIF sized to the drawn image, not the full-size original', async ({ page }) => {
    await page.goto(ROUTES.home);
    const images = page.locator('.work-card-image');
    await expect(images).toHaveCount(3);

    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.currentSrc !== ''))
        .toBe(true);
      const r = await img.evaluate((el: HTMLImageElement) => {
        const source = el.parentElement!.querySelector('source[type="image/avif"]')!;
        // naturalWidth is density-corrected for `w` srcsets, so read the file width off the srcset.
        const list = source.getAttribute('srcset')!.split(',').map((p) => p.trim().split(/\s+/));
        const chosen = list.find(([url]) => el.currentSrc.endsWith(url));
        const aspect = Number(el.getAttribute('width')) / Number(el.getAttribute('height'));
        const drawn = Math.max(el.clientWidth, el.clientHeight * aspect);
        return {
          src: el.currentSrc,
          file: chosen ? parseInt(chosen[1], 10) : 0,
          largest: Math.max(...list.map(([, w]) => parseInt(w, 10))),
          need: drawn * devicePixelRatio,
        };
      });
      expect(r.src).toMatch(/\.avif$/);
      expect(r.file).toBeGreaterThanOrEqual(r.need * 0.8);
      expect(r.file).toBeLessThan(r.largest);
    }
  });

  for (const [name, route, cards] of [
    ['about', ROUTES.about, '[data-about-projects] .card-band'],
    ['other works', ROUTES.workWithVideo, '[data-other-works-card] .card-band'],
  ] as const) {
    test(`${name}: compact card images fill their band instead of collapsing`, async ({ page }) => {
      await page.goto(route);
      const bands = page.locator(cards);
      await expect(bands.first()).toBeAttached();
      for (const band of await bands.all()) {
        await band.scrollIntoViewIfNeeded();
        const [bandW, bandH, imgW, imgH] = await band.evaluate((el) => {
          const img = el.querySelector('img')!;
          return [el.clientWidth, el.clientHeight, img.clientWidth, img.clientHeight];
        });
        // WebKit rounds subpixel band heights differently from the image (measured 192 vs 191).
        expect(imgW).toBeGreaterThan(100);
        expect(Math.abs(imgW - bandW)).toBeLessThanOrEqual(1);
        expect(Math.abs(imgH - bandH)).toBeLessThanOrEqual(1);
      }
    });
  }
});
