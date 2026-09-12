// LEARN: @astrojs/svelte reads this file for Svelte compiler options.
// vitePreprocess lets <script lang="ts"> and <style> blocks run through Vite's
// own transform pipeline, so TypeScript in .svelte files and PostCSS/Tailwind
// in scoped styles work without extra tooling.
import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
};
