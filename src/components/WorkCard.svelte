<script lang="ts">
  import type { OptimizedPicture as PictureData } from '../utils/optimizeImage';
  import { cardType } from '../styles/typography';
  import OptimizedPicture from './ui/OptimizedPicture.svelte';

  interface Props {
    /** Plain data lifted off the works CollectionEntry by the .astro parent. */
    title: string;
    description?: string;
    role?: string;
    duration: string;
    href: string;
    /** LEARN: resolved by the .astro parent — Svelte can't reach astro:assets. */
    image?: PictureData | null;
  }

  let { title, description, role, duration, href, image = null }: Props = $props();
</script>

<!-- Work card: text on left, hero image on right (stacks on mobile) -->
<a href={href} class="group block hover:scale-95 transition-transform duration-200 ease-snappy">
  <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
    <!-- Card metadata (sticky on desktop) -->
    <div class="work-card-content flex w-full flex-col gap-2 md:sticky md:top-[30vh] md:w-1/3">
      <p class={`${cardType.meta} text-syoro/70`}>{duration}</p>
      <h2 class={`${cardType.title} text-syoro`}>{title}</h2>
      <h3 class={`${cardType.meta} text-syoro`}>{role}</h3>
      {#if description}
        <p class={`${cardType.description} text-syoro/80 mt-5 leading-relaxed`}>{description}</p>
      {/if}
    </div>
    <!-- Hero image with CSS parallax zoom (see .work-card-image in global.css) -->
    <div class="w-full md:w-2/3 overflow-hidden rounded-lg group-hover:border-4 group-hover:border-blue-200">
      {#if image}
        <!-- LEARN: `contents` drops the <picture> box so the <img> stays the sized element; an inline
             <picture> inside a flex parent measured 0×0 (plan P3). -->
        <OptimizedPicture
          picture={image}
          alt={title}
          loading="lazy"
          pictureClass="contents"
          class="work-card-image w-full aspect-[4/3] object-cover"
        />
      {:else}
        <div class="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"></div>
      {/if}
    </div>
  </div>
</a>
