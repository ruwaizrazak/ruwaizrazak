// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://example.com',
  integrations: [
    mdx({
      extendMarkdownConfig: true,
      smartypants: true,
      gfm: true,
    }),
    sitemap(),
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        // Ensure proper case sensitivity in imports
        preserveEntrySignatures: 'strict',
      },
    },
  },
});
