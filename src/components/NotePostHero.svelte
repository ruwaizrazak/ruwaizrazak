<script lang="ts">
  import type { OptimizedPicture } from '../utils/optimizeImage';
  import { getMaturityIcon } from '../utils/maturityIcons';
  import PageHero from './PageHero.svelte';
  import OptimizedPictureView from './ui/OptimizedPicture.svelte';
  import { pageType } from '../styles/typography';

  interface Props {
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    /**
     * LEARN: resolved by the .astro layout via optimizePicture(). <Picture> emits
     * AVIF + WebP sources for this above-the-fold hero (best compression on a
     * large image); Svelte can't call astro:assets, so the layout resolves it.
     */
    picture?: OptimizedPicture | null;
    tags: string[];
    maturity?: 'seed' | 'plant' | 'tree';
  }

  let { title, description, pubDate, updatedDate, picture = null, tags = [], maturity }: Props =
    $props();

  const maturityIcon = $derived(getMaturityIcon(maturity));

  const formattedDate = $derived(
    pubDate.toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
  );
  const formattedUpdatedDate = $derived(
    updatedDate?.toLocaleDateString('en-us', { year: 'numeric', month: 'short', day: 'numeric' }),
  );
</script>

<PageHero
  {title}
  {description}
  titleClass="p-name"
  descriptionClass="p-summary"
  class="justify-start mb-10"
>
  <!-- Metadata row -->
  <div class={`${pageType.date} flex flex-wrap items-center gap-x-4 gap-y-1 text-syoro/60 mb-4 mt-10`}>
    {#if maturityIcon}
      <div class="flex items-center gap-1.5">
        <img src={maturityIcon} class="w-4 opacity-60" alt="" />
        <span>{maturity}</span>
      </div>
    {/if}
    <time datetime={pubDate.toISOString()} class="dt-published">{formattedDate}</time>
    {#if formattedUpdatedDate}
      <span>· Updated {formattedUpdatedDate}</span>
    {/if}
  </div>

  <!-- Tags -->
  {#if tags.length > 0}
    <div class="flex flex-wrap items-center gap-x-1 text-lg font-sans text-syoro/60">
      {#each tags as tag, index (tag)}
        <a
          href={`/tags/${tag.toLowerCase()}`}
          class="hover:text-syoro/80 transition-colors duration-200 hover:italic"
        >
          {tag.charAt(0).toUpperCase() + tag.slice(1)}
        </a>
        {#if index < tags.length - 1}<span>·</span>{/if}
      {/each}
    </div>
  {/if}

  <!-- Hero image, clean and simple -->
  <OptimizedPictureView
    {picture}
    alt=""
    class="w-screen mt-12 rounded mx-auto aspect-video"
    passthroughClass="w-screen mt-12 rounded mx-auto h-60"
    loading="eager"
  />
</PageHero>
