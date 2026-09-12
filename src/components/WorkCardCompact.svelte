<script lang="ts">
  import type { OptimizedImg } from '../utils/optimizeImage';
  import { cardType } from '../styles/typography';
  import OptimizedImage from './ui/OptimizedImage.svelte';

  export interface Props {
    title: string;
    role?: string;
    company: string;
    duration: string;
    /** LEARN: resolved by the .astro parent — Svelte can't reach astro:assets. */
    image?: OptimizedImg | null;
    url: string;
  }

  let { title, role, company, duration, image = null, url }: Props = $props();
</script>

<a href={url} class="group block hover:scale-95 transition-all duration-200 ease-in-out">
  <div class="overflow-hidden rounded-lg">
    <OptimizedImage
      {image}
      alt={title}
      class="w-full aspect-[4/3] object-cover"
      fallbackClass="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"
    />
  </div>
  <div class="flex flex-col gap-1 mt-4">
    <h3 class={`${cardType.title} text-syoro group-hover:text-konpeki transition-colors`}>
      {title}
    </h3>
    {#if role}
      <p class={`${cardType.meta} text-syoro/60 dark:text-white/40`}>{role}</p>
    {/if}
    <p class={`${cardType.meta} text-syoro/60 font-semibold dark:text-white/30`}>
      {company} · {duration}
    </p>
  </div>
</a>
