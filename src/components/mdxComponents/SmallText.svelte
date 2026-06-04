<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    className?: string;
    children?: Snippet;
  }

  let { className, children }: Props = $props();
</script>

<p class={[
  "prose dark:prose-invert max-w-4xl prose-stone text-xs md:text-sm",
  className
]}>
  {@render children?.()}
</p>
