<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    className?: string;
    children?: Snippet;
  }

  let { className, children }: Props = $props();
</script>

<ul class={[className]}>
  {@render children?.()}
</ul>

<style>
  ul {
    margin-block-start: 0em;
  }
</style>
