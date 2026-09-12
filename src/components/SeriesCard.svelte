<script lang="ts">
  import type { OptimizedImg } from '../utils/optimizeImage';
  import SeriesPostCard from './SeriesPostCard.svelte';
  import OptimizedImage from './ui/OptimizedImage.svelte';
  import { cardType } from '../styles/typography';

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
    /** LEARN: resolved by the .astro parent — Svelte can't reach astro:assets. */
    image?: OptimizedImg | null;
    // LEARN: on an individual series page the NotePostHero already shows the image/title,
    // so hideHeader skips this card's header block and renders only the posts grid.
    hideHeader?: boolean;
  }

  let { series, image = null, hideHeader = false }: Props = $props();
</script>

<div class="mb-12 border-b border-syoro/10 pb-10">
  {#if !hideHeader}
    <div class="flex items-center gap-6 mb-6">
      <OptimizedImage {image} alt={series.data.title} class="w-[40%] h-auto object-cover rounded-lg shrink-0" />
      <div>
        <h1 class={`${cardType.title} text-syoro`}>{series.data.title}</h1>
        <p class={`${cardType.description} italic text-syoro/90 mt-2 mb-4`}>{series.data.description}</p>
        <div class={`${cardType.meta} flex items-center gap-4 mb-6 text-syoro/80`}>
          <span>Started: {series.data.startedDate.toLocaleDateString()}</span>
          <span>·</span>
          <span>Last updated: {series.data.lastUpdated.toLocaleDateString()}</span>
          <span>·</span>
          <span>{series.posts.length} posts</span>
        </div>
      </div>
    </div>
  {/if}

  {#if series.posts.length > 0}
    <div class="space-y-4 mt-10">
      <h3 class={`${cardType.meta} font-semibold text-syoro/70`}>
        Posts in this series{hideHeader ? ` · ${series.posts.length}` : ':'}
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each series.posts as post (post.id)}
          <SeriesPostCard {post} />
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-center py-8 text-syoro/50">
      <p>No posts in this series yet.</p>
    </div>
  {/if}
</div>
