<script lang="ts">
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  // LEARN: Astro components read the current path from the `Astro` global, but a
  // Svelte component can't — so the parent passes `pathname` (Astro.url.pathname)
  // as a prop for active-link detection. No prop = simply never "active".
  interface Props extends HTMLAnchorAttributes {
    variant?: 'primary' | 'secondary';
    pathname?: string;
    class?: string;
    children?: Snippet;
  }

  let { href, class: className, variant = 'secondary', pathname = '', children, ...props }: Props = $props();

  const isActive = $derived(href === pathname || href === '/' + (pathname.match(/[^\/]+/g)?.[0] || ''));
</script>

<a
  {href}
  class={[
    className,
    { active: isActive },
    'group',
    variant === 'primary'
      ? 'bg-konpeki text-backgroundcolor hover:outline-dashed hover:outline-3 hover:outline-offset-8 hover:outline-konpeki border-2 border-konpeki font-sans hover:animate-shiver'
      : 'text-konpeki hover:border-konpeki border-2 font-sans hover:animate-shiver',
    'font-bold',
    'py-4',
    'md:text-xl',
    'sm:text-lg',
    'text-base',
    'md:px-8',
    'px-4',
    'text-base',
    'rounded-xl',
    'hover:rounded-2xl',
    'transition-all',
    'duration-200',
    'ease-in-out',
    'uppercase',
    'relative',
    'inline-flex',
    'items-center',
    'gap-0'
  ]}
  {...props}
  type="button"
>
  <!-- Arrow slides in from the left on hover -->
  <span
    class="absolute left-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-in-out pointer-events-none select-none"
    aria-hidden="true"
  >→</span>
  <span class="group-hover:translate-x-5 transition-all">{@render children?.()}</span>
</a>
