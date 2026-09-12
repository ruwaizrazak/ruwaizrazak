import type { Page } from '@playwright/test';

/**
 * Scroll the window in small steps, yielding two frames between each.
 *
 * The TOC scroll-spy uses a ~10% tall IntersectionObserver band; a single large
 * jump can move a heading clean over it between samples, and the observer never
 * reports an intersection. Real reading never does that — but page.mouse.wheel
 * and scrollTo both can, which makes a naive test flaky for reasons that have
 * nothing to do with the code under test.
 */
export async function scrollSmoothlyTo(page: Page, target: number, step = 40): Promise<void> {
  await page.evaluate(
    async ([to, increment]) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const from = window.scrollY;
      const sign = to > from ? 1 : -1;
      for (let y = from; sign > 0 ? y < to : y > to; y += increment * sign) {
        window.scrollTo(0, y);
        await frame();
      }
      window.scrollTo(0, to);
      await frame();
    },
    [target, step] as const,
  );
}

/** Absolute document offset of an element, for use with scrollSmoothlyTo. */
export async function documentTop(page: Page, selector: string, nth = 0): Promise<number> {
  return page.evaluate(
    ([sel, index]) => {
      const el = document.querySelectorAll(sel)[index as number];
      if (!el) throw new Error(`No element for ${sel}[${index}]`);
      return el.getBoundingClientRect().top + window.scrollY;
    },
    [selector, nth] as const,
  );
}

/** Resolve once every running animation on the page has settled. */
export async function animationsSettled(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const running = document.getAnimations().map((a) => a.finished.catch(() => undefined));
    await Promise.all(running);
  });
}
