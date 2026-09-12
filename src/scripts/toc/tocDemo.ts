/**
 * Driver for the in-article TOC pill demo (src/components/mdxComponents/TocPillDemo.astro).
 *
 * Same behaviour as the real pill in src/scripts/toc/toc.ts — scroll-spy, the
 * odometer label, open/close — with three differences that come from being a demo
 * embedded in a page rather than the page's own chrome:
 *   1. MANY instances. Every [data-tocdemo] root is set up independently (the
 *      /live index renders every month's content on one page).
 *   2. The scroll container is the demo's own pane, not the window — so the
 *      IntersectionObserver takes `root: scroller` and row clicks scroll that
 *      pane by offsetTop instead of calling scrollIntoView (which would drag the
 *      whole page along with it).
 *   3. Rows are already in the DOM (rendered by Astro), so there's no list to
 *      build — this module only toggles attributes.
 *
 * The open/close animation is pure CSS; JS only flips [data-expanded].
 */

import { createOdometer } from './odometer';

// Observers are kept so re-running after a view transition can disconnect the
// ones whose root left the DOM. An observer with live targets stays alive on its
// own, so dropping the reference alone wouldn't be enough.
const observers: { root: HTMLElement; observer: IntersectionObserver }[] = [];
let documentWired = false;

export function initTocDemo(): void {
  // Reap instances from the previous page before wiring this one's.
  for (let i = observers.length - 1; i >= 0; i--) {
    if (!observers[i].root.isConnected) {
      observers[i].observer.disconnect();
      observers.splice(i, 1);
    }
  }

  document.querySelectorAll<HTMLElement>('[data-tocdemo]').forEach(setupInstance);
  wireDocumentOnce();
}

function setExpanded(pill: HTMLElement, open: boolean): void {
  pill.toggleAttribute('data-expanded', open);
  pill.querySelector('[data-tocdemo-panel]')?.setAttribute('aria-hidden', String(!open));
  pill.querySelector('[data-tocdemo-toggle]')?.setAttribute('aria-expanded', String(open));
}

function setupInstance(root: HTMLElement): void {
  // Per-element guard, not a module flag: initOnLoad double-fires on first load,
  // and a view transition hands us brand-new (unguarded) elements.
  if (root.dataset.tocdemoBound === '1') return;

  const scroller = root.querySelector<HTMLElement>('[data-tocdemo-scroller]');
  const pill = root.querySelector<HTMLElement>('[data-tocdemo-pill]');
  const toggle = root.querySelector<HTMLElement>('[data-tocdemo-toggle]');
  const list = root.querySelector<HTMLElement>('[data-tocdemo-list]');
  const label = root.querySelector<HTMLElement>('[data-tocdemo-current]');
  if (!scroller || !pill || !toggle || !list || !label) return;

  const headings = Array.from(scroller.querySelectorAll<HTMLElement>('[data-tocdemo-heading]'));
  if (headings.length === 0) return;

  root.dataset.tocdemoBound = '1';

  // Direction of the reader's last scroll — the odometer rolls the new label in
  // from that side, so the motion matches the gesture.
  let direction: 1 | -1 = 1;
  let lastTop = scroller.scrollTop;
  scroller.addEventListener(
    'scroll',
    () => {
      const top = scroller.scrollTop;
      if (top === lastTop) return;
      direction = top > lastTop ? 1 : -1;
      lastTop = top;
    },
    { passive: true },
  );

  const odometer = createOdometer(label, () => direction);

  let activeId = '';
  // `animate: false` for the first paint — the label should just be there, not
  // roll in from nowhere before the reader has scrolled.
  const setActive = (id: string, animate = true) => {
    if (id === activeId) return;
    activeId = id;
    list.querySelectorAll<HTMLElement>('[data-tocdemo-link]').forEach((row) => {
      const isActive = row.dataset.tocdemoLink === id;
      row.toggleAttribute('data-active', isActive);
      if (isActive) row.setAttribute('aria-current', 'location');
      else row.removeAttribute('aria-current');
    });
    const match = headings.find((h) => h.id === id);
    if (match) odometer.setText(match.textContent ?? '', animate);
  };

  // Thin band near the top of the pane: a section goes active as its heading
  // crosses reading position, rather than when the previous one scrolls away.
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      const topmost = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
      );
      setActive(topmost.target.id);
    },
    { root: scroller, rootMargin: '-15% 0px -72% 0px', threshold: 0 },
  );
  headings.forEach((h) => observer.observe(h));
  observers.push({ root, observer });

  setActive(headings[0].id, false);

  toggle.addEventListener('click', (e) => {
    // Otherwise the same click reaches the document handler below and reads as
    // an outside click, closing the pill the instant it opens.
    e.stopPropagation();
    setExpanded(pill, !pill.hasAttribute('data-expanded'));
  });

  list.querySelectorAll<HTMLElement>('[data-tocdemo-link]').forEach((row) => {
    row.addEventListener('click', () => {
      const target = headings.find((h) => h.id === row.dataset.tocdemoLink);
      // scrollTo on the pane, not scrollIntoView — the latter would also scroll
      // the article the demo is sitting in.
      if (target) scroller.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
      setExpanded(pill, false);
    });
  });
}

function wireDocumentOnce(): void {
  if (documentWired) return;
  documentWired = true;

  // Both handlers re-query the DOM on each event instead of holding instance
  // state, so they keep working across view-transition navigations.
  const closeAll = (except?: Element | null) => {
    document.querySelectorAll<HTMLElement>('[data-tocdemo-pill][data-expanded]').forEach((pill) => {
      if (except && pill.contains(except)) return;
      setExpanded(pill, false);
    });
  };

  document.addEventListener('click', (e) => {
    closeAll(e.target instanceof Node ? (e.target as Element) : null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}
