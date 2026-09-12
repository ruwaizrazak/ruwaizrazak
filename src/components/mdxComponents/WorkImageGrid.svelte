<script lang="ts">
  import type { Snippet } from 'svelte';
  // LEARN: Wraps Image components in a 2-column grid on lg+. A lone image spans the
  // full content width; 2+ images sit in the centered 2-col grid at intrinsic width.
  // Detection is CSS-only via :has() — no extra MDX props.
  //
  // LEARN: the direct child is now <astro-island>, because Image mounts the
  // lightbox as a hydrated island — so `> picture:only-of-type` no longer matches
  // and single-image detection keys off `> astro-island:only-of-type` instead.
  // Astro gives astro-island `display: contents`, so the <picture> is still the
  // grid ITEM for layout purposes; only the selector had to move. This is the one
  // place the styling knowingly depends on Astro's island element.
  let { children }: { children?: Snippet } = $props();
</script>

<div
  class="grid w-full max-w-full mx-auto gap-10 justify-items-center items-center my-5 md:my-10 py-5 md:py-0 rounded-2xl grid-cols-1 lg:grid-cols-2 [&_img]:w-auto [&_img]:max-w-[min(80%,48rem)] lg:[&:has(>astro-island:only-of-type)]:grid-cols-1 [&:has(>astro-island:only-of-type)_picture]:w-full [&:has(>astro-island:only-of-type)_img]:!w-full [&:has(>astro-island:only-of-type)_img]:!max-w-full"
>
  {@render children?.()}
</div>
