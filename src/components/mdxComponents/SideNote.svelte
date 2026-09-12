<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<div class="sidenote p-4 border-l-2 border-yellow-500 font-mono text-sm">
  {@render children?.()}
</div>

<!-- LEARN: this was <style is:global> in Astro, but `.sidenote` only ever exists on
     the element right above — nothing else in the project references the class — so
     Svelte's scoped styles cover it and keep the rule from leaking. -->
<style>
  .sidenote {
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
    .sidenote {
      float: none;
      margin: 1rem 0;
      width: 100%;
    }
  }
</style>
