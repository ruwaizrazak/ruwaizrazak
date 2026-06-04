<script lang="ts">
  // LEARN: Island (client:visible). Renders the garden masonry of ContentCards and,
  // in onMount, wires the parallax-zoom (gardenCardAnimations.ts) plus the essay-width
  // MutationObserver that reacts to the filter script toggling card display.
  import { onMount } from 'svelte';
  import ContentCard from '../ContentCard.svelte';

  interface Props {
    posts: any[];
  }
  let { posts }: Props = $props();

  const cardVariantCollections = new Set(['essays', 'playground']);

  function updateEssayWidths() {
    const grid = document.querySelector<HTMLElement>('.card-masonry');
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.garden-card-item'));
    const visibleCards = cards.filter((c) => c.style.display !== 'none');
    cards.forEach((c) => c.classList.remove('essay-full-row'));
    visibleCards.forEach((card, index) => {
      if (card.dataset.collection !== 'essays') return;
      const nextCard = visibleCards[index + 1];
      const nextIsNonEssay = nextCard?.dataset.collection !== 'essays';
      if (!nextCard || !nextIsNonEssay) card.classList.add('essay-full-row');
    });
  }

  onMount(() => {
    // LEARN: dynamic import so the GSAP/ScrollTrigger module (which calls
    // gsap.registerPlugin at load) never runs during Astro's SSR of this island —
    // ScrollTrigger needs `window`, so a top-level import would crash the build.
    import('../../scripts/garden/gardenCardAnimations').then((m) => m.initGardenCardAnimations());

    const grid = document.querySelector('.card-masonry');
    let observer: MutationObserver | undefined;
    if (grid) {
      updateEssayWidths();
      observer = new MutationObserver((mutations) => {
        const hasDisplayChange = mutations.some((m) => {
          if (m.attributeName !== 'style') return false;
          const oldDisplay = (m.oldValue ?? '').match(/display:\s*([^;]+)/)?.[1]?.trim();
          const newDisplay = (m.target as HTMLElement).style.display;
          return oldDisplay !== newDisplay;
        });
        if (hasDisplayChange) updateEssayWidths();
      });
      observer.observe(grid, { subtree: true, attributeFilter: ['style'], attributeOldValue: true });
    }
    return () => observer?.disconnect();
  });
</script>

<section class="garden-cards-section pb-40">
  <div class="card-masonry grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
    {#each posts ?? [] as post}
      <div
        class={`garden-card-item post-item mb-6 card-reveal${post.collection === 'essays' ? ' md:col-span-2 lg:col-span-3 2xl:col-span-3' : ''}`}
        data-tags={post.data.tags?.join(' ')}
        data-collection={post.collection}
      >
        <ContentCard
          title={post.data.title}
          description={post.data.description || ''}
          pubDate={post.data.pubDate}
          url={`/${post.collection}/${post.id}/`}
          heroImage={cardVariantCollections.has(post.collection) ? post.data.heroImage : undefined}
          maturity={post.data.maturity}
          collection={post.collection}
          variant={post.collection === 'essays' ? 'wide' : cardVariantCollections.has(post.collection) ? 'card' : 'compact'}
          transitionName={`card-${post.collection}-${post.id}`}
        />
      </div>
    {/each}
  </div>
</section>

<style>
  :global(.essay-full-row) {
    grid-column: 1 / -1;
  }
</style>
