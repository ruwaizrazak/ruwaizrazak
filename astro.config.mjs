// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import remarkWikiLink from '@portaljs/remark-wiki-link';

// LEARN: Self-hosted fonts via Astro's fonts API: no third-party stylesheet blocks first paint,
// and Astro emits @font-face, preload links and metric-matched fallbacks at build time.
const fontFamily = (name, cssVariable, file, faces, fallback) => ({
  provider: fontProviders.local(),
  name,
  cssVariable,
  fallbacks: [fallback],
  options: {
    variants: faces.map(([weight, style]) => ({
      weight,
      style,
      src: [`./src/assets/fonts/web/${file}-${String(weight).replace(' ', '-')}-${style}.woff2`],
    })),
  },
});

export default defineConfig({
  output: 'static',
  experimental: {
    fonts: [
      fontFamily('IBM Plex Serif', '--font-plex-serif', 'IBMPlexSerif', [
        [400, 'normal'], [500, 'normal'], [600, 'normal'], [700, 'normal'],
        [400, 'italic'], [500, 'italic'], [600, 'italic'], [700, 'italic'],
      ], 'serif'),
      fontFamily('Saira Condensed', '--font-saira-condensed', 'SairaCondensed', [
        [300, 'normal'], [400, 'normal'], [500, 'normal'], [600, 'normal'], [700, 'normal'],
      ], 'sans-serif'),
      fontFamily('IBM Plex Mono', '--font-plex-mono', 'IBMPlexMono', [
        [400, 'normal'], [500, 'normal'], [700, 'normal'], [400, 'italic'],
      ], 'monospace'),
      fontFamily('Caveat', '--font-caveat', 'Caveat', [['400 700', 'normal']], 'cursive'),
    ],
  },
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
    // LEARN: @astrojs/svelte is pinned to 7.x — it's the last major with a peer
    // range of astro ^5. v8 needs Astro ^6 and v9 (latest) needs ^7, so
    // `astro add svelte` would install v9 and break the build.
    svelte(),
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
