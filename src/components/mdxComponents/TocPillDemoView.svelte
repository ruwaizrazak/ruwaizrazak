<script lang="ts">
  import { onMount } from 'svelte';
  import { easeSnappy } from '../../lib/easing';

  /**
   * A live, self-contained twin of toc/TocPill.svelte for use inside MDX.
   * It is a deliberate COPY, not an import: the real pill is a single-instance,
   * position:fixed, page-wide component bound to the article's real headings. A
   * demo needs the opposite — many instances, position:absolute inside its own
   * frame, and fake headings that must never leak into the real TOC or the page's
   * heading outline. Copying freezes the demo so edits to the real pill can't
   * silently break the post.
   *
   * Two things differ from the real component on purpose:
   *   1. Rows are rendered statically (the headings are known at build time).
   *   2. Fake headings are <div>s, not <h3>s — real headings would be picked up
   *      by TocPill and would break the page's heading hierarchy.
   *
   * LEARN: replaces scripts/toc/tocDemo.ts, which carried machinery this design
   * simply doesn't need: a module-level `observers[]` array that had to reap
   * entries whose root had left the DOM after a view transition, a
   * `root.dataset.tocdemoBound` per-instance guard against initOnLoad's
   * double-fire, and a `documentWired` flag for the shared close-on-outside
   * handlers. Each demo is its own island now, with its own lifecycle.
   */
  interface Props {
    /** Dummy section names shown in the fake article and the pill's list. */
    headings?: string[];
    caption?: string;
    variant?: 'default' | 'band' | 'expanded';
  }

  let {
    headings = [
      'Opening Notes',
      'The Problem',
      'A Small Detour',
      'What Changed',
      'Numbers, Roughly',
      'Where This Goes',
    ],
    caption = 'Scroll inside the frame — the label rolls and the rail fills as you pass each section. Tap the pill to open the list.',
    variant = 'default',
  }: Props = $props();

  const SPY_TOP = 15;
  const SPY_BOTTOM = 72;
  const slugify = (t: string) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  // LEARN: deterministic "random" skeleton bars — derived from the indices rather
  // than Math.random() so the built HTML is byte-stable between builds.
  const barCount = (s: number) => 3 + ((s * 5) % 3);
  const barWidth = (s: number, i: number) => 58 + ((s * 7 + i * 23) % 38);

  const rows = $derived(headings.map((text) => ({ id: `tocdemo-${slugify(text)}`, text })));

  let expanded = $state(variant === 'expanded');
  let activeId = $state('');
  let direction = $state<1 | -1>(1);
  let reduceMotion = $state(false);

  let scrollerEl = $state<HTMLDivElement>();
  let pillEl = $state<HTMLDivElement>();

  const activeIndex = $derived(rows.findIndex((r) => r.id === activeId));
  const currentLabel = $derived(rows.find((r) => r.id === activeId)?.text ?? rows[0]?.text ?? '');

  function roll(_node: Element, { dir }: { dir: number }) {
    return {
      duration: reduceMotion ? 0 : 350,
      easing: easeSnappy,
      css: (t: number, u: number) => `transform: translateY(${u * dir * 100}%); opacity: ${t};`,
    };
  }

  function goTo(id: string) {
    const target = scrollerEl?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    // LEARN: scrollTo on the pane, not scrollIntoView — the latter would drag the
    // article the demo is embedded in along with it.
    if (target && scrollerEl) scrollerEl.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
    expanded = false;
  }

  function onToggle(event: MouseEvent) {
    // Otherwise the same click reaches the document handler and reads as an
    // outside click, closing the pill the instant it opens.
    event.stopPropagation();
    expanded = !expanded;
  }

  onMount(() => {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroller = scrollerEl;
    if (!scroller) return;

    const headingEls = Array.from(
      scroller.querySelectorAll<HTMLElement>('[data-tocdemo-heading]'),
    );
    if (headingEls.length === 0) return;
    activeId = headingEls[0].id;

    // Direction of the reader's last scroll — the odometer rolls the new label in
    // from that side, so the motion matches the gesture.
    let lastTop = scroller.scrollTop;
    const onScroll = () => {
      const top = scroller.scrollTop;
      if (top === lastTop) return;
      direction = top > lastTop ? 1 : -1;
      lastTop = top;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });

    // Thin band near the top of the PANE: a section goes active as its heading
    // crosses reading position, rather than when the previous one scrolls away.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        activeId = topmost.target.id;
      },
      { root: scroller, rootMargin: `-${SPY_TOP}% 0px -${SPY_BOTTOM}% 0px`, threshold: 0 },
    );
    headingEls.forEach((h) => observer.observe(h));

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
      scroller.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKeydown);
      observer.disconnect();
    };
  });
