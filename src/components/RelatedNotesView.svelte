<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from './ContentCard.svelte';
  import SeriesPostCard from './SeriesPostCard.svelte';
  import { intersect } from '../lib/actions/intersect';
  import type { OptimizedImg } from '../utils/optimizeImage';

  /**
   * LEARN: replaces scripts/related-notes.ts. That module needed a
   * `grid.hasAttribute('data-related-inited')` guard because initOnLoad fired it
   * twice and Refresh would otherwise jump two pages per click; it toggled a
   * `hidden` class by index, pre-set inline opacity on every card so they
   * wouldn't flash, and drove the cascade with the Web Animations API.
   *
   * Here the page index is state, visibility is derived from it, and the cascade
   * is a CSS animation re-triggered by {#key cascade}.
   */
  interface RelatedCard {
    note: any;
    image: OptimizedImg | null;
  }

  interface Props {
    cards: RelatedCard[];
    isSeries: boolean;
    seriesTitle?: string;
  }

  let { cards, isSeries, seriesTitle }: Props = $props();

  const PER_PAGE = 4;
  // Series lists show every subsequent part at once (no Refresh); notes page by 4.
  const perPage = $derived(isSeries ? cards.length : PER_PAGE);
  const pageCount = $derived(Math.max(1, Math.ceil(cards.length / perPage)));

  let page = $state(0);
  let revealed = $state(false);
  /**
   * LEARN: the pre-hide is gated on hydration on purpose. The old code set
   * `card.style.opacity = '0'` from JS, so with scripting off the cards simply
   * stayed visible. A plain `.related-card { opacity: 0 }` in CSS would hide them
   * for everyone, including anyone whose JS never runs — so the rule only applies
   * once this island is mounted and can be relied on to reveal them again.
   */
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  /**
   * LEARN: every card stays in the DOM — off-page ones are display:none, so the
   * grid only lays out the current page. The e2e suite depends on that: it counts
   * `.related-card` to work out how many pages there are, then clicks Refresh
   * that many times to check the wrap-around.
   */
  const isOnPage = (i: number) => Math.floor(i / perPage) === page;

  /**
   * LEARN: changing this key remounts the cards, which restarts their CSS
   * entrance animation — once when the grid first scrolls into view, and again
   * on each Refresh. A CSS animation cannot be replayed by toggling a class
   * alone, and `display:none` -> visible never fires a transition, which is why
   * the original reached for WAAPI.
   */
  const cascade = $derived(`${revealed}-${page}`);

  /**
   * LEARN: flags the destination page to use the slide-in transition. The old
   * code registered a CAPTURE-phase listener on `document` at module scope, with
   * a comment explaining it had to live there so view-transition navigations
   * wouldn't stack duplicates. Scoped to this component, that problem disappears:
   * one delegated handler on the section, removed with the island.
   * The flag is read by the is:inline script in layouts/notesPost.astro.
   */
  function flagSlideTransition(event: MouseEvent) {
    if ((event.target as Element | null)?.closest('a')) {
      sessionStorage.setItem('nav-from-related', '1');
    }
  }

  function nextPage() {
    page = (page + 1) % pageCount; // cycle in order, wrap to start
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<section class="related-notes-section px-5 md:px-20" onclick={flagSlideTransition}>
  <div class="mt-20 mb-10">
    <h2 class="text-syoro font-sans text-3xl mb-8">
      {isSeries ? `More in ${seriesTitle}` : 'Related to'}
    </h2>
    <div
      class={[
        'related-grid grid',
        // Series: SeriesPostCards stretch to equal row height (matches SeriesCard).
        // Tag branch: garden-style dense grid; items-start keeps heights natural.
        isSeries
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-6 items-start',
      ]}
      data-series={isSeries ? '' : undefined}
      use:intersect={{ once: true, threshold: 0.15, onChange: (e) => { if (e.isIntersecting) revealed = true; } }}
    >
      {#key cascade}
        {#each cards as { note, image }, i (note.id)}
          {@const onPage = isOnPage(i)}
          <div
            class={['related-card', { hidden: !onPage }]}
            class:cascade-pending={mounted && !revealed}
            class:cascade-in={revealed && onPage}
            style={`animation-delay: ${(i % perPage) * 40}ms`}
          >
            {#if note.collection === 'seriesPosts'}
              <!-- Series parts get the dedicated "Part N" card, matching the series page. -->
              <SeriesPostCard post={note} />
            {:else}
              <ContentCard
                title={note.data.title}
                description={note.data.description}
                pubDate={note.data.pubDate}
                url={`/${note.collection}/${note.id}/`}
                {image}
                maturity={note.data.maturity}
                collection={note.collection}
                variant={note.collection === 'essays' ? 'card' : 'compact'}
                transitionName={`card-${note.collection}-${note.id}`}
              />
            {/if}
          </div>
        {/each}
      {/key}
    </div>
    {#if !isSeries && cards.length > PER_PAGE}
      <button
        type="button"
        class="related-refresh mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-konpeki text-white font-sans text-sm hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-[180ms] ease-snappy"
        onclick={nextPage}
      >
        Refresh
      </button>
    {/if}
  </div>
</section>

<style>
  /* LEARN: matches the garden/listing card reveal — 40ms stagger, 300ms,
     translateY(8px), on the site's --ease-snappy token. Reading the token
     directly is something the old WAAPI version could not do: the Web Animations
     API can't resolve CSS custom properties, so it hard-coded the bezier and
     carried a comment asking future readers to keep the two in sync. */
  .related-card.cascade-pending {
    opacity: 0;
  }
  .related-card.cascade-in {
    animation: related-card-in 300ms var(--ease-snappy) both;
  }
  @keyframes related-card-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Reduced motion: show the page immediately, no cascade. */
  @media (prefers-reduced-motion: reduce) {
    .related-card.cascade-pending {
      opacity: 1;
    }
    .related-card.cascade-in {
      animation: none;
    }
  }
</style>
