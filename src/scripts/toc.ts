/**
 * Floating TOC pill — scroll-spy + click-to-toggle, with GSAP-driven motion.
 *
 * Responsibilities:
 *  - Scan the current article for h1/h2/h3 headings, populate the pill's list.
 *  - Track which heading is in view (IntersectionObserver) and update both the
 *    collapsed pill's label (odometer slide) and the active row in the list.
 *  - Drive the morph (height + border-radius + chevron rotation) on a single
 *    GSAP timeline so all three properties land on the same frame.
 *
 * Idempotency:
 *  initOnLoad fires on both DOMContentLoaded and astro:page-load, so this
 *  module's `initTOC()` runs twice on first page load and again on every
 *  view-transition navigation. Listeners are wired once via the `wired` flag;
 *  per-page state (heading list + IntersectionObserver) is rebuilt every call.
 */

import gsap from 'gsap';

// --- Module-scoped state ---------------------------------------------------
// LEARN: kept at module scope (not inside initTOC) so the click-toggle and
// outside-click handlers — wired once — can read the *latest* pill / headings
// references across view transitions without re-attaching listeners.

let wired = false;
let observer: IntersectionObserver | null = null;
let pillEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let toggleEl: HTMLButtonElement | null = null;
let labelEl: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let chevronEl: SVGElement | null = null;
let currentHeadings: Element[] = [];
let activeId: string | null = null;

// LEARN: scroll direction is captured at the moment the user scrolls, not
// when setActive() fires. IntersectionObserver fires async, so by the time
// the label updates the scroll event has already happened — we need the
// direction snapshot from *then* to know which way to mirror the odometer.
let lastScrollY = 0;
let scrollDirection: 1 | -1 = 1;

// LEARN: a11y — respect prefers-reduced-motion. We sample it once at module
// load (the user is unlikely to flip the OS setting mid-session) and skip
// every GSAP animation for users who opted out of motion.
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Morph timing ----------------------------------------------------------
// LEARN: matches iOS Dynamic Island character — slightly longer open so the
// spring overshoot has time to read, snappier close. ~420ms gives back.out
// room to feel "alive"; at 300ms a spring just reads as jitter.
const OPEN_DURATION = 0.42;
const CLOSE_DURATION = 0.28;
// LEARN: mixed eases on a single timeline. SPRING (back.out) for visual
// silhouette properties — width/radius/scale overshoot harmlessly. SMOOTH
// (power3.out) for height + opacity — overshooting `height: 'auto'` would
// briefly reveal empty space below the content. Close mirrors with power3.in
// because reverse-springs feel weird on dismissal.
const OPEN_EASE_SPRING = 'back.out(1.4)';
const OPEN_EASE_SMOOTH = 'power3.out';
const CLOSE_EASE = 'power3.in';

// LEARN: string form with explicit px units. GSAP's CSSPlugin can fail to
// interpolate the `borderRadius` shorthand from a unitless number, and
// Tailwind v4's `rounded-full` resolves to `calc(infinity * 1px)` which GSAP
// can't read back as a finite starting value — fromTo() forces both endpoints.
const ROUND_FULL = '9999px';
const ROUND_2XL = '16px';

// LEARN: bi-directional morph — DI's signature is both width and height
// growing together. State-driven (not content-driven) so scroll-spy label
// changes don't jitter the collapsed pill's width. Widths come from CSS
// custom properties on the pill (defined in TocPill.astro's <style> with
// @media overrides for lg and xl) — reading them at animation call time
// means resizing across breakpoints picks up new values on the next
// open/close, no resize listener required.
function readWidths(): { compact: string; expanded: string } {
  if (!pillEl) return { compact: '14rem', expanded: '22rem' };
  const cs = getComputedStyle(pillEl);
  return {
    compact: cs.getPropertyValue('--toc-w-compact').trim() || '14rem',
    expanded: cs.getPropertyValue('--toc-w-expanded').trim() || '22rem',
  };
}

// --- Open / close ----------------------------------------------------------

