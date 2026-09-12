// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { initWebmentionsToggle } from '../../../src/scripts/webmentionsToggle';

/** Mirrors the markup Webmentions.astro emits: first four visible, rest hidden. */
function renderMentions(total: number) {
  const replies = Array.from({ length: total })
    .map((_, i) => `<div class="wm-reply${i >= 4 ? ' wm-hidden' : ''}">reply ${i}</div>`)
    .join('');
  document.body.innerHTML = `
    <div class="wm-mentions-section">
      <div class="wm-mentions-list">${replies}</div>
      <button class="wm-show-more" data-total="${total}">Show ${total - 4} more</button>
    </div>`;
  return {
    button: document.querySelector<HTMLButtonElement>('.wm-show-more')!,
    hiddenCount: () => document.querySelectorAll('.wm-reply.wm-hidden').length,
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('initWebmentionsToggle', () => {
  it('reveals the replies beyond the first four', () => {
    const { button, hiddenCount } = renderMentions(6);
    initWebmentionsToggle();
    expect(hiddenCount()).toBe(2);

    button.click();
    expect(hiddenCount()).toBe(0);
  });

  it('swaps the label between "Show N more" and "Show less"', () => {
    const { button } = renderMentions(6);
    initWebmentionsToggle();

    button.click();
    expect(button.textContent).toBe('Show less');

    button.click();
    expect(button.textContent).toBe('Show 2 more');
  });

  it('collapses back to exactly four visible replies', () => {
    const { button, hiddenCount } = renderMentions(9);
    initWebmentionsToggle();

    button.click();
    button.click();
    expect(hiddenCount()).toBe(5);
  });

  it('never hides the first four', () => {
    const { button } = renderMentions(6);
    initWebmentionsToggle();
    button.click();
    button.click();

    const replies = [...document.querySelectorAll('.wm-reply')];
    expect(replies.slice(0, 4).every((r) => !r.classList.contains('wm-hidden'))).toBe(true);
  });

  it('is idempotent — a second init does not double-bind the button', () => {
    // initOnLoad fires on both DOMContentLoaded and astro:page-load, so this
    // runs twice on first load. Double-binding would toggle twice per click,
    // making the button look dead.
    const { button, hiddenCount } = renderMentions(6);
    initWebmentionsToggle();
    initWebmentionsToggle();

    button.click();
    expect(hiddenCount()).toBe(0);
  });

  it('does nothing when there is no toggle button', () => {
    document.body.innerHTML = '<div class="wm-mentions-section"></div>';
    expect(() => initWebmentionsToggle()).not.toThrow();
  });
});
