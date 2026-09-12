<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<main class="w-full px-20">
  {@render children?.()}
</main>