function expand() {
  if (!pillEl || !toggleEl || !panelEl || !chevronEl) return;
  pillEl.setAttribute('data-expanded', '');
  toggleEl.setAttribute('aria-expanded', 'true');
  panelEl.setAttribute('aria-hidden', 'false');

  // LEARN: kill any in-flight tweens before starting a new one so a rapid
  // toggle never strands properties at intermediate values.
  gsap.killTweensOf([panelEl, pillEl, chevronEl]);

  const { compact, expanded } = readWidths();

  if (reduceMotion) {
    // a11y path: jump to the expanded end state with no animation.
    panelEl.style.display = 'block';
    gsap.set(panelEl, { height: 'auto', opacity: 1, clearProps: 'height,willChange' });
    gsap.set(pillEl, { width: expanded, borderRadius: ROUND_2XL, scale: 1 });
    gsap.set(chevronEl, { rotate: 180 });
    return;
  }

  panelEl.style.display = 'block';
  // LEARN: GPU compositor hints — pill has backdrop-blur which is expensive
  // to repaint each frame; promote both animated elements while the tween
  // runs, then clear so the hint doesn't leak GPU memory after.
  panelEl.style.willChange = 'height';
  pillEl.style.willChange = 'width, border-radius, transform';

  gsap.timeline({
    defaults: { duration: OPEN_DURATION },
    onComplete: () => {
      // LEARN: GSAP leaves panel.height set to the measured natural height
      // (e.g. "382px"). Clearing it returns control to CSS so the panel
      // reflows naturally if the viewport or font size changes later.
      if (panelEl) {
        panelEl.style.height = '';
        panelEl.style.willChange = '';
      }
      if (pillEl) pillEl.style.willChange = '';
    },
  })
    // SMOOTH ease — height/opacity overshoot would briefly show empty space below content.
    .fromTo(
      panelEl,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, ease: OPEN_EASE_SMOOTH },
      0
    )
    // SPRING ease — width morph is the visual hook of the Dynamic Island feel.
    .fromTo(
      pillEl,
      { width: compact },
      { width: expanded, ease: OPEN_EASE_SPRING },
      0
    )
    // SMOOTH ease — radius overshoot would push the value past 16 into the
    // negative range (9983px delta × ~7% back.out overshoot ≈ -700px), which
    // browsers clamp to 0px → corners flash sharp for a frame near the end.
    // Use the monotonic ease so the radius lands cleanly.
    .fromTo(
      pillEl,
      { borderRadius: ROUND_FULL },
      { borderRadius: ROUND_2XL, ease: OPEN_EASE_SMOOTH },
      0
    )
    // LEARN: scale anticipation — pill "breathes" briefly (squash-and-stretch
    // lite). GSAP parses the existing transform so Tailwind's translate(-50%)
    // is preserved when scale is composed onto it.
    .fromTo(
      pillEl,
      { scale: 1 },
      { scale: 1.02, duration: OPEN_DURATION * 0.4, ease: 'power2.out' },
      0
    )
    .to(
      pillEl,
      { scale: 1, duration: OPEN_DURATION * 0.6, ease: OPEN_EASE_SPRING },
      OPEN_DURATION * 0.4
    )
    .to(chevronEl, { rotate: 180, ease: OPEN_EASE_SPRING }, 0);
}

function collapse(animate: boolean = true) {
  if (!pillEl || !toggleEl || !panelEl || !chevronEl) return;
  pillEl.removeAttribute('data-expanded');
  toggleEl.setAttribute('aria-expanded', 'false');
  panelEl.setAttribute('aria-hidden', 'true');

  gsap.killTweensOf([panelEl, pillEl, chevronEl]);

  const { compact } = readWidths();

  if (!animate || reduceMotion) {
    // Instant path — used at init, on view-transition, and for a11y.
    gsap.set(panelEl, { height: 0, opacity: 0, display: 'none', willChange: '' });
    gsap.set(pillEl, {
      width: compact,
      borderRadius: ROUND_FULL,
      scale: 1,
      willChange: '',
    });
    gsap.set(chevronEl, { rotate: 0 });
    return;
  }

  panelEl.style.willChange = 'height';
  pillEl.style.willChange = 'width, border-radius, transform';

  gsap.timeline({
    defaults: { duration: CLOSE_DURATION, ease: CLOSE_EASE },
    onComplete: () => {
      if (panelEl) {
        panelEl.style.display = 'none';
        panelEl.style.willChange = '';
      }
      if (pillEl) pillEl.style.willChange = '';
    },
  })
    .to(panelEl, { height: 0, opacity: 0 }, 0)
    .to(pillEl, { width: compact }, 0)
    .fromTo(pillEl, { borderRadius: ROUND_2XL }, { borderRadius: ROUND_FULL }, 0)
    .to(chevronEl, { rotate: 0 }, 0);
}

