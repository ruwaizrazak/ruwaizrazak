<script lang="ts">
  import type { OptimizedImg } from '../utils/optimizeImage';
  import { cardType } from '../styles/typography';
  import OptimizedImage from './ui/OptimizedImage.svelte';

  interface Props {
    /** Plain data lifted off the works CollectionEntry by the .astro parent. */
    title: string;
    description?: string;
    role?: string;
    duration: string;
    href: string;
    /** LEARN: resolved by the .astro parent — Svelte can't reach astro:assets. */
    image?: OptimizedImg | null;
  }

  let { title, description, role, duration, href, image = null }: Props = $props();
</script>

<!-- Work card: text on left, hero image on right (stacks on mobile) -->
<a href={href} class="group block hover:scale-95 transition-transform duration-200 ease-snappy">
  <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
    <!-- Card metadata (sticky on desktop) -->
    <div class="work-card-content w-full md:w-1/3 flex flex-col gap-2">
      <p class={`${cardType.meta} text-syoro/60`}>{duration}</p>
      <h2 class={`${cardType.title} text-syoro`}>{title}</h2>
      <h3 class={`${cardType.meta} text-syoro`}>{role}</h3>
      {#if description}
        <p class={`${cardType.description} text-syoro/80 mt-5 leading-relaxed`}>{description}</p>
      {/if}
    </div>
    <!-- Hero image with CSS parallax zoom (see .work-card-image in global.css) -->
    <div class="w-full md:w-2/3 overflow-hidden rounded-lg group-hover:border-4 group-hover:border-blue-200">
      <OptimizedImage
        {image}
        alt={title}
        class="work-card-image w-full aspect-[4/3] object-cover"
        fallbackClass="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"
      />
    </div>
  </div>
</a>

<style>
  @media (min-width: 768px) {
    .work-card-content {
      position: sticky;
      top: 30vh;
    }
  }
</style>
