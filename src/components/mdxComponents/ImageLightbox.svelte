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
  let isGesturing = $state(false);
  let reduceMotion = $state(false);

  let triggerEl = $state<HTMLElement>();
  let origin = $state({ x: 0, y: 0 });

  interface Point {
    x: number;
    y: number;
  }

  interface PanAnchor extends Point {
    pointerId: number;
    panX: number;
    panY: number;
  }

  interface PinchAnchor {
    distance: number;
    zoom: number;
    midpoint: Point;
    panX: number;
    panY: number;
  }

  const activePointers = new Map<number, Point>();
  let panAnchor: PanAnchor | null = null;
  let pinchAnchor: PinchAnchor | null = null;

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
    clearGesture();
    open = false;
    triggerEl?.focus?.();
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  const clampZoom = (value: number) => Math.min(4, Math.max(1, value));
  const roundZoom = (value: number) => Math.round(value * 100) / 100;

  function stepZoom(direction: -1 | 1) {
    const nextZoom = clampZoom(roundZoom(zoom + direction * 0.25));
    if (nextZoom === 1) {
      resetZoom();
      return;
    }
    zoom = nextZoom;
  }

  function formatZoom(value: number) {
    return `${value.toFixed(2).replace(/0$/, '')}×`;
  }

  function getGesturePair() {
    return Array.from(activePointers.entries()).slice(0, 2);
  }

  function getDistance(first: Point, second: Point) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function getMidpoint(first: Point, second: Point): Point {
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
  }

  function beginPinch() {
    const pair = getGesturePair();
    if (pair.length < 2) return;
    const [, first] = pair[0];
    const [, second] = pair[1];
    pinchAnchor = {
      distance: Math.max(getDistance(first, second), 1),
      zoom,
      midpoint: getMidpoint(first, second),
      panX,
      panY,
    };
    panAnchor = null;
  }

  function beginPan(pointerId: number, point: Point) {
    panAnchor = { pointerId, ...point, panX, panY };
    pinchAnchor = null;
  }

  function clearGesture() {
    activePointers.clear();
    panAnchor = null;
    pinchAnchor = null;
    isGesturing = false;
  }

  function onPointerDown(event: PointerEvent) {
    const container = event.currentTarget as HTMLElement;
    try {
      container.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events do not create a capturable active pointer.
    }

    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    isGesturing = true;
    if (activePointers.size >= 2) beginPinch();
    else if (zoom > 1) beginPan(event.pointerId, { x: event.clientX, y: event.clientY });
    event.preventDefault();
  }

  function onPointerMove(event: PointerEvent) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size >= 2 && pinchAnchor) {
      const pair = getGesturePair();
      const [, first] = pair[0];
      const [, second] = pair[1];
      const midpoint = getMidpoint(first, second);
      const nextZoom = clampZoom(
        pinchAnchor.zoom * (getDistance(first, second) / pinchAnchor.distance),
      );

      zoom = nextZoom;
      if (nextZoom === 1) {
        panX = 0;
        panY = 0;
      } else {
        panX = pinchAnchor.panX + midpoint.x - pinchAnchor.midpoint.x;
        panY = pinchAnchor.panY + midpoint.y - pinchAnchor.midpoint.y;
      }
      return;
    }

    if (activePointers.size === 1 && zoom > 1 && panAnchor?.pointerId === event.pointerId) {
      panX = panAnchor.panX + event.clientX - panAnchor.x;
      panY = panAnchor.panY + event.clientY - panAnchor.y;
    }
  }

  function onPointerEnd(event: PointerEvent) {
    if (!activePointers.has(event.pointerId)) return;
    const wasPinching = activePointers.size >= 2;
    activePointers.delete(event.pointerId);

    const container = event.currentTarget as HTMLElement;
    try {
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The browser may already have released a cancelled pointer.
    }

    if (activePointers.size >= 2) {
      beginPinch();
      return;
    }

    if (activePointers.size === 1) {
      const [pointerId, point] = activePointers.entries().next().value as [number, Point];
      // LEARN: re-anchoring the survivor prevents a jump when pinch becomes pan.
      if (wasPinching && zoom > 1) beginPan(pointerId, point);
      isGesturing = true;
      return;
    }

    panAnchor = null;
    pinchAnchor = null;
    isGesturing = false;
  }

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

<svelte:window onkeydown={onKeydown} />