function toggle() {
  if (!pillEl) return;
  if (pillEl.hasAttribute('data-expanded')) collapse();
  else expand();
}

// --- List rendering --------------------------------------------------------

function buildTOCList(container: HTMLElement, headings: Element[]) {
  // LEARN: blowing away innerHTML implicitly removes the child buttons'
  // event listeners (no manual removeEventListener needed) since the nodes
  // themselves are garbage-collected.
  container.innerHTML = '';
  headings.forEach((heading) => {
    const id = heading.id;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = heading.textContent ?? '';
    btn.dataset.tocLink = id;
    btn.className = [
      'block w-full text-left truncate',
      'px-3 py-2 rounded-lg',
      'text-base font-sans leading-snug',
      // LEARN: pill inverts from page theme — list colors invert with it.
      // Light mode (dark pill) → white text. Dark mode (light pill) → black text.
      'text-white/50 hover:text-white hover:bg-white/5',
      'dark:text-black/50 dark:hover:text-black dark:hover:bg-black/5',
      // LEARN: matches the HeaderLink press pattern. `motion-safe:active:scale-95`
      // gives finger/click feedback (works on touch without hover). `transition-all`
      // (not just colors) so the scale also animates back on release.
      // `touch-manipulation` removes iOS Safari's 300ms tap delay so the press
      // feedback feels immediate on mobile.
      'motion-safe:active:scale-95 motion-safe:transform-gpu',
      'touch-manipulation transition-all duration-150',
      'cursor-pointer',
    ].join(' ');
    btn.addEventListener('click', () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      collapse();
    });
    li.appendChild(btn);
    container.appendChild(li);
  });
}

// --- Odometer label --------------------------------------------------------

