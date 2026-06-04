<script lang="ts">
  import { getMaturityIcon } from '../utils/maturityIcons';
  import PageHero from './PageHero.svelte';

  interface Props {
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    heroImage?: string;
    tags?: string[];
    maturity?: 'seed' | 'plant' | 'tree';
  }

  let { title, description, pubDate, updatedDate, heroImage, tags = [], maturity }: Props = $props();
  const maturityIcon = $derived(getMaturityIcon(maturity));

  const formattedDate = $derived(pubDate.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }));
  const formattedUpdatedDate = $derived(updatedDate?.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }));
</script>

<PageHero {title} {description} titleClass="p-name" descriptionClass="p-summary" class="justify-start mb-10">
  <!-- Metadata row -->
  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-lg font-sans uppercase text-syoro/60 mb-4 mt-10">
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
      {#each tags as tag, index}
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
  {#if heroImage}
    <img src={heroImage} alt="" class="w-full mt-12 rounded" loading="eager" />
  {/if}
</PageHero>
