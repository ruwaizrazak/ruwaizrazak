/**
 * Client-side tooltip initialization for Link components.
 *
 * Finds every element with [data-link-tooltip] and attaches a tippy instance
 * using the pre-rendered HTML stored in data-tippy-content. Astro deduplicates
 * this script — even with many Link components on a page, it loads once.
 */
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import '../styles/link-tooltip.css';

function initLinkTooltips() {
  document.querySelectorAll<HTMLElement>('[data-link-tooltip]').forEach((el) => {
    // Skip elements that already have a tippy instance (e.g. after client-side navigation)
    if ((el as any)._tippy) return;

    tippy(el, {
      allowHTML: true,
      interactive: true,
      delay: [300, 100],
      maxWidth: 320,
      placement: 'top',
      arrow: true,
      appendTo: document.body,
    });
  });
}

// Standard page load
document.addEventListener('DOMContentLoaded', initLinkTooltips);
// Astro view-transitions / client-side navigation
document.addEventListener('astro:page-load', initLinkTooltips);
