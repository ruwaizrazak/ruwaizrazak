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
<aside class="sidenote my-7 flex flex-col gap-2 border-l border-l-syoro/25 py-1 pl-[18px]" role="note">
  <span class="sidenote-label font-mono text-label uppercase tracking-eyebrow text-muted">{label}</span>
  <div class="sidenote-body font-serif text-note leading-[1.55] text-muted">
    {@render children?.()}
  </div>
</aside>
