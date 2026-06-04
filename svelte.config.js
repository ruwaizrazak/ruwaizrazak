import { vitePreprocess } from '@astrojs/svelte';

export default {
  // LEARN: vitePreprocess runs Svelte's <style>/<script> through the same Vite
  // pipeline as the rest of the project — enables TypeScript in <script lang="ts">
  // and lets Tailwind/PostCSS process Svelte component styles.
  preprocess: vitePreprocess(),
};
