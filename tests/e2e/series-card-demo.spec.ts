import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

const DEMO = '[data-seriesdemo]';
const DEFAULT_DEMO = '[data-seriesdemo]:not([data-seriesdemo-variant])';
const SWALLOWED = '[data-seriesdemo][data-seriesdemo-variant="swallowed"]';

/**
 * Click the real pixel at an element's centre rather than the element.
 *
 * LEARN: `locator.click()` waits for the target to receive pointer events, so on
 * the `swallowed` demo — where the blanket link deliberately covers the rows —
 * it would time out instead of demonstrating the bug. A mouse click at the
 * coordinate is what a reader actually does, and it lands on whatever is on top.
 */
async function clickCentre(page: import('@playwright/test').Page, selector: string) {
  const target = page.locator(selector);
  // Scroll first, measure second. `boundingBox()` is viewport-relative, and both
  // demos sit well below the fold — measuring before scrolling sends the click to
  // whatever happens to occupy those coordinates instead of to the row.
  await target.scrollIntoViewIfNeeded();
  const box = (await target.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('the series card showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithSeriesCardDemo);
    await expect(page.locator(DEMO).first()).toBeVisible();
    await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
  });

  test('renders the shipped card and the broken one', async ({ page }) => {
    await expect(page.locator(DEMO)).toHaveCount(2);
    await expect(page.locator(DEFAULT_DEMO)).toHaveCount(1);
    await expect(page.locator(SWALLOWED)).toHaveCount(1);
    // One island per demo. Scoped with :has() because the route also hydrates
    // the header nav, the footer, the real TOC pill and the related-notes strip.
    await expect(page.locator('astro-island:has([data-seriesdemo])')).toHaveCount(2);
  });

  test('scrolls the list inside a card that does not grow', async ({ page }) => {
    const card = page.locator(`${DEFAULT_DEMO} [data-seriesdemo-card]`);
    const list = page.locator(`${DEFAULT_DEMO} [data-seriesdemo-list]`);

    const overflow = await list.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    // If the invented parts ever stop overflowing, every other assertion here is
    // vacuous — so assert the overflow itself.
    expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);

    const cardBox = (await card.boundingBox())!;
    const listBox = (await list.boundingBox())!;
    expect(listBox.height).toBeLessThan(cardBox.height);

    const before = cardBox.height;
    await list.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    expect((await card.boundingBox())!.height).toBe(before);
  });

  test('gives the row link the click, not the card', async ({ page }) => {
    await clickCentre(page, `${DEFAULT_DEMO} [data-seriesdemo-row="1"]`);
    await expect(page.locator(`${DEFAULT_DEMO} [data-seriesdemo-readout]`)).toContainText('Part 2');
  });

  test('loses the click to the card when the list drops below the blanket link', async ({ page }) => {
    // The deliberately broken one: same pixel, different destination.
    await clickCentre(page, `${SWALLOWED} [data-seriesdemo-row="1"]`);
    await expect(page.locator(`${SWALLOWED} [data-seriesdemo-readout]`)).toContainText('whole card');
  });

  test('keeps the scroll inside the list', async ({ page }) => {
    const list = page.locator(`${DEFAULT_DEMO} [data-seriesdemo-list]`);
    expect(await list.evaluate((el) => getComputedStyle(el).overscrollBehaviorY)).toBe('contain');
    // The property only means something if there is something to overscroll.
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  });

  test('stays out of the article outline and lets the real TOC pill work', async ({ page }) => {
    // Two demos rendering <h3>An Invented Series</h3> gave the article two
    // headings with the same slug. TocPill keys its {#each} by heading id, so the
    // duplicate threw each_key_duplicate and the pill rendered nothing — on a page
    // whose companion post is about that pill. The demo must contribute no
    // headings at all.
    const demoHeadings = await page.locator(`${DEMO} :is(h1, h2, h3, h4, h5, h6)`).count();
    expect(demoHeadings).toBe(0);

    const ids = await page
      .locator('.note-layout article :is(h1, h2, h3)')
      .evaluateAll((els) => els.map((el) => el.id));
    expect(new Set(ids).size).toBe(ids.length);

    await expect(page.locator('[data-toc-toggle]')).toBeVisible();
    await page.locator('[data-toc-toggle]').click();
    await expect(page.locator('[data-toc-link]')).toHaveCount(ids.length);
  });

  test('fades the bottom edge of the list rather than cutting it', async ({ page }) => {
    const mask = await page
      .locator(`${DEFAULT_DEMO} [data-seriesdemo-list]`)
      .evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage);
    expect(mask).toContain('linear-gradient');
  });
});
