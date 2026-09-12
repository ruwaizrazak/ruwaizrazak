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
    /** LEARN: Astro.url is unreachable from Svelte, so Button's active-link
        check takes the current pathname as a prop. */
    pathname: string;
  }

  let { cards, pathname }: Props = $props();
</script>

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
