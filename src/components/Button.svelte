<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    class?: string;
    variant?: 'primary' | 'secondary';
    /**
     * LEARN: Astro.url doesn't exist inside a Svelte component — it's part of the
     * Astro global, which only the .astro renderer provides. The parent passes the
     * current pathname down as a plain prop instead.
     */
    pathname?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    href,
    class: className,
    variant = 'secondary',
    pathname = '',
    children,
    ...rest
  }: Props = $props();

  const current = $derived(pathname.replace(import.meta.env.BASE_URL, ''));
  const subpath = $derived(current.match(/[^\/]+/g));
  const isActive = $derived(href === current || href === '/' + (subpath?.[0] || ''));
</script>

<a
  {href}
  class={[
    className,
    { active: isActive },
    'group',
    variant === 'primary'
      ? 'bg-konpeki text-backgroundcolor hover:outline-dashed hover:outline-3 hover:outline-offset-8 hover:outline-konpeki border-2 border-konpeki font-sans'
      : 'text-konpeki hover:border-konpeki border-2 font-sans',
    'font-bold py-4 md:text-xl sm:text-lg text-base md:px-8 px-4 rounded-xl',
    // LEARN: press feedback over infinite "shiver" — :active scale(0.97) with a
    // strong ease-out gives instant "the UI heard you" feedback. Transition only
    // transform so hover outline/color changes don't get caught in the easing.
    'transition-transform duration-[180ms] ease-snappy active:scale-[0.97]',
    'uppercase relative inline-flex items-center gap-0',
  ]}
  {...rest}
>
  <!-- Arrow slides in from the left on hover -->
  <span
    class="absolute left-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-[transform,opacity] duration-200 ease-snappy pointer-events-none select-none"
    aria-hidden="true">→</span
  >
  <!-- Ensures text is centered even with arrow -->
  <span class="group-hover:translate-x-5 transition-transform duration-200 ease-snappy">{@render children?.()}</span>
</a>
