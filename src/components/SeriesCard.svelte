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

<section class="card-panel mb-12 flex flex-col gap-[22px]">
  {#if !hideHeader}
    <header class="flex flex-col gap-5 sm:flex-row">
      <OptimizedImage
        {image}
        alt={series.data.title}
        class="series-header-image"
        fallbackClass="series-header-image bg-syoro/5"
      />
      <div class="flex min-w-0 flex-col gap-2">
        <span class="card-eyebrow">
          <span
            class="card-collection-icon"
            style="--card-icon: url('/icons/series.svg')"
            aria-hidden="true"
          ></span>
          <span>Series</span>
        </span>
        <h2 class={`${cardType.title} text-3xl leading-[1.15] text-syoro`}>{series.data.title}</h2>
        <p class={`${cardType.description} card-description italic`}>
          {series.data.description}
        </p>
        <p class="font-sans text-[14px] tracking-[0.08em] uppercase text-muted">
          Started {formatDate(series.data.startedDate)} · Last updated {formatDate(series.data.lastUpdated)} ·
          {series.posts.length} {series.posts.length === 1 ? 'post' : 'posts'}
        </p>
      </div>
    </header>
  {/if}

  {#if series.posts.length > 0}
    <div class="flex items-center gap-3">
      <h2 class="font-sans text-[14px] font-medium tracking-eyebrow uppercase text-syoro">Posts in this series{hideHeader ? ` · ${series.posts.length}` : ''}</h2>
      <span class="h-px flex-1 bg-card-border" aria-hidden="true"></span>
    </div>
    <div class="grid auto-rows-[1fr] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each series.posts as post (post.id)}
        <SeriesPostCard {post} />
      {/each}
    </div>
  {:else}
    <p class="py-8 text-center font-serif text-syoro/50">No posts in this series yet.</p>
  {/if}
</section>

<style>
  /* LEARN: the ONLY rule that cannot be a utility. `.series-header-image` is a
     class handed to OptimizedImage as a prop, so it lands on an <img> declared in
     THAT component's template — a parent's scoping hash never reaches it. Hence
     :global(). Everything else in this file is now utilities. */
  :global(.series-header-image) {
    width: 100%;
    aspect-ratio: 16 / 10;
    flex-shrink: 0;
    border: 1px solid var(--color-card-border);
    border-radius: 12px;
    object-fit: cover;
  }

  @media (min-width: 640px) {
    :global(.series-header-image) { width: 34%; }
  }
</style>
