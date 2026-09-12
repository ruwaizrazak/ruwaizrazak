<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    class?: string;
    /** LEARN: see Button.svelte — Astro.url is unavailable here, so pathname is a prop. */
    pathname?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { href, class: className, pathname = '', children, ...rest }: Props = $props();

  const current = $derived(pathname.replace(import.meta.env.BASE_URL, ''));
  const subpath = $derived(current.match(/[^\/]+/g));
  const isActive = $derived(href === current || href === '/' + (subpath?.[0] || ''));
</script>

<a
  {href}
  class={[
    'text-base uppercase font-semibold',
    className,
    { active: isActive },
    'motion-safe:hover:scale-[1.02] motion-safe:active:scale-95',
    'motion-safe:transform-gpu motion-safe:transition-transform duration-200 ease-snappy',
  ]}
  {...rest}
>
  {@render children?.()}
</a>

<style>
  a {
    text-decoration: none;
    transform-origin: center;
    color: var(--color-slate-800) !important;
  }
  a:hover {
    text-decoration-skip-ink: none;
    background-color: var(--accent) !important;
    text-decoration-thickness: 0.05em;
    /* LEARN: `linkAnimation` is not defined in any stylesheet, so this line is
       currently a no-op. Carried over verbatim to keep behaviour identical —
       define the keyframes or drop the line, but don't assume it does anything. */
    animation: 0.2s 1 forwards linkAnimation;
  }
  a.active {
    text-decoration: line-through;
    text-decoration-style: wavy !important;
    text-decoration-thickness: 0.05em;
    pointer-events: none;
  }
</style>
