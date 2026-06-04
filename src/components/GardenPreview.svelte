<script lang="ts">
  import ContentCard from './ContentCard.svelte';
  import Button from './Button.svelte';

  interface Props {
    posts: any[];
    // LEARN: passed by the parent (Astro.url.pathname) for Button's active-link check,
    // since Svelte components can't read the Astro global.
    pathname?: string;
  }

  let { posts, pathname = '' }: Props = $props();

  // Defensive filter — this block is essays-only even if a parent passes more
  const essays = $derived(posts.filter((post) => post.collection === 'essays'));
</script>

<section class="my-20 md:my-30">
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
    <div class="flex flex-col gap-2 w-[80%]">
      <h2 class="text-xl font-sans font-semibold text-syoro dark:text-white/60 uppercase tracking-widest md:col-span-2">
        From the Garden
      </h2>
      <p class="font-serif text-syoro dark:text-white/60 border-syoro w-full md:w-3/4">Writing is an essential part of my process and learning. Here are some of my latest essays and you can find more in the garden.</p>
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
    {#each essays as post}
      <ContentCard
        title={post.data.title}
        description={post.data.description}
        pubDate={post.data.pubDate}
        url={`/${post.collection}/${post.id}`}
        heroImage={post.data.heroImage}
        maturity={post.data.maturity}
        collection={post.collection}
      />
    {/each}
  </div>
</section>
