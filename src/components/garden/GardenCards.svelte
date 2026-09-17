<script lang="ts">
  import { onMount } from 'svelte';
  import ContentCard from '../ContentCard.svelte';
  import type { GardenCardProps } from '../../types';
  import { urlForEntry } from '../../utils/urls';
  import { gardenSpan, groupGardenPostsByDate } from '../../utils/gardenLayout';

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

  const gardenGroups = $derived(groupGardenPostsByDate(cards));

  function delayFor(card: GardenCardProps) {
    return cards.indexOf(card) * 40;
  }

</script>

<section class="garden-cards-section pb-40">
  {#if layout === 'garden'}
    <div class="flex flex-col gap-5">
      {#each gardenGroups as group}
        {#if group.type === 'series'}
          {@const card = group.post}
          <div
            class={[
              'garden-card-item post-item',
              {
                'cascade-pending transform-[translateY(8px)] opacity-0 motion-reduce:transform-none motion-reduce:opacity-100': mounted && !revealed,
                'cascade-in transform-[translateY(0)] opacity-100 transition-[opacity,transform] duration-300 ease-[ease] motion-reduce:transition-none': revealed,
              },
            ]}
            style={`transition-delay: ${delayFor(card)}ms`}
            data-tags={card.tags.join(' ')}
            data-collection={card.collection}
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
              variant="series"
              headingLevel={2}
              startedDate={card.startedDate}
              lastUpdated={card.lastUpdated}
              postCount={card.postCount}
              posts={card.posts}
              transitionName={`card-${card.collection}-${card.id}`}
            />
          </div>
        {:else}
          <div class="garden-feature-grid">
            {#each group.posts as card (card.id)}
              {@const span = gardenSpan(card.collection)}
              <div
                class={[
                  'garden-card-item post-item',
                  {
                    'garden-span-wide': span === 'wide',
                    'cascade-pending transform-[translateY(8px)] opacity-0 motion-reduce:transform-none motion-reduce:opacity-100': mounted && !revealed,
                    'cascade-in transform-[translateY(0)] opacity-100 transition-[opacity,transform] duration-300 ease-[ease] motion-reduce:transition-none': revealed,
                  },
                ]}
                style={`transition-delay: ${delayFor(card)}ms`}
                data-tags={card.tags.join(' ')}
                data-collection={card.collection}
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
                  variant={span}
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
