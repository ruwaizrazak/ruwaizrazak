// Replaced 13+ instances of the two-line DOMContentLoaded + astro:page-load pattern.

/**
 * Register a function to run on both initial page load and Astro view-transition navigations.
 */
export function initOnLoad(fn: () => void) {
  document.addEventListener('DOMContentLoaded', fn);
  document.addEventListener('astro:page-load', fn);
}
