/**
 * TOC pill — public entry point.
 *
 * Composes four factories (morph, odometer, scroll-spy, list) into a single
 * `initTOC()` function that NoteMain.astro wires through `initOnLoad`.
 *
 * Responsibilities owned by *this* file (not delegated to a factory):
 *  - Locating the pill + article in the DOM (selectors are coupled to the
 *    component markup, so they belong here, not in a factory).
 *  - Reparenting the pill to <body> to escape the page wrapper's transform
 *    stacking context.
 *  - Auto-generating IDs for headings the author didn't slug.
 *  - Owning the cross-cutting state: latest scroll direction (read by the
 *    odometer), current active heading id (deduplicates spy callbacks).
 *  - Wiring global window/document listeners exactly once. The listeners
 *    reference the controller bindings, which are rebound on each
 *    initTOC call, so they always read the latest instances.
 *
 * Idempotency:
 *  initOnLoad fires this on both DOMContentLoaded and astro:page-load, so
 *  initTOC runs twice on first page load and again on every view-transition.
 *  Per-page state (controllers + heading list) is rebuilt every call;
 *  global listeners wire once via the `wired` flag.
 */

import { createMorphController, type MorphController } from './morph';
import { createOdometer, type Odometer } from './odometer';
import { createScrollSpy, type ScrollSpy } from './scroll-spy';
import { buildList } from './list';

// --- Module-scoped state ---------------------------------------------------
// LEARN: controllers are kept at module scope (not inside initTOC) so the
// click-toggle and outside-click handlers — wired once — can read the
// *latest* controller instance across view transitions without re-attaching
// listeners. Each initTOC call rebinds these `let`s; the listeners read
// them via the live binding, not a captured value.

let wired = false;
let morphCtrl: MorphController | null = null;
let odometer: Odometer | null = null;
let scrollSpy: ScrollSpy | null = null;

// Cross-cutting state: shared between the scroll listener (writer) and the
// odometer (reader, via a getter passed into createOdometer).
let scrollDirection: 1 | -1 = 1;
let lastScrollY = 0;

// Active heading id is owned here (not inside scroll-spy) so we can
// deduplicate identical callbacks before paying the DOM-mutation cost
// of toggling [data-active] on every row.
let activeId: string | null = null;
let currentHeadings: Element[] = [];
let listEl: HTMLElement | null = null;
let pillEl: HTMLElement | null = null;

// --- Public entry point ----------------------------------------------------

export function initTOC() {
  const article = document.querySelector('.note-layout article');
  if (!article) return;

  const pill = document.querySelector('[data-toc-pill]') as HTMLElement | null;
  if (!pill) return;

  // LEARN: reparent the pill to <body> so it escapes any GSAP transform
  // stacking context set by the hero / page wrapper. A `position: fixed`
  // element nested inside a `transform`-ed ancestor positions relative to
  // that ancestor, not the viewport — moving it to <body> avoids the bug.
  if (pill.parentNode !== document.body) document.body.appendChild(pill);

  const toggleEl = pill.querySelector('[data-toc-toggle]') as HTMLButtonElement | null;
  const panelEl = pill.querySelector('[data-toc-panel]') as HTMLElement | null;
  const list = pill.querySelector('[data-toc-list]') as HTMLElement | null;
  const labelEl = pill.querySelector('[data-toc-current]') as HTMLElement | null;
  const chevronEl = pill.querySelector('[data-toc-chevron]') as SVGElement | null;
  if (!toggleEl || !panelEl || !list || !labelEl || !chevronEl) return;

  // Narrow these to non-null so the factories below can take strict types.
  pillEl = pill;
  listEl = list;

  // LEARN: scan headings from the rendered DOM rather than MDX frontmatter
  // so this works for both .md/.mdx and plain HTML content without schema
  // changes. Auto-generate IDs for any heading the author didn't slug.
  const rawHeadings = Array.from(article.querySelectorAll('h1, h2, h3'));
  rawHeadings.forEach((h) => {
    if (!h.id) {
      h.id = (h.textContent ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
    }
  });
  currentHeadings = rawHeadings.filter((h) => h.id);

  if (currentHeadings.length === 0) {
    pill.hidden = true;
    scrollSpy?.disconnect();
    scrollSpy = null;
    return;
  }
  pill.hidden = false;

  // --- Rebuild controllers (fresh per initTOC call) ------------------------

  morphCtrl = createMorphController({ pillEl: pill, panelEl, chevronEl, toggleEl });
  odometer = createOdometer(labelEl, () => scrollDirection);

  // LEARN: tear down + rebuild scroll-spy because the article DOM is fresh
  // after a view-transition — old observed nodes are gone.
  scrollSpy?.disconnect();
  scrollSpy = createScrollSpy(currentHeadings, handleActiveChange);

  buildList(list, currentHeadings, (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    morphCtrl?.close();
  });

  // Reset label + collapsed state instantly (no animation on first paint).
  activeId = null;
  odometer.setText(currentHeadings[0].textContent ?? 'On this page', false);
  morphCtrl.reset();

  // --- Wire global listeners exactly once ---------------------------------
  // LEARN: initOnLoad fires on both DOMContentLoaded and astro:page-load —
  // without this gate, toggle() would run twice per click (opens then
  // immediately closes).
  if (wired) return;
  wired = true;

  lastScrollY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (y === lastScrollY) return;
      scrollDirection = y > lastScrollY ? 1 : -1;
      lastScrollY = y;
    },
    { passive: true },
  );

  toggleEl.addEventListener('click', (e) => {
    // LEARN: stop the click from bubbling to the document outside-click
    // handler — otherwise opening immediately registers as an "outside"
    // click on the next listener and closes the pill again.
    e.stopPropagation();
    morphCtrl?.toggle();
  });

  document.addEventListener('click', (e) => {
    if (!morphCtrl?.isOpen()) return;
    if (e.target instanceof Node && pillEl?.contains(e.target)) return;
    morphCtrl.close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && morphCtrl?.isOpen()) morphCtrl.close();
  });
}

// --- Active-state handler --------------------------------------------------

function handleActiveChange(id: string) {
  if (id === activeId) return;
  activeId = id;
  if (!listEl) return;

  // LEARN: one data-attribute toggle (+ aria-current) per row drives the
  // active visual. The CSS rules in TocPill.astro show the in-slot pulsating
  // dot only when [data-active] is set. No bg flash needed — the slot's
  // infinite keyframe is the "live" cue on its own.
  listEl.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((el) => {
    const isActive = el.dataset.tocLink === id;
    if (isActive) {
      el.setAttribute('data-active', '');
      el.setAttribute('aria-current', 'location');
    } else {
      el.removeAttribute('data-active');
      el.removeAttribute('aria-current');
    }
  });

  const match = currentHeadings.find((h) => h.id === id);
  if (match) odometer?.setText(match.textContent ?? '', true);
}
