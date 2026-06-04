<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    imageSrc: string;
    alt?: string;
    imageWidth?: string;
    imagePercent?: number;
    children?: Snippet;
  }

  let {
    imageSrc,
    alt = '',
    imageWidth = 'md:w-1/5',
    imagePercent = 20,
    children,
  }: Props = $props();
</script>

<div class="w-full mx-auto flex flex-col md:flex-row gap-6 my-8 items-center bg-stone-100 border border-stone-200 p-6 rounded-lg self-center">
  <div class="p-5" style={`width: 100%; @media (min-width: 768px) { width: ${imagePercent}%; }`}>
    <img src={imageSrc} {alt} class="w-full rounded-lg p-0 m-0" />
  </div>
  <div class="space-y-4 flex flex-col justify-center text-base/6 md:text-lg/8" style={`width: 100%; @media (min-width: 768px) { width: ${100 - imagePercent}%; }`}>
    {@render children?.()}
  </div>
</div>
