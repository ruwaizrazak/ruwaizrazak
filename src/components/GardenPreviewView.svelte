<script lang="ts">
  import ContentCard from './ContentCard.svelte';
  import Button from './Button.svelte';
  import { pageType } from '../styles/typography';
  import type { OptimizedImg } from '../utils/optimizeImage';

  interface PreviewCard {
    post: any;
    image: OptimizedImg | null;
  }

  interface Props {
    cards: PreviewCard[];
    variant?: 'cards' | 'list';
    /** LEARN: Astro.url is unreachable from Svelte, so Button's active-link
        check takes the current pathname as a prop. */
    pathname: string;
  }

  let { cards, pathname, variant = 'cards' }: Props = $props();
</script>

{#if variant === 'list'}
  <div data-garden-preview="list">
    {#each cards as { post } (post.id)}
      <a
        href={`/${post.collection}/${post.id}`}
        class="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-5 border-t border-card-border py-[22px] text-syoro transition-colors duration-150 hover:text-konpeki"
      >
        <span class="flex min-w-0 flex-col gap-2">
          <span class="flex items-center gap-2 font-sans text-sm font-medium uppercase tracking-[0.16em] text-konpeki">
            <span
              class="card-collection-icon"
              style={`--card-icon: url('/icons/${post.collection}.svg')`}
              aria-hidden="true"
            ></span>
            <span>{post.collection}</span>
          </span>
          <span class="font-serif text-[21px] leading-[1.3] transition-colors duration-150">
            {post.data.title}
          </span>
          <span class="garden-list-description font-serif text-base leading-[1.5]">
            {post.data.description}
          </span>
        </span>
        <time
          class="font-sans text-[15px] tracking-[0.06em] text-muted"
          datetime={post.data.pubDate.toISOString()}
        >
          {post.data.pubDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </time>
      </a>
    {/each}
  </div>
{:else}
  <section class="my-20 md:my-30">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
      <div class="flex flex-col gap-2 w-[80%]">
        <h2 class={`${pageType.sectionLabel} text-syoro dark:text-white/60 md:col-span-2`}>
          From the Garden
        </h2>
        <p class="font-serif text-syoro dark:text-white/60 border-syoro w-full md:w-3/4">
          Writing is an essential part of my process and learning. Here are some of my latest essays
          and you can find more in the garden.
        </p>
      </div>
      <Button
        href="/garden"
        {pathname}
        class="font-sans text-sm uppercase mt-5 md:mt-0 tracking-widest text-link hover:underline"
      >
        Visit garden
      </Button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each cards as { post, image } (post.id)}
        <ContentCard
          title={post.data.title}
          description={post.data.description}
          pubDate={post.data.pubDate}
          url={`/${post.collection}/${post.id}`}
          {image}
          maturity={post.data.maturity}
          collection={post.collection}
        />
      {/each}
    </div>
  </section>
{/if}

<style>
  .garden-list-description {
    color: color-mix(in srgb, var(--color-syoro) 88%, transparent);
  }
</style>
