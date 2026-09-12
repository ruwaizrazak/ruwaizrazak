<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { OptimizedImg } from '../../utils/optimizeImage';
  import OptimizedImage from '../ui/OptimizedImage.svelte';

  interface Props {
    /** Resolved by ImagesLeft.astro — Svelte can't reach astro:assets. */
    image?: OptimizedImg | null;
    alt?: string;
    imagePercent?: number;
    children?: Snippet;
  }

  let { image = null, alt = '', imagePercent = 20, children }: Props = $props();

  // LEARN: carried over verbatim, and it does NOT work as intended. An @media
  // block is illegal inside a style attribute, so the browser keeps `width: 100%`
  // and discards the rest — meaning `imagePercent` (and the unused `imageWidth`
  // prop that was here) have never affected layout; the flex row does the sizing.
  // Preserved exactly rather than "fixed", because making it real would change the
  // rendered layout — that is a design call, not a mechanical migration.
  const imageStyle = $derived(
    `width: 100%; @media (min-width: 768px) { width: ${imagePercent}%; }`,
  );
  const textStyle = $derived(
    `width: 100%; @media (min-width: 768px) { width: ${100 - imagePercent}%; }`,
  );
</script>

<!--Usage
<ImagesLeft imageSrc="image.png" imagePercent={30}>
  <p>Content takes 70%</p>
</ImagesLeft>
-->
<div
  class="w-full mx-auto flex flex-col md:flex-row gap-6 my-8 items-center bg-stone-100 border border-stone-200 p-6 rounded-lg self-center"
>
  <div class="p-5" style={imageStyle}>
    <OptimizedImage {image} {alt} class="w-full rounded-lg p-0 m-0" />
  </div>
  <div
    class="space-y-4 flex flex-col justify-center text-base/6 md:text-lg/8"
    style={textStyle}
  >
    {@render children?.()}
  </div>
</div>
