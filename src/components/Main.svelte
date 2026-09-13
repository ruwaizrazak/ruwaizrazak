<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<!-- LEARN: Main is only consumed by AboutLayout, so it can own the About design
     container directly instead of forcing the page to break out of shared padding. -->
<main class="mx-auto w-full max-w-[1280px] px-5 sm:px-7">
  {@render children?.()}
</main>
