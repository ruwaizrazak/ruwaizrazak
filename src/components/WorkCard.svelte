<script lang="ts">
  // LEARN: Static Svelte component (no client:* , zero JS). The parallax-zoom is now
  // a native CSS scroll-driven animation (see <style> below) — no GSAP/ScrollTrigger.
  import type { CollectionEntry } from 'astro:content';

  interface Props {
    entry: CollectionEntry<'works'>;
  }

  let { entry }: Props = $props();
</script>

{#if entry?.data}
  {@const { role, duration, heroImage, title, description } = entry.data}
  <!-- Work card: text on left, hero image on right (stacks on mobile) -->
  <a
    href={`/works/${entry.id}`}
    class="work-card-container group block hover:scale-95 transition-all duration-200 ease-in-out">
    <div class="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <!-- Card metadata (sticky on desktop) -->
      <div class="work-card-content w-full md:w-1/3 flex flex-col gap-2">
        <p class="text-syoro/60 font-sans text-base md:text-lg uppercase tracking-wide">{duration}</p>
        <h2 class="text-syoro font-serif text-2xl md:text-3xl">{title}</h2>
        <h3 class="text-syoro font-sans text-lg md:text-xl">{role}</h3>
        {#if description}
          <p class="text-syoro/80 font-serif mt-5 leading-relaxed">{description}</p>
        {/if}
      </div>
      <!-- Hero image with parallax zoom (see work-card-animations.ts) -->
      <div class="w-full md:w-2/3 overflow-hidden rounded-lg group-hover:border-4 group-hover:border-blue-200">
        {#if heroImage}
          <img src={heroImage} alt={title} class="work-card-image w-full aspect-[4/3] object-cover" />
        {:else}
          <div class="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"></div>
        {/if}
      </div>
    </div>
  </a>
{/if}

<style>
  @media (min-width: 768px) {
    .work-card-content {
      position: sticky;
      top: 30vh;
    }
  }

  /* LEARN: Parallax zoom via native CSS scroll-driven animation (zero JS) — replaces
     GSAP ScrollTrigger. The keyframes END at the natural resting state (scale 1), so
     browsers without `animation-timeline` (Firefox, Safari <26) run it time-based at
     0s duration and snap to the correct final image — no broken/zoomed state. */
  @keyframes work-card-parallax {
    from { transform: scale(1.5); }
    to   { transform: scale(1); }
  }
  .work-card-image {
    animation: work-card-parallax linear both;
    animation-timeline: view();
    animation-range: cover;
  }
  @media (prefers-reduced-motion: reduce) {
    .work-card-image { animation: none; }
  }
</style>
