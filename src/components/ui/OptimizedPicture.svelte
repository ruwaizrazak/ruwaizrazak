<script lang="ts">
  import type { OptimizedPicture } from '../../utils/optimizeImage';

  interface Props {
    picture?: OptimizedPicture | null;
    alt?: string;
    class?: string;
    loading?: 'eager' | 'lazy';
    /** Class used for the passthrough (remote) <img>, which has no <picture> wrapper. */
    passthroughClass?: string;
  }

  let {
    picture = null,
    alt = '',
    class: className = '',
    loading = 'eager',
    passthroughClass,
  }: Props = $props();
</script>

<!-- LEARN: reproduces Astro's <Picture formats={['avif','webp']} /> output —
     one <source> per modern format, then the fallback <img>. No <style> block
     here on purpose, so Svelte adds no scoping class to the markup. -->
{#if picture?.img.passthrough}
  <img src={picture.img.src} {alt} class={passthroughClass ?? className} {loading} />
{:else if picture}
  <picture>
    {#each picture.sources as source (source.type)}
      <source srcset={source.srcset} type={source.type} />
    {/each}
    <img
      src={picture.img.src}
      {alt}
      {loading}
      decoding="async"
      fetchpriority="auto"
      width={picture.img.width}
      height={picture.img.height}
      class={className}
    />
  </picture>
{/if}
