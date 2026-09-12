import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';

const DEMO = '[data-tocdemo]';
const PILL = '[data-tocdemo-pill]';
const TOGGLE = '[data-tocdemo-toggle]';
const ROW = '[data-tocdemo-link]';
const SCROLLER = '[data-tocdemo-scroller]';

/** Step the demo's own pane, yielding frames so its scroll-spy band is not skipped. */
async function scrollPane(page: import('@playwright/test').Page, to: number) {
  await page.evaluate(async (target) => {
    const pane = document.querySelector('[data-tocdemo-scroller]') as HTMLElement;
    const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    for (let y = pane.scrollTop; y < target; y += 30) {
      pane.scrollTop = y;
      await frame();
    }
    pane.scrollTop = target;
    await frame();
  }, to);
}

test.describe('inline TOC pill demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithTocDemo);
    await expect(page.locator(DEMO).first()).toBeVisible();
  });

  test('starts on the first fake section', async ({ page }) => {
    const firstHeading = await page.locator('[data-tocdemo-heading]').first().innerText();
    await expect(page.locator('[data-tocdemo-current]')).toHaveText(firstHeading.trim());
  });

  test('shows exactly one label span at rest — no stacked leftovers', async ({ page }) => {
    await expect
      .poll(async () => page.locator('[data-tocdemo-current] > *').count())
      .toBe(1);
  });

  test('expands and collapses', async ({ page }) => {
    await page.locator(TOGGLE).click();
    await expect(page.locator(PILL)).toHaveAttribute('data-expanded', '');
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'true');

    await page.locator(TOGGLE).click();
    await expect(page.locator(PILL)).not.toHaveAttribute('data-expanded', '');
  });

  test('lists one row per fake heading', async ({ page }) => {
    const headings = await page.locator('[data-tocdemo-heading]').count();
    expect(await page.locator(ROW).count()).toBe(headings);
  });

  test('tracks the section as the inner pane scrolls', async ({ page }) => {
    const before = await page.locator(`${ROW}[data-active]`).getAttribute('data-tocdemo-link');
    await scrollPane(page, 500);

    const after = await page.locator(`${ROW}[data-active]`).getAttribute('data-tocdemo-link');
    expect(after).not.toBe(before);
    await expect(page.locator('[data-tocdemo-current]')).not.toHaveText('');
  });

  test('scrolls only its own pane, never the page', async ({ page }) => {
    // The demo sits mid-article; a row click that scrolled the window would
    // yank the reader away from the paragraph they were reading.
    await page.locator(DEMO).first().scrollIntoViewIfNeeded();
    const pageScroll = await page.evaluate(() => window.scrollY);

    await page.locator(TOGGLE).click();
    await page.locator(ROW).last().click();

    await expect.poll(async () => page.locator(`${SCROLLER}`).evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - pageScroll)).toBeLessThan(5);
  });

  test('renders its timeline slots', async ({ page }) => {
    await page.locator(TOGGLE).click();
    const width = await page
      .locator(`${ROW} .tocdemo-slot`)
      .first()
      .evaluate((el) => getComputedStyle(el).width);
    expect(width).toBe('10px');
  });

  test('does not interfere with the real TOC pill', async ({ page }) => {
    // The demo's fake headings are <div>s precisely so initTOC() cannot pick
    // them up. If they ever became real headings they would pollute the
    // article's outline and the page's own table of contents.
    await page.goto(ROUTES.pageWithTocDemo);
    const fakeHeadingTags = await page
      .locator('[data-tocdemo-heading]')
      .evaluateAll((els) => els.map((e) => e.tagName));

    expect(fakeHeadingTags.every((t) => t === 'DIV')).toBe(true);
  });
});
