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
</script>

<section class="related-notes-section px-5 md:px-20">
  <div class="related-notes-panel card-panel mt-20 mb-10">
    <h2 class="mb-5 font-sans text-[26px] font-medium tracking-[0.02em] text-syoro">
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
  /* LEARN: what survives the justified-<style> bar.

     `.card-panel` is declared in global.css OUTSIDE any @layer (phase 1 only
     moved the bare ELEMENT rules), so its `border-radius: 18px` and
     `padding: 20px` beat any layered utility — these two overrides cannot be
     translated. The margin did move to utilities; nothing global sets it.

     The cascade is an @keyframes plus the two rules that reference it. Naming it
     from a Tailwind arbitrary (`animate-[related-card-in_…]`) would require
     `@keyframes -global-…`, because Svelte renames scoped keyframes — not worth
     leaking the name globally for one component. */
  .related-notes-panel {
    border-radius: 26px;
    padding: 28px;
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
