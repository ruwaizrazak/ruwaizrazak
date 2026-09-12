// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeFilters } from '../../../src/scripts/listing/listingFilters';

/**
 * NOTE: none of this runs on the live site. The select-dropdown branches look
 * for `.collection-filter` / `#tagDropdown` / `#showMoreTags` / `#additionalTags`,
 * which appear nowhere in src/. The tag-chip branch needs `a[data-tag]`, rendered
 * only by Tag.astro, which is only used by GardenStickyBar.astro — and that is
 * commented out in GardenView.astro:21. `data-tag` appears in zero built pages.
 *
 * These tests are kept as a behavioural spec for the module: if the sticky bar
 * is ever uncommented, they say what the filtering is supposed to do.
 */
function renderGrid() {
  document.body.innerHTML = `
    <a href="/tags/all" data-tag="all">all</a>
    <a href="/tags/design" data-tag="design">design</a>
    <a href="/tags/ux" data-tag="ux">ux</a>

    <div class="post-item" id="p1" data-collection="notes" data-tags="design ux"></div>
    <div class="post-item" id="p2" data-collection="essays" data-tags="ux"></div>
    <div class="post-item" id="p3" data-collection="notes" data-tags="writing"></div>`;
  initializeFilters();
  return {
    link: (tag: string) => document.querySelector<HTMLAnchorElement>(`a[data-tag="${tag}"]`)!,
    post: (id: string) => document.getElementById(id)!,
  };
}

/** Non-matching posts only reach display:none after the 200ms fade-out. */
const settle = () => vi.advanceTimersByTime(250);

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('tag filtering', () => {
  it('shows every post before any tag is chosen', () => {
    const { post } = renderGrid();
    settle();
    for (const id of ['p1', 'p2', 'p3']) {
      expect(post(id).style.display).toBe('block');
    }
  });

  it('keeps only the posts carrying the chosen tag', () => {
    const { link, post } = renderGrid();
    link('design').click();
    settle();

    expect(post('p1').style.display).toBe('block');
    expect(post('p2').style.display).toBe('none');
    expect(post('p3').style.display).toBe('none');
  });

  it('matches any tag in the space-separated list, not just the first', () => {
    const { link, post } = renderGrid();
    link('ux').click();
    settle();

    expect(post('p1').style.display).toBe('block');
    expect(post('p2').style.display).toBe('block');
    expect(post('p3').style.display).toBe('none');
  });

  it('restores the full grid when "all" is chosen again', () => {
    const { link, post } = renderGrid();
    link('design').click();
    settle();
    link('all').click();
    settle();

    for (const id of ['p1', 'p2', 'p3']) {
      expect(post(id).style.display).toBe('block');
    }
  });

  it('moves the active class to the chosen chip only', () => {
    const { link } = renderGrid();
    link('design').click();
    expect(link('design').classList.contains('active')).toBe(true);

    link('ux').click();
    expect(link('ux').classList.contains('active')).toBe(true);
    expect(link('design').classList.contains('active')).toBe(false);
  });

  it('suppresses navigation to /tags/<tag>', () => {
    const { link } = renderGrid();
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link('design').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('bails out harmlessly when the page has no post grid', () => {
    document.body.innerHTML = '<a data-tag="design">design</a>';
    expect(() => initializeFilters()).not.toThrow();
  });
});
