<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from '../ContentCard.svelte';
  import type { OptimizedImg } from '../../utils/optimizeImage';
  import { urlForEntry } from '../../utils/urls';
  import { gardenSpan, partitionGardenPosts } from '../../utils/gardenLayout';

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
    layout?: 'grid' | 'garden';
  }

  let { cards, layout = 'grid' }: Props = $props();

  // Same hydration gate as RelatedNotes: with scripting off the cards must stay
  // visible, so the pre-hide only applies once this island can reveal them again.
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
    // Next frame, so the browser paints the hidden state before the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => (revealed = true)));
  });
  let revealed = $state(false);

  const imageByPost = $derived(new Map(cards.map(({ post, image }) => [post, image])));
  const gardenPartitions = $derived(partitionGardenPosts(cards.map(({ post }) => post)));

</script>

<section class="garden-cards-section pb-40">
  {#if layout === 'garden'}
    <div class="flex flex-col gap-5">
      {#each gardenPartitions.seriesPosts as post, i (post.id)}
        <div
          class="garden-card-item post-item h-full"
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
            image={imageByPost.get(post) ?? null}
            maturity={post.data.maturity}
            collection={post.collection}
            variant="series"
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

    {#if gardenPartitions.gridPosts.length > 0}
      <div class="garden-feature-grid mt-5">
        {#each gardenPartitions.gridPosts as post, i (post.id)}
          {@const span = gardenSpan(post.collection)}
          <div
            class="garden-card-item post-item h-full"
            class:garden-span-wide={span === 'wide'}
            class:cascade-pending={mounted && !revealed}
            class:cascade-in={revealed}
            style={`transition-delay: ${(gardenPartitions.seriesPosts.length + i) * 40}ms`}
            data-tags={post.data.tags?.join(' ')}
            data-collection={post.collection}
          >
            <ContentCard
              title={post.data.title}
              description={post.data.description || ''}
              pubDate={post.data.pubDate}
              url={urlForEntry(post.collection, post.id)}
              image={imageByPost.get(post) ?? null}
              maturity={post.data.maturity}
              collection={post.collection}
              variant={span}
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
    {/if}
  {:else}
    <!-- LEARN: auto-rows-fr gives every collection signature the same row height;
         the 16:10 band and footer auto-margin keep the internal baselines aligned. -->
    <div class="card-masonry grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-5">
      {#each cards as { post, image }, i (post.id)}
        <div
          class="garden-card-item post-item h-full"
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
            variant="card"
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
  {/if}
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
