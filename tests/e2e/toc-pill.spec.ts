import { test, expect } from '@playwright/test';
import { ROUTES } from './routes';
import { scrollSmoothlyTo, documentTop, settleLayout, animationsSettled } from './helpers';

const PILL = '[data-toc-pill]';
const TOGGLE = '[data-toc-toggle]';
const ROW = '[data-toc-link]';

test.describe('TOC pill', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.pageWithToc);
    await expect(page.locator(PILL)).toBeVisible();
    // This article lazy-loads 80+ images and grows ~1,700px as they decode.
    // Settle first so documentTop() offsets below are not stale.
    await settleLayout(page);
  });

  test('shows the first heading as its collapsed label', async ({ page }) => {
    const firstHeading = await page.locator('.note-layout article :is(h1,h2,h3)').first().innerText();
    await expect(page.locator('[data-toc-current]')).toHaveText(firstHeading.trim());
  });

  test('lists one row per heading, in document order', async ({ page }) => {
    // Collapse internal whitespace: webkit and chromium normalise innerText
    // differently, so a raw comparison fails on identical-looking text.
    const norm = (t: string) => t.replace(/\s+/g, ' ').trim();

    const headings = await page.locator('.note-layout article :is(h1,h2,h3)').allInnerTexts();
    await page.locator(TOGGLE).click();

    // The panel expands via grid-template-rows: 0fr -> 1fr. Until that finishes
    // the rows have no layout box, and innerText returns "" for an unrendered
    // element — on webkit that yielded 24 empty strings. Wait for the open state
    // and the transition before reading any text.
    await expect(page.locator(PILL)).toHaveAttribute('data-expanded', '');
    await animationsSettled(page);

    const rows = await page.locator(`${ROW} .toc-text`).allInnerTexts();
    expect(rows.map(norm)).toEqual(headings.map(norm));
  });

  test('expands into a panel with real height', async ({ page }) => {
    const pill = page.locator(PILL);
    const collapsedWidth = (await pill.boundingBox())!.width;

    await page.locator(TOGGLE).click();

    await expect(pill).toHaveAttribute('data-expanded', '');
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'true');
    await expect
      .poll(async () => (await page.locator('[data-toc-panel]').boundingBox())!.height)
      .toBeGreaterThan(100);
    await expect.poll(async () => (await pill.boundingBox())!.width).toBeGreaterThan(collapsedWidth);
  });

  test('swaps the odometer label for the panel title when open', async ({ page }) => {
    await page.locator(TOGGLE).click();
    await expect(page.locator('[data-toc-static-label]')).toHaveText('On this page');
    await expect.poll(async () =>
      page.locator('[data-toc-current]').evaluate((el) => getComputedStyle(el).opacity),
    ).toBe('0');
  });

  test('renders the timeline slots — they are drawn, not just present', async ({ page }) => {
    // Regression guard: these rows are created by JS, so Astro's scoped CSS
    // cannot reach them. When the rules were scoped, every slot computed to
    // width 0 and the whole timeline was invisible on the live site.
    await page.locator(TOGGLE).click();

    const slot = page.locator(`${ROW} .toc-slot`).first();
    const box = await slot.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.width, border: s.borderTopWidth, radius: s.borderTopLeftRadius };
    });

    expect(box.width).toBe('10px');
    expect(box.border).toBe('1px');
    expect(box.radius).not.toBe('0px');
  });

  test('draws the connecting rail between rows', async ({ page }) => {
    await page.locator(TOGGLE).click();
    const railContent = await page
      .locator(ROW)
      .first()
      .evaluate((el) => getComputedStyle(el, '::before').content);

    expect(railContent).not.toBe('none');
  });

  test('closes on Escape', async ({ page }) => {
    await page.locator(TOGGLE).click();
    await expect(page.locator(PILL)).toHaveAttribute('data-expanded', '');

    await page.keyboard.press('Escape');
    await expect(page.locator(PILL)).not.toHaveAttribute('data-expanded', '');
    await expect(page.locator(TOGGLE)).toHaveAttribute('aria-expanded', 'false');
  });

  test('closes when a click lands outside it', async ({ page }) => {
    await page.locator(TOGGLE).click();
    await page.locator('h1').first().click({ force: true });
    await expect(page.locator(PILL)).not.toHaveAttribute('data-expanded', '');
  });

  test('scrolls to a heading when its row is clicked, then closes', async ({ page }) => {
    await page.locator(TOGGLE).click();
    const rows = page.locator(ROW);
    const targetId = await rows.nth(1).getAttribute('data-toc-link');

    await rows.nth(1).click();

    await expect(page.locator(PILL)).not.toHaveAttribute('data-expanded', '');
    await expect
      .poll(
        async () =>
          page.evaluate(
            (id) => Math.abs(document.getElementById(id!)!.getBoundingClientRect().top),
            targetId,
          ),
        { timeout: 5000 },
      )
      // LEARN: not an arbitrary number. `.note-main-wrapper` carries the
      // scroll-driven `overlap-slide-sm` keyframe (translateY 0 -> -120px), so a
      // heading scrolled to `block: 'start'` settles up to 120px from the top.
      // Asserting `< 120` sat exactly on that boundary and failed at 120.046875
      // on mobile-chrome; allow the offset plus a little sub-pixel slack.
      .toBeLessThan(140);
  });

  test('marks the section the reader is in as active', async ({ page }) => {
    const secondId = await page
      .locator('.note-layout article :is(h1,h2,h3)')
      .nth(1)
      .getAttribute('id');
    const secondHeadingTop = await documentTop(page, '.note-layout article :is(h1,h2,h3)', 1);
    await scrollSmoothlyTo(page, secondHeadingTop - 150);

    await expect
      .poll(async () =>
        page.locator(`${ROW}[data-active]`).first().getAttribute('data-toc-link'),
      )
      .toBe(secondId);
  });

  test('rolls the collapsed label to the active section', async ({ page }) => {
    const secondHeading = (
      await page.locator('.note-layout article :is(h1,h2,h3)').nth(1).innerText()
    ).trim();
    const secondHeadingTop = await documentTop(page, '.note-layout article :is(h1,h2,h3)', 1);

    await scrollSmoothlyTo(page, secondHeadingTop - 200);

    await expect(page.locator('[data-toc-current]')).toHaveText(secondHeading);
  });

  test('fills passed rows and dims upcoming ones', async ({ page }) => {
    const lastIndex = (await page.locator('.note-layout article :is(h1,h2,h3)').count()) - 1;
    const lastTop = await documentTop(page, '.note-layout article :is(h1,h2,h3)', lastIndex);
    await scrollSmoothlyTo(page, lastTop - 200);

    await page.locator(TOGGLE).click();
    // The panel fades its rows in. Sampling computed opacity mid-transition
    // reads e.g. "0.992754" instead of "1", which is a stopwatch failure, not
    // a styling one — wait for the transitions to finish first.
    await animationsSettled(page);

    const states = await page.locator(ROW).evaluateAll((rows) =>
      rows.map((row) => {
        const slot = row.querySelector('.toc-slot')!;
        return {
          active: row.hasAttribute('data-active'),
          slotOpacity: getComputedStyle(slot).opacity,
          hasDot: getComputedStyle(slot, '::after').content !== 'none',
        };
      }),
    );

    const activeIndex = states.findIndex((s) => s.active);
    expect(activeIndex).toBeGreaterThan(0);

    // Everything above the active row is "read": solid dot, full-opacity ring.
    for (const passed of states.slice(0, activeIndex)) {
      expect(passed.hasDot).toBe(true);
      expect(passed.slotOpacity).toBe('1');
    }
    expect(states[activeIndex].hasDot).toBe(true);
  });

  test('fades out once the reader reaches the related notes', async ({ page }) => {
    const relatedTop = await documentTop(page, '.related-notes-section');
    await scrollSmoothlyTo(page, relatedTop - 100, 200);

    await expect(page.locator(PILL)).toHaveAttribute('data-toc-offscreen');
    await expect
      .poll(async () => page.locator(PILL).evaluate((el) => getComputedStyle(el).pointerEvents))
      .toBe('none');
  });

  test('does not appear on a page with no headings', async ({ page }) => {
    await page.goto(ROUTES.home);
    const pill = page.locator(PILL);
    if (await pill.count()) await expect(pill).toBeHidden();
  });
});
