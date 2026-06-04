<script lang="ts">
  // LEARN: Island (client:visible). The wrapper height tracks scroll for the
  // full-bleed 16:9 breakout effect. Logic runs in onMount against the component's
  // own element (bind:this) instead of a global querySelector + dataset guard.
  import { onMount } from 'svelte';

  interface Props {
    src: string;
    title?: string;
  }

  let { src, title = 'YouTube video player' }: Props = $props();

  let wrapper: HTMLDivElement;

  onMount(() => {
    let initialHeightPx = 0.5625 * window.innerWidth; // 16:9 of viewport width
    let ticking = false;

    function updateHeight() {
      const top = wrapper.getBoundingClientRect().top;
      wrapper.style.height = Math.max(0, initialHeightPx + top) + 'px';
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => { updateHeight(); ticking = false; });
      }
    }
    function onResize() {
      initialHeightPx = 0.5625 * window.innerWidth;
      updateHeight();
    }

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
    height: 56.25vw; /* fallback before script runs */
  }
  .video-breakout__iframe {
    height: 56.25vw; /* 16:9 of viewport width — video keeps aspect, wrapper clips on scroll */
  }
</style>
