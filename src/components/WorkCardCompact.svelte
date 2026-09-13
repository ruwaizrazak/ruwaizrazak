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

<a href={url} class="card-shell group">
  <div class="card-band">
    <OptimizedImage
      {image}
      alt={title}
      class="h-full w-full object-cover"
      fallbackClass="h-full w-full bg-syoro/5"
    />
  </div>
  <div class="flex min-w-0 flex-1 flex-col gap-3">
    <h3 class={`${cardType.title} card-title`}>
      {title}
    </h3>
    {#if role}
      <p class="card-eyebrow">{role}</p>
    {/if}
    <p class="card-meta mt-auto uppercase">
      {company} · {duration}
    </p>
  </div>
</a>
