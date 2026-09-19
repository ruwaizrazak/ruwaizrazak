/**
 * Client-side tooltip binding for Link components.
 *
 * The tooltip CONTENT is rendered at build time into data-tippy-content; this
 * only attaches tippy instances to it.
 *
 * LEARN: tippy is imported DYNAMICALLY, on first interaction. It is 36KB — the
 * single largest chunk on every content route — and it was previously in the
 * critical path of the initial page load purely so that a hover, which may never
 * happen, would be ready. Now the page ships a few hundred bytes of delegated
 * listener, and the library is fetched the first time a reader actually points at
 * or focuses a tooltip link.
 *
 * The stylesheets stay static imports: CSS is extracted by Vite at build time and
 * costs no JavaScript, and having it already parsed avoids an unstyled first
 * tooltip.
 */
import type { Instance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import '../styles/link-tooltip.css';

const SELECTOR = '[data-link-tooltip]';

// LEARN: tippy renders its popup into document.body, OUTSIDE the element the
// ClientRouter swaps. Previously nothing destroyed these, so every client-side
// navigation stranded the old page's tooltip nodes in the body and leaked their
// listeners. Tracking the instances lets us tear them down on swap.
let instances: Instance[] = [];
let loading: Promise<void> | null = null;

async function bindAll(): Promise<void> {
  const { default: tippy, inlinePositioning } = await import('tippy.js');
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    // Skip elements that already have a tippy instance (e.g. after client-side navigation)
    if ((el as unknown as { _tippy?: Instance })._tippy) return;
    instances.push(
      tippy(el, {
        allowHTML: true,
        interactive: true,
        delay: [300, 100],
        maxWidth: 320,
        placement: 'top',
        // LEARN: links are inline now and can wrap. inlinePositioning anchors the
        // tooltip to the link's first line instead of the box around all its lines.
        inlinePositioning: true,
        plugins: [inlinePositioning],
        arrow: true,
        appendTo: document.body,
      }),
    );
  });
}

/**
 * Load tippy (once) and bind every tooltip on the page, then reveal the one the
 * reader is already pointing at — tippy's own listeners are attached at creation,
 * so the in-flight hover would otherwise be missed.
 */
async function activate(target: HTMLElement): Promise<void> {
  loading ??= bindAll();
  await loading;
  // Re-bind if a navigation added fresh anchors after the first load.
  if (!(target as unknown as { _tippy?: Instance })._tippy) await bindAll();
  (target as unknown as { _tippy?: Instance })._tippy?.show();
}

function onFirstInteraction(event: Event): void {
  const target = (event.target as Element | null)?.closest<HTMLElement>(SELECTOR);
  if (target) void activate(target);
}

// pointerover and focusin both bubble, so one delegated listener each covers
// every anchor on the page, including ones added by a later navigation.
document.addEventListener('pointerover', onFirstInteraction);
document.addEventListener('focusin', onFirstInteraction);

document.addEventListener('astro:before-swap', () => {
  for (const instance of instances) instance.destroy();
  instances = [];
});
