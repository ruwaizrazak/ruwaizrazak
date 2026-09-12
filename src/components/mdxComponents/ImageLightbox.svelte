<script lang="ts">
  import type { OptimizedImg, OptimizedPicture } from '../../utils/optimizeImage';
  import { portal } from '../../lib/portal';
  import { easeSnappy } from '../../lib/easing';
  import { fade } from 'svelte/transition';

  /**
   * LEARN: this island replaces the ~130-line `<script define:vars={{uniqueId}}>`
   * that used to live in Image.astro. `define:vars` forces the script inline and
   * UN-deduplicated, so a page with 30 images shipped 30 copies of it — the CODM
   * essay has 63 images. One component definition now serves them all.
   *
   * Three bugs fixed on the way through:
   *  - the lightbox <img> took `alt={alt}` (bare) while the thumbnail took
   *    `alt={alt || ''}`, so an image with no alt emitted NO alt attribute at
   *    all. That is 27 of the 28 missing alts on the site.
   *  - window mousemove/mouseup listeners were added per image and never
   *    removed, so every navigation leaked another pair.
   *  - `[data-zoom-label]` was queried but no element ever had that attribute,
   *    so the live zoom readout silently did nothing. Wired up properly now.
   */
  interface Props {
    /** Resolved by Image.astro; picture for rasters, image for SVG/remote. */
    picture?: OptimizedPicture | null;
    image?: OptimizedImg | null;
    /** Full-size source shown inside the lightbox. */
    fullSrc: string;
    alt?: string;
    class?: string;
    title?: string;
    description?: string;
    width?: number;
    height?: number;
  }

  let {
    picture = null,
    image = null,
    fullSrc,
    alt = '',
    class: className = 'w-full',
    title,
    description,
  }: Props = $props();

  let open = $state(false);
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isDragging = $state(false);
  let reduceMotion = $state(false);

  let triggerEl = $state<HTMLElement>();
  let origin = $state({ x: 0, y: 0 });

  let dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

  const thumbClass = $derived(
    `object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${className}`,
  );
  const imgTransform = $derived(
    `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
  );

  function openLightbox() {
    const rect = triggerEl?.getBoundingClientRect();
    if (rect) origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    resetZoom();
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    open = true;
  }

  function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox();
    }
  }

  function closeLightbox() {
    open = false;
    triggerEl?.focus?.();
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  function onSliderInput(event: Event) {
    zoom = Number((event.currentTarget as HTMLInputElement).value) / 100;
    if (zoom === 1) {
      panX = 0;
      panY = 0;
    }
  }

  function startDrag(event: MouseEvent) {
    if (zoom <= 1) return;
    isDragging = true;
    dragStart = { x: event.clientX, y: event.clientY, panX, panY };
    event.preventDefault();
  }

  // LEARN: bound on <svelte:window>, so Svelte removes them when the island
  // unmounts. The old code attached these per image and never cleaned up.
  function onWindowMove(event: MouseEvent) {
    if (!isDragging) return;
    panX = dragStart.panX + (event.clientX - dragStart.x);
    panY = dragStart.panY + (event.clientY - dragStart.y);
  }
  const endDrag = () => (isDragging = false);

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) closeLightbox();
  }

  // LEARN: `scale` starts at the trigger's centre so the panel appears to grow
  // out of the thumbnail. Replaces a double-rAF + setTimeout dance that had to
  // clear its own inline styles afterwards.
  function growFromTrigger(_node: Element) {
    return {
      duration: reduceMotion ? 0 : 350,
      easing: easeSnappy,
      css: (t: number) =>
        `transform-origin: ${origin.x}px ${origin.y}px; transform: scale(${0.2 + 0.8 * t}); opacity: ${t};`,
    };
  }

  $effect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onmousemove={onWindowMove} onmouseup={endDrag} onkeydown={onKeydown} />

<!-- Thumbnail.
     LEARN: the <picture>/<img> is emitted here directly rather than through the
     shared ui/ components, and is NOT wrapped in anything. WorkImageGrid's layout
     keys off `> picture:only-of-type` / `> img:only-of-type`, so any wrapper
     element — even display:contents — would break the single-image grid case.
     Svelte's {#if} anchors are comments, which don't count as siblings.

     The keydown handler mirrors the original, which was unreachable in practice:
     an <img> is not focusable without tabindex, and adding one would create a tab
     stop per image (63 on the CODM essay). Left as found — making these
     keyboard-openable is a design decision, not a port. -->
{#if picture && !picture.img.passthrough}
  <picture bind:this={triggerEl} onclick={openLightbox} onkeydown={onTriggerKeydown} role="presentation">
    {#each picture.sources as source (source.type)}
      <source srcset={source.srcset} type={source.type} />
    {/each}
    <img
      src={picture.img.src}
      {alt}
      loading="lazy"
      decoding="async"
      fetchpriority="auto"
      width={picture.img.width}
      height={picture.img.height}
      class={thumbClass}
    />
  </picture>
{:else if image?.passthrough || picture?.img.passthrough}
  <img
    bind:this={triggerEl}
    src={(image ?? picture?.img)?.src}
    {alt}
    class={thumbClass}
    onclick={openLightbox}
    onkeydown={onTriggerKeydown}
    role="presentation"
  />
{:else if image}
  <img
    bind:this={triggerEl}
    src={image.src}
    {alt}
    loading="lazy"
    decoding="async"
    fetchpriority="auto"
    width={image.width}
    height={image.height}
    class={thumbClass}
    onclick={openLightbox}
    onkeydown={onTriggerKeydown}
    role="presentation"
  />
{/if}

{#if open}
  <!-- Lightbox -->
  <div
    use:portal
    class="image-lightbox fixed inset-0 backdrop-blur-xl bg-white/95 z-50 flex items-center justify-center p-4 px-20"
    data-image-lightbox
    role="presentation"
    transition:fade={{ duration: reduceMotion ? 0 : 250 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) closeLightbox();
    }}
  >
    <div
      class="image-panel w-full max-w-5xl max-h-[100vh] flex flex-col items-center justify-center relative"
      data-image-panel
      transition:growFromTrigger
    >
      <button
        type="button"
        class="absolute -top-5 right-0 z-10 text-white bg-red-400 rounded-full p-3 hover:text-gray-300 transition-colors cursor-pointer group"
        aria-label="Close"
        data-image-close
        onclick={closeLightbox}
      >
        <svg class="w-8 h-8 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div class="w-full flex flex-col gap-4 items-center max-h-[100vh] text-left">
        <!-- Zoomable image container -->
        <div
          class="zoom-container w-full md:w-[80%] overflow-hidden rounded-lg relative select-none"
          data-zoom-container
          role="presentation"
          style={`cursor: ${zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
          onmousedown={startDrag}
        >
          <img
            src={fullSrc}
            {alt}
            class="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl block"
            data-zoom-image
            style={`transform: ${imgTransform}; transition: ${isDragging ? 'none' : 'transform 0.15s ease'};`}
          />
        </div>

        <!-- Zoom slider -->
        <div class="flex items-center gap-3 md:w-[1/3]">
          <span class="font-sans text-lg text-syoro shrink-0">1×</span>
          <input
            type="range"
            min="100"
            max="400"
            value={zoom * 100}
            step="4"
            class="flex-1 accent-konpeki cursor-pointer"
            data-zoom-slider
            aria-label="Zoom level"
            oninput={onSliderInput}
          />
          <!-- LEARN: the live readout the old code tried to update and never
               could — it queried [data-zoom-label], which existed nowhere. -->
          <span class="font-sans text-lg text-syoro w-8 text-right shrink-0" data-zoom-label>
            {zoom.toFixed(1)}×
          </span>
          {#if zoom > 1}
            <button
              type="button"
              class="font-sans text-lg text-konpeki border border-konpeki rounded px-2 py-1 shrink-0 hover:bg-konpeki hover:text-white transition-colors"
              data-zoom-reset
              aria-label="Reset zoom"
              onclick={resetZoom}>Reset</button
            >
          {/if}
        </div>

        {#if title || description}
          <div class="text-syoro w-full text-center mt-2">
            {#if title}<h3 class="text-4xl font-sans font-bold">{title}</h3>{/if}
            {#if description}<p class="text-2xl text-syoro font-serif mt-4">{description}</p>{/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.image-lightbox img) {
    height: auto;
    border-radius: 8px;
  }
  [data-zoom-image] {
    transform-origin: center center;
    will-change: transform;
  }
</style>
