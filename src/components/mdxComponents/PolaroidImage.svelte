<script lang="ts">
  // LEARN: Island (client:visible). Polaroid thumbnail that opens a fullscreen
  // lightbox. Uses Svelte refs (bind:this) + reactive `open` state instead of the
  // old getElementById/define:vars uid handshake.
  // LEARN: open/close uses Svelte's built-in svelte/transition (zero deps, no GSAP) —
  // backdrop fades, image scales in. close is slightly faster (motion-design rule).
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  // Svelte transitions don't auto-respect reduced motion — gate to 0ms (snap) when set.
  // Read lazily: transitions only ever run client-side (open starts false, flips on click).
  const reduce = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  interface Props {
    src: string;
    alt: string;
    caption?: string;
    width?: string;
    rotate?: number | 'random';
    className?: string;
  }

  let { src, alt, caption, width = '100%', rotate = 0, className = '' }: Props = $props();

  // Build-time-ish rotation (computed once at mount-render, like the old SSR value).
  const rotation = $derived(rotate === 'random' ? (Math.random() - 0.5) * 6 : (typeof rotate === 'number' ? rotate : 0));

  let open = $state(false);

  function show() {
    open = true;
    document.body.style.overflow = 'hidden';
  }
  function hide() {
    open = false;
    document.body.style.overflow = '';
  }

  onMount(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) hide(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  });
</script>

<div
  class={`transition-transform duration-300 hover:rotate-0 my-5 mx-auto ${className}`}
  style={`max-width: ${width}; transform: rotate(${rotation}deg);`}
>
  <button
    type="button"
    class="bg-white p-3 shadow-2xl hover:shadow-3xl transition-shadow duration-300 mx-auto cursor-pointer block w-full text-left border-0"
    onclick={show}
    aria-label="Open image"
  >
    <img {src} {alt} loading="lazy" class="w-full h-auto mx-auto" />
    {#if caption}
      <div class="mt-3 text-center px-2">
        <p class="text-syoro !font-handwriting !text-xl sm:text-sm">{caption}</p>
      </div>
    {/if}
  </button>
</div>

<!-- Lightbox Overlay -->
{#if open}
  <div
    class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    onclick={(e) => { if (e.target === e.currentTarget) hide(); }}
    role="presentation"
    in:fade={{ duration: reduce() ? 0 : 200 }}
    out:fade={{ duration: reduce() ? 0 : 160 }}
  >
    <button
      class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      aria-label="Close"
      onclick={hide}
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <div
      class="max-w-7xl max-h-[90vh] flex flex-col items-center"
      in:scale={{ duration: reduce() ? 0 : 220, start: 0.92, easing: cubicOut }}
      out:scale={{ duration: reduce() ? 0 : 150, start: 0.96, easing: cubicOut }}
    >
      <img {src} {alt} class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
      {#if caption}
        <p class="text-white text-lg mt-4 text-center max-w-2xl">{caption}</p>
      {/if}
    </div>
  </div>
{/if}
