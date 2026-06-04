<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="sidenote p-4 border-l-2 border-yellow-500 font-mono text-sm">
  {@render children?.()}
</div>

<!-- LEARN: :global() preserves the original `is:global` behavior — the .sidenote
     rule must apply even though Svelte would otherwise scope it per-component. -->
<style>
  :global(.sidenote) {
    float: right;
    clear: right;
    margin-right: -33%;
    width: 250px;
    margin-top: 0;
    margin-bottom: 1rem;
    opacity: 0.8;
    line-height: 1.3;
    vertical-align: baseline;
    position: relative;
    background-color: var(--color-gray-50);
  }

  @media (max-width: 1500px) {
    :global(.sidenote) {
      float: none;
      margin: 1rem 0;
      width: 100%;
    }
  }
</style>
