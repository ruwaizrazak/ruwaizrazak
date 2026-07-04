/**
 * Odometer label — the sliding text in the collapsed pill that shows the
 * current heading. On change, the new label enters from the scroll direction
 * while the old one exits the opposite way.
 *
 * Uses the built-in Web Animations API (no GSAP). Scroll direction is owned by
 * the orchestrator and read via a getter at animation start so the roll mirrors
 * the reader's most recent scroll, not whatever it was when the scroll-spy
 * IntersectionObserver happened to fire.
 */

// Sampled once — the user is unlikely to flip the OS setting mid-session.
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DURATION = 350;
// --ease-snappy from global.css — the site's designated enter/exit curve.
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

export interface Odometer {
  /**
   * Replace the visible label.
   * @param text     New heading text.
   * @param animate  False for first paint / reduce-motion / empty container.
   */
  setText: (text: string, animate: boolean) => void;
}

export function createOdometer(
  labelEl: HTMLElement,
  getScrollDirection: () => 1 | -1,
): Odometer {
  function makeSpan(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'absolute inset-0 truncate';
    span.textContent = text;
    return span;
  }

  function setText(text: string, animate: boolean): void {
    // Cancel in-flight animations (incl. child spans) so an interrupted
    // enter/exit doesn't strand a stale span — cancelling clears WAAPI's
    // fill so the survivor reverts to its natural rest position, ready to
    // animate out cleanly.
    labelEl.getAnimations({ subtree: true }).forEach((a) => a.cancel());

    if (!animate || reduceMotion || labelEl.children.length === 0) {
      // Instant set — first paint, reduce-motion, or no prior content.
      labelEl.replaceChildren(makeSpan(text));
      return;
    }

    // Reap any leftovers; keep only the most recent span as the outgoing one.
    while (labelEl.children.length > 1) labelEl.firstElementChild!.remove();
    const oldEl = labelEl.lastElementChild as HTMLElement | null;

    const newEl = makeSpan(text);
    labelEl.appendChild(newEl);

    // Mirror document scroll: down → new enters from below, old exits up.
    const down = getScrollDirection() === 1;
    const enterFrom = down ? '100%' : '-100%';
    const exitTo = down ? '-100%' : '100%';

    newEl.animate(
      [
        { transform: `translateY(${enterFrom})`, opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: DURATION, easing: EASE, fill: 'both' },
    );

    if (oldEl) {
      const exit = oldEl.animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${exitTo})`, opacity: 0 },
        ],
        { duration: DURATION, easing: EASE, fill: 'both' },
      );
      exit.onfinish = () => oldEl.remove();
    }
  }

  return { setText };
}
