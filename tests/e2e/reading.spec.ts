import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from './routes';

// A real link on this page measured 409px wide in a 335px text column at 375px
// before links could wrap (2026-09-18).
const LONG_LINK = 'the Man himself on how to manufacture desire';

// An INTERNAL link, so its tooltip resolves from the content collection at build
// time. External tooltips depend on a live OG fetch and can silently disappear.
const WRAP_TOOLTIP_ROUTE = '/series/prototyping-in-code/02-the-choice/';
const WRAP_TOOLTIP_TEXT = 'as partners, not magicians';

const openAs = async (page: Page, theme: 'light' | 'dark', width: number, route: string = ROUTES.pageWithHeroImage) => {
  await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(route);
  await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached();
};

test.describe('reading surface', () => {
  test('a long link wraps inside the text column on a phone', async ({ page }) => {
    await openAs(page, 'light', 375);

    const article = page.locator('.note-layout article');
    const link = article.locator('a.styled-link', { hasText: LONG_LINK });
    await link.scrollIntoViewIfNeeded();

    const geometry = await link.evaluate((a) => {
      const column = a.closest('article')!;
      const style = getComputedStyle(column);
      const right = column.getBoundingClientRect().right - parseFloat(style.paddingRight);
      const rects = [...a.getClientRects()];
      return { lines: rects.length, maxRight: Math.max(...rects.map((r) => r.right)), right };
    });
    expect(geometry.lines).toBeGreaterThan(1);
    expect(geometry.maxRight).toBeLessThanOrEqual(geometry.right + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  });

  test('links read as links: darker blue with an underline', async ({ page }) => {
    await openAs(page, 'light', 1280);

    const link = page.locator('.note-layout article a.styled-link', { hasText: LONG_LINK });
    await expect(link).toHaveCSS('color', 'rgb(11, 99, 206)');
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await expect(link).toHaveCSS('white-space', 'normal');
  });

  test('list text matches paragraphs and markers are muted, in both themes', async ({ page }) => {
    for (const [theme, text, marker] of [
      ['light', 'rgb(0, 53, 53)', 'rgb(92, 112, 112)'],
      ['dark', 'rgb(224, 232, 232)', 'rgb(169, 184, 184)'],
    ] as const) {
      await openAs(page, theme, 1280);
      const article = page.locator('.note-layout article');

      await expect(article.locator('> p').first()).toHaveCSS('color', text);
      const li = article.locator('> ul > li').first();
      await expect(li).toHaveCSS('color', text);
      expect(await li.evaluate((el) => getComputedStyle(el, '::marker').color)).toBe(marker);

      const counter = article.locator('> ol > li').first();
      expect(await counter.evaluate((el) => getComputedStyle(el, '::marker').color)).toBe(marker);
    }
  });
  test('the tooltip sits on top of a wrapped link, pointing at where the link starts', async ({ page }) => {
    await openAs(page, 'light', 375, WRAP_TOOLTIP_ROUTE);

    // Bind every link first, so this hover goes through tippy's own listener; the
    // lazy first-interaction path shows the tooltip without a pointer position.
    await page.locator('[data-link-tooltip] a').first().focus();
    await expect
      .poll(() =>
        page.locator('[data-link-tooltip]').evaluateAll((els) => els.every((el) => Boolean((el as any)._tippy))),
      )
      .toBe(true);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const wrapper = page.locator('[data-link-tooltip]', { hasText: WRAP_TOOLTIP_TEXT });
    // Centre it so tippy has room above and does not flip the tooltip below.
    await wrapper.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const link = await wrapper.evaluate((el) => {
      const rects = [...el.getClientRects()].filter((r) => r.width > 0);
      const first = rects[0];
      const last = rects[rects.length - 1];
      const box = el.getBoundingClientRect();
      return {
        count: rects.length,
        firstTop: first.top,
        firstCenter: first.left + first.width / 2,
        boxCenter: box.left + box.width / 2,
        hoverX: last.left + last.width / 2,
        hoverY: last.top + last.height / 2,
      };
    });
    expect(link.count).toBeGreaterThan(1);
    // Keeps this test discriminating: without inlinePositioning tippy centres on the
    // whole box, so the first fragment must sit well away from that centre.
    expect(Math.abs(link.firstCenter - link.boxCenter)).toBeGreaterThan(40);
    await page.mouse.move(link.hoverX, link.hoverY);

    await expect
      .poll(() => wrapper.evaluate((el) => Boolean((el as any)._tippy?.state.isVisible)), { timeout: 5000 })
      .toBe(true);
    const tip = await wrapper.evaluate((el) => {
      const box = (el as any)._tippy.popper.querySelector('.tippy-box') as HTMLElement;
      const arrow = box.querySelector('.tippy-arrow')!.getBoundingClientRect();
      return { bottom: box.getBoundingClientRect().bottom, arrowCenter: arrow.left + arrow.width / 2 };
    });
    // On top: just above the link's first line (tippy's 10px offset + 8px arrow;
    // webkit's line box adds ~2px). Under one 29.7px line, so never a line higher.
    expect(tip.bottom).toBeLessThanOrEqual(link.firstTop + 1);
    expect(link.firstTop - tip.bottom).toBeLessThan(26);
    // Pointing at where the link starts, not at the middle of its box.
    expect(Math.abs(tip.arrowCenter - link.firstCenter)).toBeLessThan(12);
  });
});