<!-- Thumbnail.
     LEARN: the <picture>/<img> is emitted here directly rather than through the
     shared ui/ components, and is NOT wrapped in anything. WorkImageGrid now
     detects the surrounding astro-island, while its grid item remains this direct
     <picture>/<img> because Astro gives the island `display: contents`.

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
    class="fixed inset-0 z-50 grid grid-rows-[minmax(0,1fr)_auto] bg-[color-mix(in_srgb,var(--color-backgroundcolor)_94%,transparent)] p-6 backdrop-blur-[20px]"
    data-image-lightbox
    role="presentation"
    transition:fade={{ duration: reduceMotion ? 0 : 250 }}
    onclick={(e) => {
      if (e.target === e.currentTarget) closeLightbox();
    }}
  >
    <div
      class="col-start-1 row-start-1 row-span-2 grid min-h-0 grid-rows-[minmax(0,1fr)_auto]"
      data-image-panel
      transition:growFromTrigger
    >
      <!-- LEARN: min-height:0 lets the 1fr row shrink so controls stay on-screen. -->
      <div class="relative flex min-h-0 items-center justify-center" data-image-stage>
        <button
          type="button"
          class="absolute right-0 top-0 z-10 flex size-[52px] cursor-pointer items-center justify-center rounded-full border border-card-border bg-cardbg text-syoro shadow-[0_2px_10px_color-mix(in_srgb,var(--color-syoro)_6%,transparent)] transition-[color,border-color,transform] duration-180 ease-[var(--ease-snappy)] hover:rotate-90 hover:border-[color-mix(in_srgb,var(--color-link)_24%,var(--color-card-border))] hover:text-konpeki focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          aria-label="Close"
          data-image-close
          onclick={closeLightbox}
        >
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- LEARN: touch-action:none keeps native scrolling/page zoom from
             taking over before this captured pointer gesture can run. -->
        <div
          class="flex h-full w-full max-w-[1000px] touch-none select-none items-center justify-center overflow-hidden rounded-xl"
          data-zoom-container
          role="presentation"
          style={`cursor: ${zoom > 1 ? (isGesturing ? 'grabbing' : 'grab') : 'default'}`}
          onpointerdown={onPointerDown}
          onpointermove={onPointerMove}
          onpointerup={onPointerEnd}
          onpointercancel={onPointerEnd}
        >
          <img
            src={fullSrc}
            {alt}
            class="block max-h-full max-w-full select-none rounded-xl border border-card-border object-contain shadow-[0_18px_50px_color-mix(in_srgb,var(--color-syoro)_14%,transparent)] [transform-origin:center_center] [will-change:transform]"
            data-zoom-image
            draggable="false"
            style={`transform: ${imgTransform}; transition: ${isGesturing ? 'none' : 'transform 260ms var(--ease-snappy)'};`}
          />
        </div>
      </div>

      <div class="flex flex-wrap items-end justify-between gap-8 pt-5" data-image-toolbar>
        {#if title || description}
          <div class="flex min-w-0 max-w-[60ch] flex-[1_1_320px] flex-col gap-1.5 text-left text-syoro" data-image-caption>
            {#if title}<h3 class="font-serif text-xl font-medium">{title}</h3>{/if}
            {#if description}<p class="font-serif text-base leading-[1.55]">{description}</p>{/if}
          </div>
        {/if}

        <div
          class="flex shrink-0 items-center gap-2 rounded-full border border-card-border bg-cardbg p-1.5 shadow-[0_2px_14px_color-mix(in_srgb,var(--color-syoro)_7%,transparent)]"
          data-zoom-controls
        >
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full text-syoro transition-colors duration-180 hover:bg-[color-mix(in_srgb,var(--color-syoro)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:opacity-30"
            data-zoom-out
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onclick={() => stepZoom(-1)}
          >
            <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 12h14" />
            </svg>
          </button>

          <span
            class="w-[52px] text-center font-mono text-[13px] tracking-[0.06em] text-syoro [font-variant-numeric:tabular-nums]"
            data-zoom-label
          >
            {formatZoom(zoom)}
          </span>

          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-full text-syoro transition-colors duration-180 hover:bg-[color-mix(in_srgb,var(--color-syoro)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-default disabled:opacity-30"
            data-zoom-in
            aria-label="Zoom in"
            disabled={zoom >= 4}
            onclick={() => stepZoom(1)}
          >
            <svg class="size-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <span class="mx-0.5 h-6 w-px bg-card-border" aria-hidden="true"></span>

            <button
              type="button"
              class="h-10 rounded-full px-4 font-sans text-[15px] font-medium uppercase tracking-[0.1em] text-konpeki transition-colors duration-180 hover:bg-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              data-zoom-reset
              aria-label="Reset zoom"
              onclick={resetZoom}
            >Reset</button>
        </div>
      </div>
    </div>
  </div>
{/if}
