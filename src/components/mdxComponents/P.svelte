<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    className?: string;
    children?: Snippet;
  }

  let { className, children }: Props = $props();
</script>

<p class={[
  "text-base sm:text-lg md:text-xl lg:text-2xl text-stone-600",
  className
]}>
  {@render children?.()}
</p>
