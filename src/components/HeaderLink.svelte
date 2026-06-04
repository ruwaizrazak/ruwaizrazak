<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  // LEARN: `pathname` (Astro.url.pathname) is passed by the parent for active-link
  // detection, since Svelte components have no access to the Astro global.
  interface Props extends HTMLAnchorAttributes {
    pathname?: string;
    class?: string;
    children?: Snippet;
  }

  let { href, class: className, pathname = '', children, ...props }: Props = $props();

  const isActive = $derived(href === pathname || href === '/' + (pathname.match(/[^\/]+/g)?.[0] || ''));
</script>

<a {href}
  class={[
    "text-base",
    "uppercase",
    "font-semibold",
    className,
    { active: isActive },
    "motion-safe:hover:scale-[1.02] motion-safe:active:scale-95",
    "motion-safe:transform-gpu motion-safe:transition-all duration-200"
  ]}
  {...props}>
  {@render children?.()}
</a>

<style>
	a {
		text-decoration: none;
    transform-origin: center;
    color:var(--color-slate-800) !important;
	}
  a:hover {
    text-decoration-skip-ink: none;
    background-color:var(--accent) !important;
    text-decoration-thickness: .05em;
    animation: .2s 1 forwards linkAnimation;
  }
	a.active {
		text-decoration: line-through;
    text-decoration-style: wavy !important;
    text-decoration-thickness: .05em;
    pointer-events: none;
	}
</style>
