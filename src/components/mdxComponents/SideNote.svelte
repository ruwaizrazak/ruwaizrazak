<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    label?: string;
    children?: Snippet;
  }

  let { label = 'Side note', children }: Props = $props();
</script>

<!-- LEARN: SideNote lost its float because the new 760px reading measure has no
     safe margin column; inline notes keep the reading flow intact on every width. -->
<aside class="sidenote" role="note">
  <span class="sidenote-label">{label}</span>
  <div class="sidenote-body">
    {@render children?.()}
  </div>
</aside>

<style>
  .sidenote {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 28px 0;
    border-left: 1px solid color-mix(in srgb, var(--color-syoro) 25%, transparent);
    padding: 4px 0 4px 18px;
  }

  .sidenote-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .sidenote-body {
    font-family: var(--font-serif);
    font-size: 17px;
    line-height: 1.55;
    color: var(--color-muted);
  }
</style>
