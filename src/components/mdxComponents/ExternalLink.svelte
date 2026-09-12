<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props { href: string; children?: Snippet }
  let { href, children }: Props = $props();

  // LEARN: import.meta.env.SITE comes from astro.config.mjs. It is a Vite-level
  // env value, not part of the Astro global, so it resolves inside Svelte too.
  const domain = import.meta.env.SITE;

  const isExternal = $derived(
    !href.includes(domain) && !href.startsWith('/') && !href.startsWith('#'),
  );
</script>

<!-- add attributes and maintain a slot for the link text -->
<a
  {href}
  target={isExternal ? '_blank' : undefined}
  rel={isExternal ? 'noopener noreferrer' : undefined}>{@render children?.()}</a
>
