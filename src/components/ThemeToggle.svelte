<script lang="ts">
  import { onMount } from 'svelte';
  import { getTheme, applyTheme, cycleTheme, initThemeListener } from '../scripts/theme-toggle';

  /**
   * LEARN: this island replaces ~30 lines of guard machinery in theme-toggle.ts.
   * The old code ran through initOnLoad(), which fires on BOTH DOMContentLoaded
   * and astro:page-load — so it executed twice on first load and needed:
   *   - btn.dataset.themeToggleBound  (the button is a fresh element per navigation)
   *   - a module-level mediaListenerWired flag (window survives navigation)
   *   - a syncToggleState() that re-read the DOM to mirror state back onto the button
   * A component owns its own lifecycle: the listener is torn down on unmount, and
   * the toggled class is derived from state instead of being pushed into the DOM.
   */
  let isDark = $state(false);

  const sync = () => {
    isDark = document.documentElement.classList.contains('dark');
  };

  onMount(() => {
    // The inline pre-paint script in BaseHead already set the class; re-apply so
    // this island's state agrees with it, then mirror it onto the button.
    applyTheme(getTheme());
    sync();
    return initThemeListener(sync);
  });

  function handleClick() {
    cycleTheme();
    sync();
  }
</script>

<button
  id="theme-toggle"
  type="button"
  class="theme-toggle p-2 rounded-full text-syoro hover:bg-yellow-500 dark:hover:bg-gray-700 transition-[transform,background-color] duration-[140ms] ease-snappy active:scale-[0.95]"
  class:theme-toggle--toggled={isDark}
  title="Toggle theme"
  aria-label="Toggle theme"
  onclick={handleClick}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    width="2em"
    height="2em"
    fill="currentColor"
    stroke-linecap="round"
    class="theme-toggle__classic"
    viewBox="0 0 32 32"
  >
    <clipPath id="theme-toggle__classic__cutout">
      <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
    </clipPath>
    <g clip-path="url(#theme-toggle__classic__cutout)">
      <circle cx="16" cy="16" r="9.34" />
      <g stroke="currentColor" stroke-width="1.5">
        <path d="M16 5.5v-4" />
        <path d="M16 30.5v-4" />
        <path d="M1.5 16h4" />
        <path d="M26.5 16h4" />
        <path d="m23.4 8.6 2.8-2.8" />
        <path d="m5.7 26.3 2.9-2.9" />
        <path d="m5.8 5.8 2.8 2.8" />
        <path d="m23.4 23.4 2.9 2.9" />
      </g>
    </g>
  </svg>
</button>
