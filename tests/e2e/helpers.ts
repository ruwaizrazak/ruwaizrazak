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

      // Two-phase scroll. Stepping the WHOLE distance at `increment` costs
      // O(distance / increment) double-frames — on the 26,000px CODM essay
      // that is ~650 of them, which overruns the 30s test timeout (and did).
      // Only the final stretch has to be fine-grained: that is where the target
      // heading crosses the scroll-spy's ~10%-tall band and goes active.
      const FINE = Math.max(increment * 12, 480);
      const coarseTarget = to > window.scrollY ? to - FINE : to + FINE;
      // Guard: only take the coarse jump when it actually moves us toward `to`.
      if (Math.abs(coarseTarget - window.scrollY) > FINE) {
        window.scrollTo(0, coarseTarget);
        await frame();
      }

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

/**
 * Load every lazy image and wait for layout to stop moving.
 *
 * Long article pages grow as lazy images decode — the CODM essay goes from
 * ~24,980px to ~26,640px. Any absolute offset measured before that settles is
 * stale by well over a viewport, so a scroll aimed at it lands in the wrong
 * section. Call this before measuring with documentTop().
 */
export async function settleLayout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) {
      if (img.loading === 'lazy') img.loading = 'eager';
    }
    await Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map((i) => new Promise((r) => { i.onload = i.onerror = () => r(undefined); })),
    );
    let last = -1;
    // Settle: two consecutive frames reporting the same height.
    for (let i = 0; i < 30 && document.documentElement.scrollHeight !== last; i++) {
      last = document.documentElement.scrollHeight;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
  });
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

/**
 * Resolve once the page's finite animations have settled.
 *
 * Two traps this avoids:
 *  - `getAnimations()` includes INFINITE animations (the garden sprite walk,
 *    the TOC dot pulse). Awaiting their `.finished` never resolves, which hangs
 *    the whole test until the 30s timeout.
 *  - A transition can start a frame after the click that triggered it, so this
 *    also races a deadline instead of trusting the snapshot to be complete.
 */
export async function animationsSettled(page: Page, timeoutMs = 2000): Promise<void> {
  await page.evaluate(async (ms) => {
    const isFinite_ = (a: Animation) => {
      const timing = a.effect?.getComputedTiming();
      return !!timing && timing.iterations !== Infinity && timing.endTime !== Infinity;
    };
    const settle = async () => {
      // Two passes: the second catches transitions that began after the first.
      for (let i = 0; i < 2; i++) {
        await Promise.all(
          document.getAnimations().filter(isFinite_).map((a) => a.finished.catch(() => undefined)),
        );
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
    };
    await Promise.race([settle(), new Promise((r) => setTimeout(r, ms))]);
  }, timeoutMs);
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
