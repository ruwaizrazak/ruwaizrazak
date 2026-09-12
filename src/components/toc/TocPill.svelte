<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { easeSnappy } from '../../lib/easing';

  /**
   * Floating bottom-center TOC pill.
   *
   * LEARN: this island replaces scripts/toc/toc.ts (267 lines) and
   * scripts/toc/odometer.ts (87 lines). Three things fall out of the rewrite:
   *
   *  1. The rows are `{#each}`-rendered, so Svelte scopes their CSS. The old
   *     component needed a whole `<style is:global>` block purely because the
   *     rows were built with document.createElement and could never receive
   *     Astro's data-astro-cid-* scoping attribute. That block is gone.
   *  2. No idempotency guards. initOnLoad fired initTOC on both DOMContentLoaded
   *     and astro:page-load, so it needed a `wired` module flag for the
   *     window/document listeners and a `toggleEl.dataset.tocToggleBound` guard
   *     for the button. An island mounts once and cleans up on unmount.
   *  3. No document.body.appendChild(). The pill used to reparent itself to
   *     escape `.note-main-wrapper`'s scroll-driven transform (a transformed
   *     ancestor breaks position:fixed). It is now rendered outside that wrapper
   *     by the layout instead, which is a fix rather than a workaround.
   *
   * The open/close morph stays pure CSS, keyed off [data-expanded].
   */

  interface Heading {
    id: string;
    text: string;
  }

  let headings = $state<Heading[]>([]);
  let activeId = $state<string | null>(null);
  let expanded = $state(false);
  let offscreen = $state(false);
  /** Mirrors the reader's most recent scroll, so the label rolls the right way. */
  let scrollDirection = $state<1 | -1>(1);
  let reduceMotion = $state(false);

  let pillEl = $state<HTMLElement>();

  const hasHeadings = $derived(headings.length > 0);
  const activeIndex = $derived(headings.findIndex((h) => h.id === activeId));
  /** Collapsed label: the active heading, or the first one before any is active. */
  const currentLabel = $derived(
    headings.find((h) => h.id === activeId)?.text ?? headings[0]?.text ?? 'On this page',
  );

  /**
   * Odometer roll. The incoming label enters from the scroll direction and the
   * outgoing one exits the opposite way.
   *
   * LEARN: a local transition in a {#key} block does not play on first render,
   * only when the key changes — which is exactly the old `setText(text, false)`
   * "instant on first paint" special case, for free.
   */
  function roll(_node: Element, { dir }: { dir: number }) {
    return {
      duration: reduceMotion ? 0 : 350,
      easing: easeSnappy,
      css: (t: number, u: number) => `transform: translateY(${u * dir * 100}%); opacity: ${t};`,
    };
  }

  function toggle(event: MouseEvent) {
    // Stop the click reaching the document handler below, which would read the
    // opening click as an "outside" click and immediately close the pill.
    event.stopPropagation();
    expanded = !expanded;
  }

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    expanded = false;
  }

  onMount(() => {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const article = document.querySelector('.note-layout article');
    if (!article) return;

    // Scan headings from the rendered DOM (works for .md/.mdx and plain HTML);
    // auto-generate ids for any the author didn't slug.
    const found = Array.from(article.querySelectorAll('h1, h2, h3'));
    for (const h of found) {
      if (!h.id) {
        h.id = (h.textContent ?? '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');
      }
    }
    headings = found
      .filter((h) => h.id)
      .map((h) => ({ id: h.id, text: h.textContent ?? '' }));

    if (headings.length === 0) return;

    // --- scroll direction -------------------------------------------------
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y === lastScrollY) return;
      scrollDirection = y > lastScrollY ? 1 : -1;
      lastScrollY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // --- scroll-spy -------------------------------------------------------
    // LEARN: a thin band ~25–35% down the viewport (not the top 40%). A heading
    // goes active as it crosses this ~30% line — near reading position — instead
    // of waiting for the previous heading to scroll off the top, which was the
    // source of the perceived highlight lag. When no heading is in the band the
    // callback finds none intersecting and keeps the last active section.
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        activeId = top.target.id;
      },
      { rootMargin: '-25% 0px -65% 0px', threshold: 0 },
    );
    found.forEach((h) => spy.observe(h));

    // --- fade out past the related-notes section --------------------------
    // The TOC is irrelevant past the note body. Notes without related content
    // have no section, so the pill simply stays visible.
    let related: IntersectionObserver | undefined;
    const relatedSection = document.querySelector('.related-notes-section');
    if (relatedSection) {
      related = new IntersectionObserver(
        ([entry]) => {
          offscreen = entry.boundingClientRect.top < window.innerHeight;
          if (offscreen) expanded = false;
        },
        { threshold: 0 },
      );
      related.observe(relatedSection);
    }

    // --- outside click + Escape -------------------------------------------
    const onDocumentClick = (event: MouseEvent) => {
      if (!expanded) return;
      if (event.target instanceof Node && pillEl?.contains(event.target)) return;
      expanded = false;
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') expanded = false;
    };
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      spy.disconnect();
      related?.disconnect();
    };
  });
