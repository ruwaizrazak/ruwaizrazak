import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

const DEMO = '[data-tocdemo]';
const BAND_DEMO = '[data-tocdemo][data-tocdemo-variant="band"]';
const EXPANDED_DEMO = '[data-tocdemo][data-tocdemo-variant="expanded"]';

test.describe('the TOC pill showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithTocAnatomy);
    // Islands hydrate later than DOMContentLoaded; measuring before that reads
    // the SSR markup, where no demo has an active row yet.
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  });

  test('renders one demo per variant, and the default one unchanged', async ({ page }) => {
    await expect(page.locator(DEMO)).toHaveCount(3);
    await expect(page.locator(BAND_DEMO)).toHaveCount(1);
    await expect(page.locator(EXPANDED_DEMO)).toHaveCount(1);
    // The default demo must render exactly as /live/ does: no variant attribute
    // at all, not an empty one.
    await expect(page.locator('[data-tocdemo]:not([data-tocdemo-variant])')).toHaveCount(1);
  });

  test('draws the band over the window the observer actually uses', async ({ page }) => {
    const frame = page.locator(BAND_DEMO);
    const band = frame.locator('[data-tocdemo-band]');
    const frameBox = (await frame.boundingBox())!;
    const bandBox = (await band.boundingBox())!;
    // rootMargin '-15% 0px -72% 0px' → a band from 15% to 28% of the pane. The
    // geometry is the assertion: a present-but-unstyled overlay would pass a
    // class-name check and still be invisible.
    expect((bandBox.y - frameBox.y) / frameBox.height).toBeCloseTo(0.15, 2);
    expect(bandBox.height / frameBox.height).toBeCloseTo(0.13, 2);
  });

  test('draws the band only on the band demo', async ({ page }) => {
    await expect(page.locator('[data-tocdemo-band]')).toHaveCount(1);
  });

  test('opens the expanded demo with its rail states already rendered', async ({ page }) => {
    const pill = page.locator(`${EXPANDED_DEMO} [data-tocdemo-pill]`);
    await expect(pill).toHaveAttribute('data-expanded', '');
    await expect(page.locator(`${EXPANDED_DEMO} [data-tocdemo-toggle]`)).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const rows = page.locator(`${EXPANDED_DEMO} [data-tocdemo-link]`);
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toHaveAttribute('data-active', '');
    // Everything after the active row is the path not yet walked.
    await expect(page.locator(`${EXPANDED_DEMO} li.is-upcoming`)).toHaveCount(3);
  });

  test('leaves the other two demos collapsed', async ({ page }) => {
    await expect(page.locator(`${DEMO}:not([data-tocdemo-variant="expanded"]) [data-tocdemo-pill][data-expanded]`)).toHaveCount(0);
  });

  test('keeps the three demos from colliding on heading ids', async ({ page }) => {
    const ids = await page
      .locator('[data-tocdemo-heading]')
      .evaluateAll((els) => els.map((el) => el.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('scrolls one pane without moving the others', async ({ page }) => {
    const labels = () =>
      page.locator('[data-tocdemo-current]').evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
    const before = await labels();

    await page.locator(`${BAND_DEMO} [data-tocdemo-scroller]`).evaluate(async (pane) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (let y = 0; y < 600; y += 30) {
        pane.scrollTop = y;
        await frame();
      }
    });

    await expect.poll(async () => (await labels())[1]).not.toBe(before[1]);
    const after = await labels();
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
  });

  test('lists this post’s own sections in the real pill, and none of the fake ones', async ({ page }) => {
    await expect(page.locator('[data-toc-pill]')).not.toHaveAttribute('hidden', '');
    await page.locator('[data-toc-toggle]').click();

    const headings = await page.locator('.note-layout article :is(h1, h2, h3)').count();
    expect(headings).toBeGreaterThan(2);
    await expect(page.locator('[data-toc-link]')).toHaveCount(headings);

    // The demos' headings are <div>s precisely so they can never reach here.
    const labels = await page.locator('[data-toc-link]').allInnerTexts();
    expect(labels.some((text) => text.includes('The Band'))).toBe(false);
  });
});
