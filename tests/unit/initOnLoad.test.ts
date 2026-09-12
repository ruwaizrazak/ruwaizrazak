// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initOnLoad } from '../../src/utils/initOnLoad';

/**
 * Regression suite for the double-fire that the whole Svelte migration was
 * working around. With ClientRouter mounted, astro:page-load fires on the
 * INITIAL load as well as on navigations, so the old two-line implementation ran
 * its callback twice on every first page view.
 */
const pageLoad = () => document.dispatchEvent(new Event('astro:page-load'));
const domReady = () => document.dispatchEvent(new Event('DOMContentLoaded'));

beforeEach(() => {
  // jsdom reports 'complete' by default; force the pre-ready branch.
  Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true });
});

describe('initOnLoad', () => {
  it('runs exactly once on first load, even though both events fire', () => {
    const fn = vi.fn();
    initOnLoad(fn);

    domReady();
    pageLoad(); // ClientRouter fires this on the initial load too

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs on each subsequent view-transition navigation', () => {
    const fn = vi.fn();
    initOnLoad(fn);

    domReady();
    pageLoad(); // initial — swallowed
    expect(fn).toHaveBeenCalledTimes(1);

    pageLoad(); // navigation 1
    pageLoad(); // navigation 2
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('still runs once when there is no ClientRouter (no astro:page-load at all)', () => {
    const fn = vi.fn();
    initOnLoad(fn);

    domReady();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('disposes the previous run before re-running on a navigation', () => {
    const cleanup = vi.fn();
    const fn = vi.fn(() => cleanup);
    initOnLoad(fn);

    domReady();
    pageLoad(); // initial — swallowed
    expect(fn).toHaveBeenCalledTimes(1);
    expect(cleanup).not.toHaveBeenCalled();

    pageLoad(); // navigation: dispose, then re-run
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('disposes on astro:before-swap, while the outgoing DOM still exists', () => {
    const cleanup = vi.fn();
    initOnLoad(() => cleanup);

    domReady();
    document.dispatchEvent(new Event('astro:before-swap'));

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('tolerates a callback that returns nothing', () => {
    const fn = vi.fn();
    initOnLoad(fn);
    domReady();
    expect(() => document.dispatchEvent(new Event('astro:before-swap'))).not.toThrow();
  });

  it('runs immediately when registered after the document is already parsed', () => {
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true });
    const fn = vi.fn();
    initOnLoad(fn);

    expect(fn).toHaveBeenCalledTimes(1);

    // The first astro:page-load after that must still be swallowed.
    pageLoad();
    expect(fn).toHaveBeenCalledTimes(1);

    pageLoad();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
