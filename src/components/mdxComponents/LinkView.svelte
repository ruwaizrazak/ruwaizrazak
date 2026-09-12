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

<span
  class="inline-block relative"
  data-link-tooltip={hasTooltip ? '' : undefined}
  data-tippy-content={hasTooltip ? tooltipHTML : undefined}
>
  <a
    {href}
    class={[
      'styled-link',
      'cursor-pointer relative whitespace-nowrap no-underline outline-none pb-1 text-[var(--color-link)] font-medium font-serif',
      'focus:outline-2 focus:outline-[var(--focus-color,darkblue)] focus:rounded-sm focus:outline-offset-2 dark:focus:outline-[var(--focus-color-dark,lightblue)]',
      { 'styled-link--active text-[var(--color-konpeki)] !font-semibold': isActive },
      className,
    ]}
    target={isExternal ? '_blank' : undefined}
    rel={isExternal ? 'noopener noreferrer' : undefined}
    {...rest}
  >
    <span
      class="link-text inline-block transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,1,0.8,1)]"
    >{@render children?.()}</span>
    {#if isExternal}
      <span
        class="external-icon inline-block ml-1 text-[0.8em] leading-none transition-transform duration-200 ease-in-out"
        aria-hidden="true"
      >
        <ExternalLinkIcon />
      </span>
    {/if}
  </a>
</span>

<style>
  .styled-link:hover .external-icon {
    transform: translate(1px, -1px);
  }

  /* Animated underline effect */
  .styled-link::before {
    content: '';
    transform-origin: 50% 100%;
    background: var(--color-link);
    transition:
      clip-path 0.3s cubic-bezier(0.2, 1, 0.8, 1),
      transform 0.3s cubic-bezier(0.2, 1, 0.8, 1),
      background-color 0.3s ease;
    position: absolute;
    width: 100%;
    height: 1px;
    top: 95%;
    left: 0;
    pointer-events: none;
    clip-path: polygon(0% 0%, 0% 100%, 0 100%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%, 100% 100%, 100% 0%);
  }

  .styled-link:hover::before {
    transform: translate3d(0, 2px, 0) scale3d(1, 2, 1);
    background: var(--color-konpeki);
    clip-path: polygon(0% 0%, 0% 100%, 100% 100%, 50% 0, 50% 0, 50% 100%, 50% 100%, 0 100%, 100% 100%, 100% 0%);
  }

  .styled-link:hover .link-text {
    transform: translate3d(0, -2px, 0);
    color: var(--color-konpeki);
  }

  .styled-link--active::before {
    background: var(--color-konpeki);
    height: 2px;
  }

  .styled-link:active .link-text {
    transform: translate3d(0, 0, 0);
    transition-duration: 0.1s;
  }

  @media (prefers-reduced-motion: reduce) {
    .styled-link::before,
    .link-text,
    .external-icon {
      transition: none !important;
    }

    .styled-link:hover .link-text {
      transform: none;
    }

    .styled-link:hover::before {
      transform: none;
    }
  }
</style>
