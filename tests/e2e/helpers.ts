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
  // Neutralise CSS smooth scrolling first: with it on, window.scrollTo only
  // *starts* an animation, so the stepping below races the browser's own
  // easing and lands somewhere non-deterministic (worst on webkit).
  await page.addStyleTag({ content: 'html, body { scroll-behavior: auto !important; }' });
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

export interface PageWatcher {
  /** Real problems only — see watchPage(). */
  errors: string[];
}

/**
 * Collect genuine page problems, ignoring third-party noise.
 *
 * The site loads Google Fonts, a jsdelivr stylesheet and GA. In a sandboxed or
 * offline run those fail with 403/blocked and surface as "Failed to load
 * resource" console errors that say nothing about the site. Asserting on raw
 * console errors therefore fails for reasons the code cannot control.
 *
 * So: uncaught exceptions always count, console errors count unless they are
 * resource-load failures, and failed responses count only when same-origin —
 * which still catches a real broken link like /books.
 */
export function watchPage(page: import('@playwright/test').Page, baseURL: string): PageWatcher {
  const errors: string[] = [];

  page.on('pageerror', (err) => errors.push(`uncaught: ${err.message}`));

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (msg.text().startsWith('Failed to load resource')) return; // covered below, same-origin only
    errors.push(`console: ${msg.text()}`);
  });

  page.on('response', (res) => {
    if (!res.url().startsWith(baseURL)) return; // third-party CDNs are not ours
    if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
  });

  return { errors };
}
