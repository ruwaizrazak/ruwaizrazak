<script lang="ts">
  import type { OptimizedImg } from '../utils/optimizeImage';
  import { cardType } from '../styles/typography';
  import { formatDate } from '../utils/formatDate';
  import OptimizedImage from './ui/OptimizedImage.svelte';
  import SeriesPostCard from './SeriesPostCard.svelte';

  interface Props {
    series: {
      data: {
        title: string;
        description: string;
        featuredImage?: string;
        startedDate: Date;
        lastUpdated: Date;
      };
      posts: {
        id: string;
        data: {
          title: string;
          description: string;
          excerpt?: string;
          tags: string[];
          seriesOrder?: number;
          pubDate: Date;
        };
      }[];
    };
    image?: OptimizedImg | null;
    hideHeader?: boolean;
  }

  let { series, image = null, hideHeader = false }: Props = $props();
</script>

<section class="series-overview card-panel">
  {#if !hideHeader}
    <header class="series-header">
      <OptimizedImage
        {image}
        alt={series.data.title}
        class="series-header-image"
        fallbackClass="series-header-image bg-syoro/5"
      />
      <div class="series-header-copy">
        <span class="card-eyebrow">
          <span
            class="card-collection-icon"
            style="--card-icon: url('/icons/series.svg')"
            aria-hidden="true"
          ></span>
          <span>Series</span>
        </span>
        <h2 class={`${cardType.title} series-title`}>{series.data.title}</h2>
        <p class={`${cardType.description} card-description italic`}>
          {series.data.description}
        </p>
        <p class="series-meta">
          Started {formatDate(series.data.startedDate)} · Last updated {formatDate(series.data.lastUpdated)} ·
          {series.posts.length} {series.posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>
    </header>
  {/if}

  {#if series.posts.length > 0}
    <div class="series-posts-header">
      <h2>Posts in this series{hideHeader ? ` · ${series.posts.length}` : ''}</h2>
      <span aria-hidden="true"></span>
    </div>
    <div class="series-posts-grid">
      {#each series.posts as post (post.id)}
        <SeriesPostCard {post} />
      {/each}
    </div>
  {:else}
    <p class="py-8 text-center font-serif text-syoro/50">No posts in this series yet.</p>
  {/if}
</section>

<style>
  .series-overview {
    display: flex;
    flex-direction: column;
    gap: 22px;
    margin-bottom: 3rem;
  }

  .series-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  :global(.series-header-image) {
    width: 100%;
    aspect-ratio: 16 / 10;
    flex-shrink: 0;
    border: 1px solid var(--color-card-border);
    border-radius: 12px;
    object-fit: cover;
  }

  .series-header-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 8px;
  }

  .series-title {
    font-size: 1.875rem;
    line-height: 1.15;
    color: var(--color-syoro);
  }

  .series-meta {
    font-family: var(--font-sans);
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .series-posts-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .series-posts-header h2 {
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-syoro);
  }

  .series-posts-header span {
    height: 1px;
    flex: 1;
    background: var(--color-card-border);
  }

  .series-posts-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: 1fr;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .series-header { flex-direction: row; }
    :global(.series-header-image) { width: 34%; }
  }

  @media (min-width: 768px) {
    .series-posts-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (min-width: 1024px) {
    .series-posts-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
</style>
