<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from './ContentCard.svelte';
  import SeriesPostCard from './SeriesPostCard.svelte';
  import { intersect } from '../lib/actions/intersect';
  import type { OptimizedImg } from '../utils/optimizeImage';

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
  let mounted = $state(false);
  let revealed = $state(false);

  onMount(() => {
    mounted = true;
  });

  function flagSlideTransition(event: MouseEvent) {
    if ((event.target as Element | null)?.closest('a')) {
      sessionStorage.setItem('nav-from-related', '1');
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<section class="related-notes-section px-5 md:px-20" onclick={flagSlideTransition}>
  <div class="related-notes-panel card-panel">
    <h2 class="related-notes-heading">
      {isSeries ? `More in ${seriesTitle}` : 'Related to'}
    </h2>
    <div
      class="related-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-4"
      data-series={isSeries ? '' : undefined}
      use:intersect={{
        once: true,
        threshold: 0.15,
        onChange: (entry) => {
          if (entry.isIntersecting) revealed = true;
        },
      }}
    >
      {#each cards as { note, image }, index (note.id)}
        <div
          class:cascade-pending={mounted && !revealed}
          class:cascade-in={revealed}
          class="related-card h-full"
          style={`animation-delay: ${index * 40}ms`}
        >
          {#if note.collection === 'seriesPosts'}
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
              variant="card"
              transitionName={`card-${note.collection}-${note.id}`}
            />
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .related-notes-panel {
    margin-block: 5rem 2.5rem;
    border-radius: 26px;
    padding: 28px;
  }

  .related-notes-heading {
    margin-bottom: 20px;
    font-family: var(--font-sans);
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--color-syoro);
  }

  .related-card.cascade-pending { opacity: 0; }

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

  @media (max-width: 639px) {
    .related-notes-panel {
      padding: 18px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .related-card.cascade-pending { opacity: 1; }
    .related-card.cascade-in { animation: none; }
  }
</style>
