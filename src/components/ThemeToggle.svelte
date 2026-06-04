<script lang="ts">
  // LEARN: First Svelte island. Markup is owned by Svelte; the theme logic still
  // lives in scripts/theme-toggle.ts (framework-agnostic) and is called in onMount.
  // Mounted with client:load by the parent since it's global + above the fold.
  import { onMount } from 'svelte';
  import { cycleTheme, initThemeListener } from '../scripts/theme-toggle';

  // Reflects the <html class="dark"> state (set pre-paint by BaseHead's inline script).
  let isDark = $state(false);

  function sync() {
    isDark = document.documentElement.classList.contains('dark');
  }

  onMount(() => {
    initThemeListener();
    sync();
    // Re-sync when the OS preference flips while on the "system" theme.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTimeout(sync, 0);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });

  function handleClick() {
    cycleTheme();
    sync();
  }
</script>

<button
  id="theme-toggle"
  type="button"
  class="theme-toggle p-2 rounded-full text-syoro hover:bg-yellow-500 dark:hover:bg-gray-700 transition-colors"
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
