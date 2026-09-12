<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from '../ContentCard.svelte';
  import type { OptimizedImg } from '../../utils/optimizeImage';
  import { urlForEntry } from '../../utils/urls';

  /**
   * LEARN: this component also absorbs the only thing
   * scripts/listing/listingFilters.ts still did on the live site.
   *
   * That module was written for a tag/collection filter UI that no longer
   * exists — `.collection-filter`, `#tagDropdown`, `#showMoreTags` and
   * `#additionalTags` appear nowhere in src/, and the tag-chip branch needed
   * `a[data-tag]`, which came from the GardenStickyBar that was deleted earlier
   * in this migration. Its one live effect was the final unconditional
   * filterPosts() call, which acted as this grid's entrance cascade: 40ms
   * stagger, 300ms, translateY(8px). That is the CSS below. The module had NO
   * idempotency guard either, so initOnLoad's double-fire re-ran the whole
   * cascade on first load.
   */
  interface GardenCard {
    post: any;
    image: OptimizedImg | null;
  }

  interface Props {
    cards: GardenCard[];
    /** Wide cards span the full row (used by /series, where every card is wide). */
    wideFullRow?: boolean;
  }

  let { cards, wideFullRow = false }: Props = $props();

  const cardVariantCollections = new Set(['essays', 'playground']);
  // LEARN: essays + series use the wide layout — full width up to lg, then 75%
  // (3 of 4 columns) from xl up so they don't dominate big screens.
  const wideCollections = new Set(['essays', 'series']);

  // Same hydration gate as RelatedNotes: with scripting off the cards must stay
  // visible, so the pre-hide only applies once this island can reveal them again.
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
    // Next frame, so the browser paints the hidden state before the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });
  let revealed = $state(false);

  function variantFor(collection: string) {
    if (collection === 'series') return 'series' as const;
    if (collection === 'essays') return 'wide' as const;
    return cardVariantCollections.has(collection) ? ('card' as const) : ('compact' as const);
  }

  function spanFor(collection: string) {
    if (!wideCollections.has(collection)) return '';
    return wideFullRow ? ' col-span-full' : ' md:col-span-2 lg:col-span-3 xl:col-span-3';
  }
</script>

<section class="garden-cards-section pb-40">
  <!-- LEARN: grid-flow-row-dense lets a normal card backfill the leftover column
       beside a 75%-wide card (at xl+), so wide cards stay nestled among the
       others instead of leaving a gap. -->
  <div class="card-masonry grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-6">
    {#each cards as { post, image }, i (post.id)}
      <div
        class={`garden-card-item post-item mb-6${spanFor(post.collection)}`}
        class:cascade-pending={mounted && !revealed}
        class:cascade-in={revealed}
        style={`transition-delay: ${i * 40}ms`}
        data-tags={post.data.tags?.join(' ')}
        data-collection={post.collection}
      >
        <ContentCard
          title={post.data.title}
          description={post.data.description || ''}
          pubDate={post.data.pubDate}
          url={urlForEntry(post.collection, post.id)}
          {image}
          maturity={post.data.maturity}
          collection={post.collection}
          variant={variantFor(post.collection)}
          headingLevel={2}
          startedDate={post.data.startedDate}
          lastUpdated={post.data.lastUpdated}
          postCount={post.postCount}
          posts={post.data.posts}
          transitionName={`card-${post.collection}-${post.id}`}
        />
      </div>
    {/each}
  </div>
</section>

<style>
  /* Entrance cascade — mirrors the values the old listingFilters.ts used. */
  .garden-card-item.cascade-pending {
    opacity: 0;
    transform: translateY(8px);
  }
  .garden-card-item.cascade-in {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 300ms ease,
      transform 300ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .garden-card-item.cascade-pending {
      opacity: 1;
      transform: none;
    }
    .garden-card-item.cascade-in {
      transition: none;
    }
  }
</style>