function setLabelText(text: string, animate: boolean) {
  if (!labelEl) return;
  // LEARN: killing tweens cancels their `onComplete: () => remove()`, so any
  // stale outgoing spans from prior interrupted tweens never get removed.
  // We must reap them at the top of every call.
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
  // LEARN: the survivor may have been killed mid-entry (e.g. at yPercent: 60),
  // so snap it to the rest position before animating it out — otherwise its
  // exit tween starts from a weird offset.
  if (oldEl) gsap.set(oldEl, { yPercent: 0, opacity: 1 });

  const newEl = document.createElement('span');
  newEl.className = 'absolute inset-0 truncate';
  newEl.textContent = text;
  labelEl.appendChild(newEl);

  // Mirror document scroll: down → new enters from below (+100), old exits up (-100).
  const enterFrom = scrollDirection === 1 ? 100 : -100;
  const exitTo = scrollDirection === 1 ? -100 : 100;

  gsap.fromTo(
    newEl,
    { yPercent: enterFrom, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
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

// --- Active state ----------------------------------------------------------

function setActive(id: string) {
  if (id === activeId) return;
  const isFirstActivation = activeId === null;
  activeId = id;
  if (!listEl) return;

  // LEARN: one data-attribute toggle + one CSS rule beats four classList
  // toggles per item — fewer DOM mutations (matters on long heading lists
  // during fast scroll) and a single source of truth for the active style.
  // aria-current="location" gives screen readers a real "you are here" signal.
  let newActiveBtn: HTMLElement | null = null;
  listEl.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((el) => {
    const isActive = el.dataset.tocLink === id;
    if (isActive) {
      el.setAttribute('data-active', '');
      el.setAttribute('aria-current', 'location');
      newActiveBtn = el;
    } else {
      el.removeAttribute('data-active');
      el.removeAttribute('aria-current');
    }
  });

  // LEARN: secondary action — when the active row changes, briefly flash
  // its background from a brighter tint back to the resting active style.
  // clearProps lets the CSS [data-active] rule take over once the tween
  // ends, so the resting state stays in one place (the component's <style>).
  // Skipped on the very first activation (no "change" to celebrate) and
  // when the user has prefers-reduced-motion.
  if (newActiveBtn && !isFirstActivation && !reduceMotion) {
    // LEARN: brief background flash on the new active row, fading from a
    // brighter tint back to the resting [data-active] value. clearProps
    // hands styling back to the CSS rule once the tween ends, keeping the
    // resting state in a single source of truth (TocPill.astro's <style>).
    // --toc-fg-rgb flips with theme (255 255 255 light → 0 0 0 dark), so
    // the pulse stays on-theme with zero JS branching.
    gsap.fromTo(
      newActiveBtn,
      { backgroundColor: 'rgb(var(--toc-fg-rgb) / 0.22)' },
      {
        backgroundColor: 'rgb(var(--toc-fg-rgb) / 0.10)',
        duration: 0.4,
        ease: 'power2.out',
        clearProps: 'backgroundColor',
      }
    );
  }

  const match = currentHeadings.find((h) => h.id === id);
  if (match) setLabelText(match.textContent ?? '', true);
}

// --- Init ------------------------------------------------------------------

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

  pillEl = pill;
  toggleEl = pill.querySelector('[data-toc-toggle]') as HTMLButtonElement | null;
  panelEl = pill.querySelector('[data-toc-panel]') as HTMLElement | null;
  listEl = pill.querySelector('[data-toc-list]') as HTMLElement | null;
  labelEl = pill.querySelector('[data-toc-current]') as HTMLElement | null;
  chevronEl = pill.querySelector('[data-toc-chevron]') as SVGElement | null;
  if (!toggleEl || !panelEl || !listEl || !labelEl || !chevronEl) return;

  // LEARN: scan headings from the rendered DOM rather than MDX frontmatter so
  // this works for both .md/.mdx and plain HTML content without schema changes.
  // Auto-generate IDs for any heading the author didn't slug themselves.
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
    observer?.disconnect();
    observer = null;
    return;
  }
  pill.hidden = false;

  // Rebuild list + reset label instantly (no animation on first paint).
  buildTOCList(listEl, currentHeadings);
  activeId = null;
  setLabelText(currentHeadings[0].textContent ?? 'On this page', false);

  // Reset to closed without animation (initial render or post-view-transition).
  collapse(false);

  // LEARN: tear down + rebuild the IntersectionObserver each call because the
  // article DOM is fresh after a view-transition — old observed nodes are gone.
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      // Of the headings currently in the viewport top-band, pick the
      // topmost one — that's the section the reader is currently in.
      const top = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b
      );
      setActive(top.target.id);
    },
    // LEARN: -60% bottom margin shrinks the trigger zone to the top 40% of
    // the viewport, so a heading isn't "active" until it scrolls comfortably
    // into the upper portion of the page.
    { rootMargin: '0px 0px -60% 0px', threshold: 0 }
  );
  currentHeadings.forEach((h) => observer!.observe(h));

  // LEARN: wire global listeners exactly once. initOnLoad fires on both
  // DOMContentLoaded and astro:page-load — without this gate, toggle()
  // would run twice per click (opens then immediately closes).
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
    { passive: true }
  );

  toggleEl.addEventListener('click', (e) => {
    // LEARN: stop the click from bubbling to the document outside-click
    // handler — otherwise opening immediately registers as an "outside" click
    // on the next listener and closes the pill again.
    e.stopPropagation();
    toggle();
  });
  document.addEventListener('click', (e) => {
    if (!pillEl?.hasAttribute('data-expanded')) return;
    if (e.target instanceof Node && pillEl.contains(e.target)) return;
    collapse();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pillEl?.hasAttribute('data-expanded')) collapse();
  });
}
