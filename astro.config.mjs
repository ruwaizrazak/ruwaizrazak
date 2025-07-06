// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLink from '@portaljs/remark-wiki-link';
import LottieAnimation from 'astro-integration-lottie/Lottie.astro';

export default defineConfig({
  output: 'static',
  site: 'https://example.com',
  integrations: [
    mdx({
      remarkPlugins: [
        [
          remarkWikiLink,
          {
            hrefTemplate: (permalink) => `/${permalink}`,
            pageResolver: (name) => [
              name.replace(/\s+/g, '-').toLowerCase(),
            ],
            aliasDivider: '|',
          },
        ],
      ],
      extendMarkdownConfig: true,
      smartypants: true,
      gfm: true,
    }),
    sitemap(),
    react(),
    lottie(),
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