</script>

<!-- LEARN: the pill splits into TWO layers to dodge two iOS Safari WebKit bugs
     that both stem from putting `backdrop-filter` on this container:
       1. Hit-testing breaks on/inside a position:fixed element carrying
          backdrop-filter — the toggle button eats taps but never fires, so
          the pill reads as "not expandable" on iPhone.
       2. backdrop-filter + overflow-hidden + border-radius fails to clip the
          blur to the rounded corners, so the pill renders with square corners.
     Fix: the interactive container stays backdrop-filter-FREE (so taps reach
     the button and its own border-radius/overflow clip the panel normally),
     and a non-interactive [data-toc-bg] layer behind the content owns the
     blur + tint + shadow. Taps never touch a backdrop-filter surface. -->
<div
  bind:this={pillEl}
  data-toc-pill
  hidden={!hasHeadings}
  data-expanded={expanded ? '' : undefined}
  data-toc-offscreen={offscreen ? '' : undefined}
  class="group fixed bottom-6 inset-x-0 mx-auto z-50
         flex flex-col items-stretch
         text-white dark:text-black
         ring-1 ring-white/10 dark:ring-black/10
         overflow-hidden
         max-w-[calc(100vw-1.5rem)]
         shadow-[0_8px_32px_rgb(0_0_0_/_0.35),0_0_40px_rgb(255_255_255_/_0.05)]
         dark:shadow-[0_8px_32px_rgb(0_0_0_/_0.45),0_0_40px_rgb(0_0_0_/_0.08)]"
