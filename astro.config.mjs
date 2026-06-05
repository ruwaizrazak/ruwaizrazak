// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLink from '@portaljs/remark-wiki-link';
export default defineConfig({
  output: 'static',
  image: {
    domains: ['i.imgur.com'],
  },
  site: 'https://ruwaizrazak.com',
  // LEARN: Top-level markdown config applies to both .md and .mdx files
  // (MDX inherits via extendMarkdownConfig: true), so wikilinks work everywhere
  markdown: {
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
  },
  integrations: [
    mdx({
      extendMarkdownConfig: true,
      smartypants: true,
      gfm: true,
    }),
    sitemap(),
    // LEARN: react() is build-time only — it provides the .tsx JSX transform Satori
    // needs for OG image generation (src/utils/og-template.tsx). No component is ever
    // hydrated (zero client:* directives), so no React ships to the browser.
    react(),
  ],

  vite: {
    plugins: [tailwindcss()],
    // LEARN: @resvg/resvg-js is a native Node addon (.node binary) that esbuild
    // can't bundle. We need TWO exclusions because Vite uses different pipelines:
    // - ssr.external: skips bundling during the production SSR build phase
    // - optimizeDeps.exclude: skips pre-bundling during dev server startup
    // Without both, `astro build` works but `astro dev` crashes.
    ssr: {
      external: ['@resvg/resvg-js'],
    },
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
    build: {
      rollupOptions: {
        // Ensure proper case sensitivity in imports
        preserveEntrySignatures: 'strict',
      },
    },
  },
});
