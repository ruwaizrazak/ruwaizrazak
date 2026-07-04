/**
 * TOC pill orchestrator — the single runtime entry point wired from
 * NoteMain.astro via `initOnLoad(initTOC)`.
 *
 * Owns: locating the pill + article, building the heading list, scroll-spy
 * highlighting, the collapsed odometer label, and open/close.
 *
 * The open/close *animation* lives entirely in CSS (TocPill.astro): this module
 * only flips the `[data-expanded]` attribute, and CSS transitions the width,
 * border-radius, panel height, and chevron off it. That's the core
 * simplification over the old GSAP timeline — there's no JS animation to
 * interrupt, clean up, or strand mid-morph.
 *
 * Idempotency: initOnLoad fires this on both DOMContentLoaded and
 * astro:page-load, so it runs twice on first load and again on every
 * view-transition. Per-page state (list, observers, odometer) is rebuilt each
 * call; the toggle listener is bound once per pill element (dataset guard) and
 * the window/document listeners once ever (the `wired` flag).
 */

import { createOdometer, type Odometer } from './odometer';

// Button className for every generated row — allocated once at module load
// rather than per-heading on each rebuild. Pure visual config.
const TOC_BTN_CLASS = [
  'flex items-center gap-2.5 w-full text-left',
  'px-3 py-2 rounded-lg',
  'text-base font-sans leading-snug',
  // Pill inverts from page theme — list colors invert with it.
  'text-white/50 hover:text-white hover:bg-white/5',
  'dark:text-black/50 dark:hover:text-black dark:hover:bg-black/5',
  'motion-safe:active:scale-95 motion-safe:transform-gpu',
  'touch-manipulation transition-all duration-150',
  'cursor-pointer',
].join(' ');

// --- Module state ----------------------------------------------------------
// Kept at module scope so the once-wired global listeners always read the
// latest instances across view-transition navigations (each initTOC call
// rebinds these; the listeners read them via the live binding).
let wired = false;
let pillEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let odometer: Odometer | null = null;
let scrollObserver: IntersectionObserver | null = null;
let visibilityObserver: IntersectionObserver | null = null;
let currentHeadings: Element[] = [];
let activeId: string | null = null;
// Latest scroll direction (written by the scroll listener, read by the
// odometer so its roll mirrors the reader's most recent scroll).
let scrollDirection: 1 | -1 = 1;
let lastScrollY = 0;

// --- Open/close: CSS owns the animation; JS only toggles the attribute. -----

function isOpen(): boolean {
  return !!pillEl?.hasAttribute('data-expanded');
}

function setExpanded(open: boolean): void {
  if (!pillEl || !panelEl) return;
  pillEl.toggleAttribute('data-expanded', open);
  panelEl.setAttribute('aria-hidden', String(!open));
  pillEl.querySelector('[data-toc-toggle]')?.setAttribute('aria-expanded', String(open));
}

// --- Public entry point ----------------------------------------------------