>
  <!-- LEARN: backdrop layer — absolutely positioned behind the content and
       pointer-events-none so it's off the tap path. `border-radius: inherit`
       tracks the container's animated radius (9999px ↔ 16px) with no JS.
       Only the blur + tint live here; the shadow stays on the container so the
       container's own overflow-hidden doesn't clip it (a parent clips a
       child's box-shadow, but never its own). -->
  <div
    data-toc-bg
    aria-hidden="true"
    class="absolute inset-0 -z-10 pointer-events-none
           bg-black/85 dark:bg-white/85 backdrop-blur-md"
  ></div>

  <!-- Expanded panel — CSS animates open/close via the grid-template-rows 0fr→1fr
       trick keyed off [data-expanded] (no JS). order-first stacks it above the
       toggle button in flex layout. -->
  <nav
    data-toc-panel
    id="toc-panel"
    aria-label="Table of contents"
    aria-hidden={!expanded}
    class="order-first"
  >
    <div class="relative overflow-hidden min-h-0">
      <!-- gradient line top -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 h-px z-10
               bg-gradient-to-r from-transparent via-white/25 dark:via-black/25 to-transparent"
      ></div>

      <!-- LEARN: no space-y, so adjacent rows' rail ::before pseudo-elements
           butt against each other into one continuous vertical line. Button
           py-2 still provides vertical rhythm between slot centers. -->
      <ul data-toc-list class="list-none p-0 m-0 h-56 overflow-y-auto scroll-smooth px-1.5 py-2">
        {#each headings as heading, i (heading.id)}
          <li class:is-passed={activeIndex > -1 && i < activeIndex} class:is-upcoming={activeIndex > -1 && i > activeIndex}>
            <button
              type="button"
              data-toc-link={heading.id}
              data-active={heading.id === activeId ? '' : undefined}
              aria-current={heading.id === activeId ? 'location' : undefined}
              onclick={() => goTo(heading.id)}
              class="flex items-center gap-2.5 w-full text-left
                     px-3 py-2 rounded-lg
                     text-base font-sans leading-snug
                     text-white/50 hover:text-white hover:bg-white/5
                     dark:text-black/50 dark:hover:text-black dark:hover:bg-black/5
                     motion-safe:active:scale-95 motion-safe:transform-gpu
                     touch-manipulation transition-all duration-150
                     cursor-pointer"
            >
              <!-- Timeline slot — outlined ring; the active row's slot gets the
                   pulsating dot via a CSS pseudo-element on [data-active]. -->
              <span class="toc-slot" aria-hidden="true"></span>
              <span class="toc-text truncate flex-1 min-w-0">{heading.text}</span>
            </button>
          </li>
        {/each}
      </ul>

      <!-- gradient line bottom -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 bottom-0 h-px z-10
               bg-gradient-to-r from-transparent via-white/25 dark:via-black/25 to-transparent"
      ></div>
    </div>
  </nav>

  <button
    type="button"
    data-toc-toggle
    aria-expanded={expanded}
    aria-controls="toc-panel"
    aria-label="Table of contents"
    onclick={toggle}
    class="flex items-center gap-2 px-4 py-2.5
           text-base font-sans text-white/90 hover:text-white dark:text-black/90 dark:hover:text-black
           focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 dark:focus-visible:ring-black/30 rounded-full
           motion-safe:active:scale-95 motion-safe:transform-gpu
           touch-manipulation transition-transform duration-150
           cursor-pointer"
  >
    <!-- LEARN: pulsating "current section" dot. Same keyframe drives the
         active-row in-slot dot so the indicator reads as one continuous signal
         across the morph. bg-current = theme-aware. `motion-safe:` gates the
         animation off in reduce-motion mode. -->
    <span
      class="toc-dot inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0
             shadow-[0_0_6px_0_currentColor]
             motion-safe:animate-[toc-dot-pulse_1.6s_ease-in-out_infinite]"
      aria-hidden="true"
    ></span>
    <!-- Middle slot — two layers in the same flex cell:
         (1) [data-toc-current]: odometer label, visible when collapsed.
         (2) [data-toc-static-label]: static "On this page", visible when expanded.
         Opacity crossfade via [data-expanded]. h-6 matches text-base line height. -->
    <span class="relative flex-1 min-w-0 h-6">
      <span data-toc-current class="absolute pl-5 inset-0 overflow-hidden text-left">
        {#key currentLabel}
          <span
            class="absolute inset-0 truncate"
            in:roll={{ dir: scrollDirection }}
            out:roll={{ dir: -scrollDirection }}>{currentLabel}</span
          >
        {/key}
      </span>
      <span data-toc-static-label class="absolute inset-0 flex items-center text-left">On this page</span>
    </span>
    <svg
      data-toc-chevron
      class="w-3.5 h-3.5 shrink-0 opacity-70"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
    </svg>
  </button>
</div>

<style>
  /*
   * LEARN: responsive width custom properties — CSS transitions the pill
   * directly between --toc-w-compact and --toc-w-expanded, so resizing across
   * breakpoints is picked up with no JS.
   *
   * --toc-fg-rgb is a foreground RGB triplet (no alpha) used by the active-row
   * pulse animation. Flipping it with .dark keeps the pulse on-theme.
   *
   * LEARN: margin-inline auto + inset-x-0 centers reliably in Safari. Avoid
   * left:50% + translateX(-50%) — WebKit can miscompute fixed positioning when
   * scale animations run on the same element.
   */
  [data-toc-pill] {
    --toc-w-compact: 14rem;
    --toc-w-expanded: 22rem;
    --toc-fg-rgb: 255 255 255;
    width: var(--toc-w-compact);
    /* LEARN: explicit finite radius instead of Tailwind `rounded-full`
       (= calc(infinity * 1px)), which iOS Safari can drop → 0 → square
       corners on first paint. CSS animates it to 16px on open. */
    border-radius: 9999px;
    /* LEARN: the open/close morph is pure CSS — width springs (slight overshoot
       so the Dynamic-Island feel survives), radius + opacity smooth. No JS
       touches this element, so an interrupted toggle can never strand it
       mid-morph. */
    transition:
      width 420ms cubic-bezier(0.34, 1.4, 0.64, 1),
      border-radius 360ms cubic-bezier(0.23, 1, 0.32, 1),
      opacity 250ms ease;
  }
  /* Pill hidden once the reader reaches the related-notes section. pointer-events
     off so the invisible pill never intercepts taps over related notes/footer. */
  [data-toc-pill][data-toc-offscreen] {
    opacity: 0;
    pointer-events: none;
  }

  /* --- CSS open/close morph (driven by the [data-expanded] attribute) ------ */
  [data-toc-pill][data-expanded] {
    width: var(--toc-w-expanded);
    border-radius: 16px;
  }

  /* LEARN: panel open/close via the grid-template-rows 0fr → 1fr trick — the
     panel is a grid whose single child collapses to zero height when the row is
     0fr. Animates to the content's natural height with no JS measuring. */
  [data-toc-panel] {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 380ms cubic-bezier(0.23, 1, 0.32, 1),
      opacity 260ms ease;
  }
  [data-toc-pill][data-expanded] [data-toc-panel] {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  /* Chevron flips when open. */
  [data-toc-chevron] {
    transition: transform 360ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  [data-toc-pill][data-expanded] [data-toc-chevron] {
    transform: rotate(180deg);
  }

  /* LEARN: scale "breathe" on open (squash-and-stretch lite). Animates the
     individual `scale` property — NOT `transform` — so centering via margin
     auto stays untouched during the morph. Gated to motion-safe. */
  @media (prefers-reduced-motion: no-preference) {
    [data-toc-pill][data-expanded] {
      animation: toc-breathe 420ms cubic-bezier(0.34, 1.4, 0.64, 1);
    }
  }
  @keyframes toc-breathe {
    0% { scale: 1; }
    40% { scale: 1.02; }
    100% { scale: 1; }
  }

  /* LEARN: backdrop layer inherits the container's animated radius, and the
     -webkit-mask forces iOS Safari to actually clip the backdrop-filter to
     those rounded corners. Harmless no-op where clipping already works. */
  [data-toc-bg] {
    border-radius: inherit;
    -webkit-mask-image: -webkit-radial-gradient(white, black);
  }
  :global(.dark) [data-toc-pill] {
    --toc-fg-rgb: 0 0 0;
  }
  @media (min-width: 1024px) {
    [data-toc-pill] {
      --toc-w-compact: 16rem;
      --toc-w-expanded: 26rem;
    }
  }
  @media (min-width: 1280px) {
    [data-toc-pill] {
      --toc-w-compact: 18rem;
      --toc-w-expanded: 30rem;
    }
  }

  /*
   * LEARN: middle-slot crossfade.
   *  Collapsed: pulsating dot + current-heading odometer visible, static label hidden.
   *  Expanded:  dot + odometer hidden, static "On this page" title visible.
   */
  [data-toc-pill] [data-toc-current],
  [data-toc-pill] [data-toc-static-label],
  [data-toc-pill] .toc-dot {
    transition: opacity 180ms ease-out;
  }
  [data-toc-pill] [data-toc-static-label] {
    opacity: 0;
    pointer-events: none;
  }
  [data-toc-pill][data-expanded] [data-toc-current] {
    opacity: 0;
    pointer-events: none;
  }
  [data-toc-pill][data-expanded] [data-toc-static-label] {
    opacity: 1;
    pointer-events: auto;
  }
  [data-toc-pill][data-expanded] .toc-dot {
    opacity: 0;
    animation: none;
  }

  /* ======================================================================
   * Row styles.
   *
   * LEARN: this whole block used to live in a `<style is:global>` because the
   * rows were created by document.createElement and therefore never got Astro's
   * scoping attribute. They are `{#each}`-rendered now, so Svelte scopes them
   * like any other element and the global escape hatch is gone.
   * ====================================================================== */

  /* LEARN: -global- keeps the keyframes name un-mangled. The collapsed dot
     references it through a Tailwind arbitrary utility
     (motion-safe:animate-[toc-dot-pulse_...]), which Svelte cannot rewrite —
     so the name has to stay literally `toc-dot-pulse`. */
  @keyframes -global-toc-dot-pulse {
    0%, 100% { opacity: 0.55; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1); }
  }

  .toc-slot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid currentColor;
    position: relative;
    flex-shrink: 0;
    opacity: 0.4;
    transition: opacity 200ms ease-out;
  }
  [data-toc-link]:hover .toc-slot {
    opacity: 0.7;
  }
  /* LEARN: persistent background tint on the current row, via --toc-fg-rgb so
     the hue is right on both light and dark pills. 0.08 sits a hair above the
     5% hover tint so the active state reads as "sticky", not "transient". */
  [data-toc-link][data-active] {
    background-color: rgb(var(--toc-fg-rgb) / 0.08);
  }
  [data-toc-link][data-active] .toc-slot {
    opacity: 1;
    /* Alpha-free border so the active ring reads at full theme color, not the
       inherited 50% alpha from the button's text-white/50 currentColor. */
    border-color: rgb(var(--toc-fg-rgb));
  }
  [data-toc-link][data-active] .toc-slot::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 50%;
    /* Theme-aware foreground triplet: currentColor here would inherit
       text-white/50 and render at ~50% even at the keyframe peak. */
    background: rgb(var(--toc-fg-rgb));
    box-shadow: 0 0 6px 1px rgb(var(--toc-fg-rgb) / 0.7);
    animation: toc-dot-pulse 1.6s ease-in-out infinite;
  }

  /*
   * LEARN: vertical timeline rail. Each row draws its own 1px line at the slot's
   * horizontal center; with no space-y on the ul these butt into one continuous
   * line. left = button px-3 (12px) + half the 10px slot - half the 1px line.
   *
   * LEARN: the old CSS derived "passed"/"upcoming" with :has() sibling selectors
   * (`li:has(~ li [data-toc-link][data-active])`). The active index is state
   * here, so the rows carry plain is-passed / is-upcoming classes instead —
   * same rendering, no :has() support question, and far easier to read.
   */
  [data-toc-link] {
    position: relative;
  }
  [data-toc-link]::before {
    content: '';
    position: absolute;
    left: calc(0.75rem + 5px - 0.5px);
    top: 0;
    bottom: 0;
    width: 1px;
    background: currentColor;
    opacity: 0.5;
    pointer-events: none;
  }
  /* Trim the rail so it starts/ends at the first/last slot's center. */
  [data-toc-list] li:first-child [data-toc-link]::before {
    top: 50%;
  }
  [data-toc-list] li:last-child [data-toc-link]::before {
    bottom: 50%;
  }

  /* Rows AFTER the active row → faint rail (the path not yet walked). */
  [data-toc-list] li.is-upcoming [data-toc-link]::before {
    opacity: 0.15;
  }

  /* Rows ABOVE the active row are headings already scrolled past — solid dot,
     no pulse, so the live cue stays unambiguous. */
  [data-toc-list] li.is-passed .toc-slot {
    opacity: 1;
  }
  [data-toc-list] li.is-passed .toc-slot::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: currentColor;
  }

  /* Upcoming rows → fainter ring so the progress hierarchy reads at a glance. */
  [data-toc-list] li.is-upcoming .toc-slot {
    opacity: 0.3;
  }

  /* Pseudo-elements can't be reached by Tailwind variants, so the in-slot
     active dot needs its own reduced-motion override. */
  @media (prefers-reduced-motion: reduce) {
    [data-toc-link][data-active] .toc-slot::after {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }
</style>
