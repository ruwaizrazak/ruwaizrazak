<script lang="ts">
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
  }

  let { series }: Props = $props();
</script>

<div class="mb-12 border-b border-syoro/10 pb-10">
  <div class="flex items-center gap-6 mb-6">
    {#if series.data.featuredImage}
      <img
        src={series.data.featuredImage}
        alt={series.data.title}
        class="w-[40%] h-auto object-cover rounded-lg shrink-0"
      />
    {/if}
    <div>
      <h1 class="font-serif text-4xl md:text-5xl text-syoro">{series.data.title}</h1>
      <p class="font-serif italic text-syoro/90 mt-2 mb-4">{series.data.description}</p>
      <div class="flex items-center gap-4 mb-6 text-lg font-sans text-syoro/80">
        <span>Started: {series.data.startedDate.toLocaleDateString()}</span>
        <span>·</span>
        <span>Last updated: {series.data.lastUpdated.toLocaleDateString()}</span>
        <span>·</span>
        <span>{series.posts.length} posts</span>
      </div>
    </div>
  </div>

  {#if series.posts.length > 0}
    <div class="space-y-4 mt-10">
      <h3 class="text-xl font-sans font-semibold text-syoro/70 uppercase tracking-widest">Posts in this series:</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each series.posts as post}
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