</script>

<figure class="not-prose my-10 md:my-16">
  <div
    data-tocdemo
    data-tocdemo-variant={variant === 'default' ? undefined : variant}
    class="relative overflow-hidden rounded-2xl border border-syoro/10 dark:border-syoro/20 bg-backgroundcolor"
  >
    <!-- Fake article. `relative` makes it the offsetParent for the fake headings,
         so row clicks can scroll THIS pane (never the page) by offsetTop. -->
    <div
      bind:this={scrollerEl}
      data-tocdemo-scroller
      class="relative h-[22rem] overflow-y-auto scroll-smooth px-5 md:px-8 py-6"
    >
      {#each rows as row, s (row.id)}
        <div class="mb-8">
          <div
            data-tocdemo-heading
            id={row.id}
            class="font-sans text-base md:text-lg text-syoro mb-3 scroll-mt-6"
          >
            {row.text}
          </div>
          <div class="space-y-2.5" aria-hidden="true">
            {#each Array.from({ length: barCount(s) }) as _, i}
              <div class="h-2 rounded-full bg-syoro/10 dark:bg-syoro/15" style={`width: ${barWidth(s, i)}%`}></div>
            {/each}
          </div>
        </div>
      {/each}
      <!-- Tail space so the final section can still reach the scroll-spy band. -->
      <div class="h-52" aria-hidden="true"></div>
    </div>

    {#if variant === 'band'}
      <div
        data-tocdemo-band
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 z-[1] border-y border-dashed border-syoro/30 bg-syoro/5"
        style={`top: ${SPY_TOP}%; height: ${100 - SPY_TOP - SPY_BOTTOM}%`}
      >
        <span class="absolute right-2 top-1 font-sans text-[11px] uppercase tracking-meta text-syoro/50">active band</span>
      </div>
    {/if}

    <!-- Edge fades: signal "there's more above/below" without a scrollbar. -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-backgroundcolor to-transparent"></div>
    <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-backgroundcolor to-transparent"></div>

    <!-- The pill. Same two-layer structure as the real one (interactive container
         stays backdrop-filter-free; a non-interactive layer behind it owns the
         blur) — see TocPill.svelte for why iOS Safari needs that split. -->
    <div
      bind:this={pillEl}
      data-tocdemo-pill
      data-expanded={expanded ? '' : undefined}
      class="absolute bottom-4 inset-x-0 mx-auto z-10
             flex flex-col items-stretch
             text-white dark:text-black
             ring-1 ring-white/10 dark:ring-black/10
             overflow-hidden
             max-w-[calc(100%-2rem)]
             shadow-[0_8px_32px_rgb(0_0_0_/_0.35)]
             dark:shadow-[0_8px_32px_rgb(0_0_0_/_0.45)]"
    >
      <div
        aria-hidden="true"
        class="absolute inset-0 -z-10 pointer-events-none
               bg-black/85 dark:bg-white/85 backdrop-blur-md
               [border-radius:inherit] [-webkit-mask-image:-webkit-radial-gradient(white,black)]"
      ></div>

      <div data-tocdemo-panel aria-hidden={!expanded} class="order-first">
        <div class="relative overflow-hidden min-h-0">
          <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 top-0 h-px z-10 bg-gradient-to-r from-transparent via-white/25 dark:via-black/25 to-transparent"></div>

          <ul data-tocdemo-list class="list-none p-0 m-0 h-44 overflow-y-auto scroll-smooth px-1.5 py-2">
            {#each rows as row, i (row.id)}
              <li class:is-passed={activeIndex > -1 && i < activeIndex} class:is-upcoming={activeIndex > -1 && i > activeIndex}>
                <button
                  type="button"
                  data-tocdemo-link={row.id}
                  data-active={row.id === activeId ? '' : undefined}
                  aria-current={row.id === activeId ? 'location' : undefined}
                  onclick={() => goTo(row.id)}
                  class="flex items-center gap-2.5 w-full text-left
                         px-3 py-2 rounded-lg
                         text-base font-sans leading-snug
                         text-white/50 hover:text-white hover:bg-white/5
                         dark:text-black/50 dark:hover:text-black dark:hover:bg-black/5
                         motion-safe:active:scale-95 motion-safe:transform-gpu
                         touch-manipulation transition-all duration-150 cursor-pointer"
                >
                  <span class="tocdemo-slot" aria-hidden="true"></span>
                  <span class="truncate flex-1 min-w-0">{row.text}</span>
                </button>
              </li>
            {/each}
          </ul>

          <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-px z-10 bg-gradient-to-r from-transparent via-white/25 dark:via-black/25 to-transparent"></div>
        </div>
      </div>

      <button
        type="button"
        data-tocdemo-toggle
        aria-expanded={expanded}
        aria-label="Demo table of contents"
        onclick={onToggle}
        class="flex items-center gap-2 px-4 py-2.5
               text-base font-sans text-white/90 hover:text-white dark:text-black/90 dark:hover:text-black
               focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 dark:focus-visible:ring-black/30 rounded-full
               motion-safe:active:scale-95 motion-safe:transform-gpu
               touch-manipulation transition-transform duration-150 cursor-pointer"
      >
        <span class="tocdemo-dot inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0 shadow-[0_0_6px_0_currentColor]" aria-hidden="true"></span>
        <span class="relative flex-1 min-w-0 h-6">
          <span data-tocdemo-current class="absolute pl-5 inset-0 overflow-hidden text-left">
            {#key currentLabel}
              <span class="absolute inset-0 truncate" in:roll={{ dir: direction }} out:roll={{ dir: -direction }}>{currentLabel}</span>
            {/key}
          </span>
          <span data-tocdemo-static-label class="absolute inset-0 flex items-center text-left">On this page</span>
        </span>
        <svg
          data-tocdemo-chevron
          class="w-3.5 h-3.5 shrink-0 opacity-70"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  </div>

  {#if caption}
    <figcaption class="font-serif text-xs md:text-sm text-syoro/60 dark:text-syoro/50 mt-3">
      {caption}
    </figcaption>
  {/if}
</figure>

<style>
  /* LEARN: everything below mirrors TocPill.astro's morph, retuned for a pill
     that lives inside a frame instead of the viewport. Kept as plain CSS (not
     Tailwind arbitrary utilities) so the animation name and its @keyframes are
     compiled together in this one scoped block. */
  [data-tocdemo-pill] {
    --tocdemo-w-compact: 13rem;
    --tocdemo-w-expanded: 19rem;
    --tocdemo-fg-rgb: 255 255 255;
    width: var(--tocdemo-w-compact);
    /* Explicit finite radius — iOS Safari can drop rounded-full's
       calc(infinity * 1px) to 0 on first paint. */
    border-radius: 9999px;
    transition:
      width 420ms cubic-bezier(0.34, 1.4, 0.64, 1),
      border-radius 360ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  :where(.dark) [data-tocdemo-pill] {
    --tocdemo-fg-rgb: 0 0 0;
  }
  @media (min-width: 768px) {
    [data-tocdemo-pill] {
      --tocdemo-w-compact: 15rem;
      --tocdemo-w-expanded: 23rem;
    }
  }

  [data-tocdemo-pill][data-expanded] {
    width: var(--tocdemo-w-expanded);
    border-radius: 16px;
  }

  /* grid-template-rows 0fr → 1fr: collapses to zero height and animates back to
     the content's natural height with no JS measuring. */
  [data-tocdemo-panel] {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 380ms cubic-bezier(0.23, 1, 0.32, 1),
      opacity 260ms ease;
  }
  [data-tocdemo-pill][data-expanded] [data-tocdemo-panel] {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  [data-tocdemo-chevron] {
    transition: transform 360ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  [data-tocdemo-pill][data-expanded] [data-tocdemo-chevron] {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: no-preference) {
    [data-tocdemo-pill][data-expanded] {
      animation: tocdemo-breathe 420ms cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    .tocdemo-dot {
      animation: tocdemo-dot-pulse 1.6s ease-in-out infinite;
    }
  }
  @keyframes tocdemo-breathe {
    0%   { scale: 1; }
    40%  { scale: 1.02; }
    100% { scale: 1; }
  }
  @keyframes tocdemo-dot-pulse {
    0%, 100% { opacity: 0.55; transform: scale(0.85); }
    50%      { opacity: 1;    transform: scale(1); }
  }

  /* --- timeline slots + rail ---------------------------------------------- */
  /* LEARN: the passed/upcoming rules used :has() sibling selectors to re-derive
     the active row's position structurally. The active index is state now, so the
     rows carry plain is-passed / is-upcoming classes — same rendering, simpler
     CSS, and no :has() support question. */
  .tocdemo-slot {
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
  [data-tocdemo-link]:hover .tocdemo-slot { opacity: 0.7; }

  [data-tocdemo-link][data-active] {
    background-color: rgb(var(--tocdemo-fg-rgb) / 0.08);
  }
  [data-tocdemo-link][data-active] .tocdemo-slot {
    opacity: 1;
    border-color: rgb(var(--tocdemo-fg-rgb));
  }
  [data-tocdemo-link][data-active] .tocdemo-slot::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 50%;
    /* Alpha-free triplet, not currentColor — the row's text is 50% opaque and
       the dot would pulse invisibly against the translucent pill. */
    background: rgb(var(--tocdemo-fg-rgb));
    box-shadow: 0 0 6px 1px rgb(var(--tocdemo-fg-rgb) / 0.7);
    animation: tocdemo-dot-pulse 1.6s ease-in-out infinite;
  }

  /* Each row draws its own 1px line at the slot's centre; with no space-y on the
     ul they butt into one continuous rail. */
  [data-tocdemo-link] { position: relative; }
  [data-tocdemo-link]::before {
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
  [data-tocdemo-list] li:first-child [data-tocdemo-link]::before { top: 50%; }
  [data-tocdemo-list] li:last-child  [data-tocdemo-link]::before { bottom: 50%; }

  /* Rows after the active one → faint rail + fainter ring (the path not yet walked). */
  [data-tocdemo-list] li.is-upcoming [data-tocdemo-link]::before {
    opacity: 0.15;
  }
  [data-tocdemo-list] li.is-upcoming .tocdemo-slot {
    opacity: 0.3;
  }
  /* Rows above the active one → solid (unpulsing) dot: already read. */
  [data-tocdemo-list] li.is-passed .tocdemo-slot {
    opacity: 1;
  }
  [data-tocdemo-list] li.is-passed .tocdemo-slot::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-tocdemo-link][data-active] .tocdemo-slot::after {
      animation: none;
      opacity: 1;
      transform: none;
    }
  }

  /* Middle-slot crossfade: collapsed shows the odometer, expanded shows the title. */
  [data-tocdemo-pill] [data-tocdemo-current],
  [data-tocdemo-pill] [data-tocdemo-static-label],
  [data-tocdemo-pill] .tocdemo-dot {
    transition: opacity 180ms ease-out;
  }
  [data-tocdemo-pill] [data-tocdemo-static-label] {
    opacity: 0;
    pointer-events: none;
  }
  [data-tocdemo-pill][data-expanded] [data-tocdemo-current] {
    opacity: 0;
    pointer-events: none;
  }
  [data-tocdemo-pill][data-expanded] [data-tocdemo-static-label] {
    opacity: 1;
  }
  [data-tocdemo-pill][data-expanded] .tocdemo-dot {
    opacity: 0;
    animation: none;
  }
</style>
