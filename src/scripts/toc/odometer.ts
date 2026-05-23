/**
 * Odometer label — the sliding text in the collapsed pill that shows the
 * current heading. On change, the new label enters from above or below
 * (depending on document scroll direction) while the old one exits the
 * opposite way.
 *
 * Stateless w.r.t. scroll direction: the orchestrator owns the scroll
 * listener and passes a getter so the odometer reads the latest value at
 * animation start.
 */

import gsap from 'gsap';
import { reduceMotion } from './constants';

export interface Odometer {
  /**
   * Replace the visible label.
   * @param text     New heading text.
   * @param animate  False for first paint / a11y reduce-motion / empty container.
   */
  setText: (text: string, animate: boolean) => void;
}

export function createOdometer(
  labelEl: HTMLElement,
  getScrollDirection: () => 1 | -1,
): Odometer {
  function setText(text: string, animate: boolean) {
    // LEARN: killing tweens cancels their `onComplete: () => remove()`, so
    // any stale outgoing spans from prior interrupted tweens never get
    // removed. We must reap them at the top of every call.
    gsap.killTweensOf(labelEl.children);

    if (!animate || reduceMotion || labelEl.children.length === 0) {
      // Instant set — first paint, a11y reduce-motion, or no prior content.
      labelEl.innerHTML = '';
      const span = document.createElement('span');
      span.className = 'absolute inset-0 truncate';
      span.textContent = text;
      labelEl.appendChild(span);
      return;
    }

    // Reap leftovers from previously interrupted exit tweens; keep only the
    // most recent (lastElementChild) as the outgoing element.
    while (labelEl.children.length > 1) {
      labelEl.firstElementChild!.remove();
    }
    const oldEl = labelEl.lastElementChild as HTMLElement | null;
    // LEARN: the survivor may have been killed mid-entry (e.g. at
    // yPercent: 60), so snap it to the rest position before animating it
    // out — otherwise its exit tween starts from a weird offset.
    if (oldEl) gsap.set(oldEl, { yPercent: 0, opacity: 1 });

    const newEl = document.createElement('span');
    newEl.className = 'absolute inset-0 truncate';
    newEl.textContent = text;
    labelEl.appendChild(newEl);

    // Mirror document scroll: down → new enters from below (+100), old
    // exits up (-100). Direction is read at animation start so it reflects
    // the user's most recent scroll, not whatever it was when the
    // IntersectionObserver decided to fire.
    const direction = getScrollDirection();
    const enterFrom = direction === 1 ? 100 : -100;
    const exitTo = direction === 1 ? -100 : 100;

    gsap.fromTo(
      newEl,
      { yPercent: enterFrom, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' },
    );
    if (oldEl) {
      gsap.to(oldEl, {
        yPercent: exitTo,
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => oldEl.remove(),
      });
    }
  }

  return { setText };
}
