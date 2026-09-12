<script lang="ts">
  import type { OptimizedImg } from '../../utils/optimizeImage';

  interface Props {
    /** Resolved by an .astro parent via optimizeImage(). */
    image?: OptimizedImg | null;
    alt: string;
    class?: string;
    /**
     * Classes for the placeholder <div> rendered when there is no image at all.
     * Omit to render nothing in that case.
     */
    fallbackClass?: string;
  }

  let { image = null, alt, class: className = '', fallbackClass }: Props = $props();
</script>

<!-- LEARN: the three branches mirror what `heroImg ? <Image> : heroImage ? <img> : <div>`
     emitted in the .astro originals, so the built markup is unchanged:
       optimized  -> width/height/loading/decoding/fetchpriority from getImage()
       passthrough -> bare <img> (remote URL, nothing local to optimize)
       neither     -> the grey placeholder box
     This component deliberately has NO <style> block: a scoped style would make
     Svelte stamp a scoping class onto the <img>, needlessly diverging the markup. -->
{#if image?.passthrough}
  <img src={image.src} {alt} class={className} />
{:else if image}
  <img
    src={image.src}
    {alt}
    loading="lazy"
    decoding="async"
    fetchpriority="auto"
    width={image.width}
    height={image.height}
    class={className}
  />
{:else if fallbackClass}
  <div class={fallbackClass}></div>
{/if}
