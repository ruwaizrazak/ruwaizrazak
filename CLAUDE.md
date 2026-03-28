# CLAUDE.md — ruwaizrazak.com

## Project Overview
- Astro 5 static site (SSG) deployed on Vercel
- Stack: Astro + React 19 + Tailwind CSS 4 + GSAP + MDX
- Site URL: https://ruwaizrazak.com
- Content: 7 collections (essays, notes, works, series, seriesPosts, live, playground)

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview built site

## Code Style & Conventions
- PascalCase for components (e.g., `ContentCard.astro`)
- Centralized types in `src/types.ts`, constants in `src/consts.ts`
- Utilities extracted to `src/utils/` — always check for existing utils before creating new ones
- `is*` prefix for boolean variables (e.g., `isCompact`, `isWide`)
- Use `import type { ... }` for type-only imports
- Zod schemas for content validation in `src/content.config.ts`

## Optimization Rules
- Prefer Astro's static rendering; avoid client-side JS unless interactivity is required
- Use `is:inline` scripts only when code must run before first paint (FOUC prevention)
- Use module scripts (`<script>`) for deferred behavior
- Lazy load images below the fold; eager load above-the-fold hero images
- Minimize bundle size: avoid importing entire libraries when only a function is needed
- Prefer CSS animations/transitions over JS animations where possible (GSAP for complex sequences only)
- Use Astro's `<Image />` component for automatic image optimization when adding new images
- Remote image domains must be authorized in `astro.config.mjs` under `image.domains` (e.g. `i.imgur.com` is already added)
- The custom `Image.astro` MDX component uses Astro's `<Image />` for the thumbnail; the lightbox stays as raw `<img>` for full-res zoom/pan
- Keep View Transitions performant — avoid animating layout-triggering properties

## Modularization Rules
- Client-side scripts belong in `src/scripts/` as named modules exporting an init function (e.g., `initTOC()`, `initHeroScrollHeight()`)
- Wire init functions in components using `initOnLoad()` from `src/utils/initOnLoad.ts` — never manually duplicate `DOMContentLoaded` + `astro:page-load` listeners
- Reusable MDX layout patterns belong in `src/components/mdxComponents/` as Astro components (e.g., `WorkSection.astro`, `WorkImageGrid.astro`) — MDX files should import components, not duplicate Tailwind classes
- Keep inline `<script>` blocks in `.astro` files to ≤10 lines — if logic grows beyond that, extract to `src/scripts/`
- One module per feature is fine when concerns share state; don't over-split into files that need to pass context between each other

## Commenting Guidelines (Learning-Oriented)
When modifying code, add concise comments that help the user learn:
- Explain **why** a change was made, not just what changed
- For performance optimizations: note what was slow and why the new approach is faster
- For pattern changes: briefly explain the pattern and when to use it
- For Astro-specific techniques: reference the relevant Astro concept (e.g., "Content Collections", "View Transitions", "Islands Architecture")
- For SEO changes: explain the SEO impact (e.g., "JSON-LD helps search engines understand page type")
- Keep comments short (1-2 lines). Don't over-comment obvious code
- Use `// LEARN:` prefix for educational comments so they're easy to find and optionally remove later

Example:
```js
// LEARN: Astro's <Image /> auto-generates srcset and converts to WebP,
// reducing image payload by ~40% vs raw <img> tags
```

## SEO Guidelines
- All pages must use `BaseHead.astro` for meta tags (title, description, canonical, OG, Twitter Card)
- Every content page needs a unique `title` and `description` — never leave defaults
- Use semantic HTML: `<article>`, `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`
- JSON-LD is implemented: `BaseHead.astro` always emits `WebSite`+`Person` schema; pass a `schema` prop for page-specific types (e.g. `BlogPosting` in `notesPost.astro`)
- Internal links should use descriptive anchor text (not "click here")
- Images must have descriptive `alt` attributes
- Ensure heading hierarchy is correct (one `<h1>` per page, sequential `<h2>`→`<h3>`)
- Keep the sitemap integration active (`@astrojs/sitemap`)
- RSS feed at `/rss.xml` covers `essays` + `notes` collections, sorted by `pubDate` desc
- Use `rel="noopener noreferrer"` on external links (already handled by `Link.astro`)
- Preconnect to external origins used for fonts/analytics

## Key Files
- `src/components/BaseHead.astro` — SEO meta tags, JSON-LD (WebSite+Person), fonts, analytics; accepts optional `schema` prop for page-specific JSON-LD
- `src/content.config.ts` — content collection schemas
- `src/consts.ts` — site-wide constants (SITE_TITLE, SITE_DESCRIPTION, GA_ID)
- `src/types.ts` — shared TypeScript types
- `src/utils/collections.ts` — content fetching & filtering helpers
- `src/styles/global.css` — design tokens, theme, Tailwind config
- `astro.config.mjs` — integrations, site URL, plugins, image domain allowlist
- `src/components/mdxComponents/Image.astro` — custom image component with lightbox + zoom; uses Astro `<Image />` for thumbnail optimization
- `src/layouts/notesPost.astro` — layout for notes + essays; injects BlogPosting JSON-LD
- `src/pages/rss.xml.js` — RSS feed (essays + notes)
- `public/robots.txt` — crawler directives

