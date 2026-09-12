<script lang="ts">
  interface Props {
    src: string;
    title?: string;
  }
  let { src, title = 'YouTube video player' }: Props = $props();

  /**
   * Full-bleed video breakout: keeps the wrapper at a 16:9 height of the viewport
   * width and shrinks it as it scrolls past the top, clipping the iframe.
   *
   * LEARN: kept as JS rather than a CSS scroll-timeline. The height is
   * `max(0, 16:9-of-viewport + rect.top)` — a clamped function of the element's
   * own offset, not a clean 0–100% progression over a view() range, so
   * animation-timeline would change the curve rather than reproduce it.
   *
   * LEARN: the old scripts/videoBreakout.ts added its scroll + resize listeners
   * INSIDE a per-element loop and never removed them. The per-element
   * `dataset.videoBreakoutInited` guard stopped an element being double-bound,
   * but elements from previous pages still leaked their listener pair on every
   * navigation. $effect's cleanup removes them with the island.
   */
  let wrapper = $state<HTMLDivElement>();
  let height = $state('');

  $effect(() => {
    const el = wrapper;
    if (!el) return;

    let initialHeightPx = 0.5625 * window.innerWidth; // 16:9 of viewport width
    let ticking = false;

    const updateHeight = () => {
      const top = el.getBoundingClientRect().top;
      height = `${Math.max(0, initialHeightPx + top)}px`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateHeight();
        ticking = false;
      });
    };

    const onResize = () => {
      initialHeightPx = 0.5625 * window.innerWidth;
      updateHeight();
    };

    updateHeight();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  });
</script>

<div
  bind:this={wrapper}
  class="video-breakout w-screen max-w-[100vw] ml-[calc(50%-50vw)] mb-8 rounded-none overflow-hidden"
  data-video-breakout
  style:height
>
  <iframe
    {src}
    {title}
    class="video-breakout__iframe w-full rounded-lg"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</div>

<style>
  .video-breakout {
    height: 56.25vw; /* fallback before the island hydrates */
  }
  .video-breakout__iframe {
    height: 56.25vw; /* 16:9 of viewport width — video keeps aspect, wrapper clips on scroll */
  }
</style>
