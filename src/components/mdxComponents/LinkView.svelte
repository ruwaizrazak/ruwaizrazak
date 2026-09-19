<script lang="ts">
  import type { Snippet } from 'svelte';
  import ExternalLinkIcon from '../ui/ExternalLinkIcon.svelte';

  /**
   * Presentation half of the Link pair.
   *
   * LEARN: Link.astro keeps the build-time work (a network fetch per href via
   * resolveTooltipMeta) because Svelte components cannot await during render.
   * Everything here is pure markup + styles driven by already-resolved props.
   */
  interface Props {
    href?: string;
    class?: string;
    /** Pre-rendered tooltip markup; empty string means "no tooltip for this link". */
    tooltipHTML?: string;
    isExternal?: boolean;
    isActive?: boolean;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    href,
    class: className,
    tooltipHTML = '',
    isExternal = false,
    isActive = false,
    children,
    ...rest
  }: Props = $props();

  const hasTooltip = $derived(tooltipHTML !== '');
</script>

<!-- LEARN: inline + text-decoration, so long links wrap with the sentence and the
     underline draws under every line (the old ::before bar could only draw one). -->
<span
  class="relative"
  data-link-tooltip={hasTooltip ? '' : undefined}
  data-tippy-content={hasTooltip ? tooltipHTML : undefined}
>
  <a
    {href}
    class={[
      'styled-link group',
      'cursor-pointer outline-none font-medium font-serif underline decoration-1 underline-offset-[0.2em]',
      'transition-[color,text-decoration-color] duration-200 ease-snappy hover:text-konpeki hover:decoration-konpeki hover:decoration-2 motion-reduce:transition-none',
      'focus:outline-2 focus:outline-[var(--focus-color,darkblue)] focus:rounded-sm focus:outline-offset-2 dark:focus:outline-[var(--focus-color-dark,lightblue)]',
      {
        'text-prose-link decoration-prose-link/40': !isActive,
        'styled-link--active text-konpeki decoration-konpeki decoration-2 !font-semibold': isActive,
      },
      className,
    ]}
    target={isExternal ? '_blank' : undefined}
    rel={isExternal ? 'noopener noreferrer' : undefined}
    {...rest}
  >
    <span class="link-text">{@render children?.()}</span>
    {#if isExternal}
      <span
        class="external-icon inline-block ml-1 text-[0.8em] leading-none transition-transform duration-200 ease-in-out group-hover:translate-x-px group-hover:-translate-y-px motion-reduce:transition-none"
        aria-hidden="true"
      >
        <ExternalLinkIcon />
      </span>
    {/if}
  </a>
</span>