export function initTOC(): void {
  const article = document.querySelector('.note-layout article');
  if (!article) return;

  const pill = document.querySelector('[data-toc-pill]') as HTMLElement | null;
  if (!pill) return;

  // Escape any transformed-ancestor stacking context — a position:fixed element
  // nested in a `transform`ed ancestor positions relative to that ancestor, not
  // the viewport. Moving it to <body> avoids the bug.
  if (pill.parentNode !== document.body) document.body.appendChild(pill);

  const toggleEl = pill.querySelector('[data-toc-toggle]') as HTMLButtonElement | null;
  const panel = pill.querySelector('[data-toc-panel]') as HTMLElement | null;
  const list = pill.querySelector('[data-toc-list]') as HTMLElement | null;
  const labelEl = pill.querySelector('[data-toc-current]') as HTMLElement | null;
  if (!toggleEl || !panel || !list || !labelEl) return;

  pillEl = pill;
  panelEl = panel;
  listEl = list;

  // Scan headings from the rendered DOM (works for .md/.mdx and plain HTML);
  // auto-generate ids for any the author didn't slug.
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
    scrollObserver?.disconnect();
    scrollObserver = null;
    visibilityObserver?.disconnect();
    visibilityObserver = null;
    return;
  }
  pill.hidden = false;

  buildList(list, currentHeadings);
  odometer = createOdometer(labelEl, () => scrollDirection);

  // Rebuild scroll-spy — the article DOM is fresh after a view transition.
  scrollObserver?.disconnect();
  scrollObserver = createScrollSpy(currentHeadings, handleActiveChange);

  // Fade the pill out once the reader reaches the related-notes section (the
  // TOC is irrelevant past the note body). Rebuilt per call because the section
  // node is fresh after a view transition; notes without related content have
  // no section → observer stays null → pill always visible on the page.
  visibilityObserver?.disconnect();
  visibilityObserver = null;
  const relatedSection = document.querySelector('.related-notes-section');
  if (relatedSection) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        const reached = entry.boundingClientRect.top < window.innerHeight;
        pill.toggleAttribute('data-toc-offscreen', reached);
        if (reached && isOpen()) setExpanded(false);
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(relatedSection);
  }

  // Reset to collapsed + set the initial label instantly (no roll on first paint).
  activeId = null;
  setExpanded(false);
  odometer.setText(currentHeadings[0].textContent ?? 'On this page', false);

  // Toggle listener — the pill has no transition:persist, so its <button> is a
  // FRESH element on every view-transition navigation. Bind per element (dataset
  // guard) so it survives navigation without double-binding on the first-load
  // DOMContentLoaded + astro:page-load double-fire.
  if (toggleEl.dataset.tocToggleBound !== '1') {
    toggleEl.dataset.tocToggleBound = '1';
    toggleEl.addEventListener('click', (e) => {
      // Stop the click bubbling to the document outside-click handler below —
      // otherwise opening immediately reads as an "outside" click and closes.
      e.stopPropagation();
      setExpanded(!isOpen());
    });
  }

  // Global listeners once ever — window/document survive view-transition
  // navigations, and they read the live module bindings above.
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

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (e.target instanceof Node && pillEl?.contains(e.target)) return;
    setExpanded(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setExpanded(false);
  });
}

// --- List rendering --------------------------------------------------------

function buildList(container: HTMLElement, headings: Element[]): void {
  // Replacing innerHTML garbage-collects the old buttons (and their listeners).
  container.innerHTML = '';

  headings.forEach((heading) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.tocLink = heading.id;
    btn.className = TOC_BTN_CLASS;

    // Timeline slot — outlined ring; the active row's slot gets the pulsating
    // dot via a CSS pseudo-element on [data-active].
    const slot = document.createElement('span');
    slot.className = 'toc-slot';
    slot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'toc-text truncate flex-1 min-w-0';
    text.textContent = heading.textContent ?? '';

    btn.append(slot, text);
    btn.addEventListener('click', () => {
      document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
      setExpanded(false);
    });

    li.appendChild(btn);
    container.appendChild(li);
  });
}

// --- Scroll-spy ------------------------------------------------------------

function createScrollSpy(
  headings: Element[],
  onActive: (id: string) => void,
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      // Topmost heading in the trigger band = the section the reader is in.
      const top = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
      );
      onActive(top.target.id);
    },
    // LEARN: a thin band ~25–35% down the viewport (not the top 40%). A heading
    // goes active as it crosses this ~30% line — near reading position — instead
    // of waiting for the previous heading to scroll off the top, which was the
    // source of the perceived highlight lag. When no heading is in the band the
    // callback finds none intersecting and keeps the last active section.
    { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
  );
  headings.forEach((h) => observer.observe(h));
  return observer;
}

function handleActiveChange(id: string): void {
  if (id === activeId) return;
  activeId = id;
  if (!listEl) return;

  listEl.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((el) => {
    const active = el.dataset.tocLink === id;
    el.toggleAttribute('data-active', active);
    if (active) el.setAttribute('aria-current', 'location');
    else el.removeAttribute('aria-current');
  });

  const match = currentHeadings.find((h) => h.id === id);
  if (match) odometer?.setText(match.textContent ?? '', true);
}
