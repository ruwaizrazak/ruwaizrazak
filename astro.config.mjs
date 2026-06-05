// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLink from '@portaljs/remark-wiki-link';
import lottie from 'astro-integration-lottie';
import { getSitemapEntries } from './src/utils/sitemapData.mjs';

// LEARN: Built once at config eval time (config can't use astro:content), this maps
// each content URL → { publish, lastmod } so the sitemap can drop drafts + add dates.
const sitemapEntries = getSitemapEntries();

// Top-level pages that are section landing pages (not individual content entries).
const SECTION_INDEXES = new Set([
  '/about', '/notes', '/essays', '/works', '/garden', '/series', '/playground', '/live',
]);
const isSectionIndex = (path) => SECTION_INDEXES.has(path) || path.startsWith('/tags/');

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
    // LEARN: changefreq/priority are hints Google ignores; <lastmod> is the real
    // ranking-relevant signal — so we set it accurately per page below.
    sitemap({
      changefreq: 'monthly',
      priority: 0.6,
      serialize(item) {
        // Normalize the emitted URL to a no-trailing-slash pathname for lookup.
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const entry = sitemapEntries.get(path);

        // Drop unpublished drafts from the sitemap (they stay reachable by URL).
        if (entry && entry.publish === false) return undefined;

        // Accurate per-page lastmod from updatedDate/pubDate.
        if (entry?.lastmod) item.lastmod = entry.lastmod;

        // Section-aware priority/changefreq; content pages keep the 0.6/monthly default.
        if (path === '/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        } else if (isSectionIndex(path)) {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        }

        return item;
      },
    }),
    react(),
    lottie(),
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
