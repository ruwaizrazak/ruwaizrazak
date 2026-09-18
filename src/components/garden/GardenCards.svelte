<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from '../ContentCard.svelte';
  import type { GardenCardProps } from '../../types';
  import { urlForEntry } from '../../utils/urls';
  import { GARDEN_PLACEMENT_CLASS, gardenPlacementStyle, gardenSpan, packGardenGrid } from '../../utils/gardenLayout';

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
  interface Props {
    cards: GardenCardProps[];
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

  function delayFor(card: GardenCardProps) {
    return cards.indexOf(card) * 40;
  }

</script>

<section class="garden-cards-section pb-40">
  {#if layout === 'garden'}
    <!-- LEARN: one grid for every card. Series, essays and notes all take a width
         and a position per breakpoint from packGardenGrid, passed as custom
         properties because Tailwind cannot see per-card numbers. Grid items
         stretch by default, so every card in a row shares the row's height. -->
    <div class="garden-feature-grid @container grid grid-cols-[repeat(var(--garden-cols),minmax(0,1fr))] gap-5 [--garden-cols:1] md:[--garden-cols:2] lg:[--garden-cols:3] xl:[--garden-cols:4]">
      {#each packGardenGrid(cards) as { post: card, spans, orders } (card.id)}
        <div
          class={[
            `garden-card-item post-item ${GARDEN_PLACEMENT_CLASS}`,
            {
              'cascade-pending transform-[translateY(8px)] opacity-0 motion-reduce:transform-none motion-reduce:opacity-100': mounted && !revealed,
              'cascade-in transform-[translateY(0)] opacity-100 transition-[opacity,transform] duration-300 ease-[ease] motion-reduce:transition-none': revealed,
            },
          ]}
          style={`transition-delay: ${delayFor(card)}ms; ${gardenPlacementStyle(spans, orders)}`}
          data-tags={card.tags.join(' ')}
          data-collection={card.collection}
          data-spans={`${spans.md}-${spans.lg}-${spans.xl}`}
          data-orders={`${orders.md}-${orders.lg}-${orders.xl}`}
          data-date={card.pubDate?.toISOString?.()}
        >
          <ContentCard
            title={card.title}
            description={card.description}
            pubDate={card.pubDate}
            url={urlForEntry(card.collection, card.id)}
            image={card.image}
            maturity={card.maturity}
            collection={card.collection}
            variant={card.collection === 'series' ? 'series' : gardenSpan(card.collection)}
            headingLevel={2}
            startedDate={card.startedDate}
            lastUpdated={card.lastUpdated}
            postCount={card.postCount}
            posts={card.posts}
            transitionName={`card-${card.collection}-${card.id}`}
          />
        </div>
      {/each}
    </div>
  {:else}
    <div class="card-masonry grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {#each cards as card, i (card.id)}
        <div
          class={[
            'garden-card-item post-item',
            {
              'cascade-pending transform-[translateY(8px)] opacity-0 motion-reduce:transform-none motion-reduce:opacity-100': mounted && !revealed,
              'cascade-in transform-[translateY(0)] opacity-100 transition-[opacity,transform] duration-300 ease-[ease] motion-reduce:transition-none': revealed,
            },
          ]}
          style={`transition-delay: ${i * 40}ms`}
          data-tags={card.tags.join(' ')}
          data-collection={card.collection}
        >
          <ContentCard
            title={card.title}
            description={card.description}
            pubDate={card.pubDate}
            url={urlForEntry(card.collection, card.id)}
            image={card.image}
            maturity={card.maturity}
            collection={card.collection}
            variant="card"
            headingLevel={2}
            startedDate={card.startedDate}
            lastUpdated={card.lastUpdated}
            postCount={card.postCount}
            posts={card.posts}
            transitionName={`card-${card.collection}-${card.id}`}
          />
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  /* LEARN: .card-band is 16:10, so a note stretched to 2 columns would grow twice
     as tall as its neighbours. Pin its height to a 1-column card's band instead:
     one column = (grid width − gaps) / cols, minus the card's 20px padding and
     1px border on each side. 100cqw is the grid's width (@container on it).
     Essays keep their own wide-variant layout and series panels have no band. */
  .garden-feature-grid > :not([data-collection='essays']):not([data-collection='series']) :global(.card-band) {
    aspect-ratio: auto;
    height: calc(
      ((100cqw - var(--spacing) * 5 * (var(--garden-cols) - 1)) / var(--garden-cols) - 42px) * 10 / 16
    );
  }

  /* LEARN: the grid stretches each cell to its row's height; the card fills the
     cell and an ordinary card's .card-footer sits on the bottom edge, so a row
     reads as one band. The series panel keeps its own layout and fixed md height
     (!important). .card-shell is unlayered in global.css, so this needs a scoped
     selector, not a utility. */
  .garden-feature-grid > * > :global(.card-shell) {
    height: 100%;
  }

  .garden-feature-grid > * :global(.card-footer) {
    margin-top: auto;
  }
</style>
