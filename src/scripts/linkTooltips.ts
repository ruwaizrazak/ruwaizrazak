/**
 * Client-side tooltip initialization for Link components.
 *
 * Finds every element with [data-link-tooltip] and attaches a tippy instance
 * using the pre-rendered HTML stored in data-tippy-content. Astro deduplicates
 * this script — even with many Link components on a page, it loads once.
 */
import tippy, { type Instance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import '../styles/link-tooltip.css';
import { initOnLoad } from '../utils/initOnLoad';

// LEARN: tippy renders its popup into document.body, OUTSIDE the element the
// ClientRouter swaps. Previously nothing destroyed these, so every client-side
// navigation stranded the old page's tooltip nodes in the body and leaked their
// listeners. Tracking the instances lets us tear them down on swap.
let instances: Instance[] = [];

function initLinkTooltips(): void {
  document.querySelectorAll<HTMLElement>('[data-link-tooltip]').forEach((el) => {
    // Skip elements that already have a tippy instance (e.g. after client-side navigation)
    if ((el as unknown as { _tippy?: Instance })._tippy) return;

    instances.push(
      tippy(el, {
        allowHTML: true,
        interactive: true,
        delay: [300, 100],
        maxWidth: 320,
        placement: 'top',
        arrow: true,
        appendTo: document.body,
      }),
    );
  });
}

function destroyLinkTooltips(): void {
  for (const instance of instances) instance.destroy();
  instances = [];
}

// astro:before-swap fires while the outgoing document is still present, which is
// the last moment the anchors these are attached to still exist.
document.addEventListener('astro:before-swap', destroyLinkTooltips);

initOnLoad(initLinkTooltips);
