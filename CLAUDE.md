# CLAUDE.md — ruwaizrazak.com

## Project Overview
- Astro 5 static site (SSG) deployed on Vercel
- Stack: Astro + React 19 + Tailwind CSS 4 + GSAP + MDX
- Site URL: https://ruwaizrazak.com
- Content: 6 collections (essays, notes, works, series, live, playground)

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
- Keep View Transitions performant — avoid animating layout-triggering properties

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
- Add JSON-LD structured data for articles (BlogPosting), person (ProfilePage), and breadcrumbs
- Internal links should use descriptive anchor text (not "click here")
- Images must have descriptive `alt` attributes
- Ensure heading hierarchy is correct (one `<h1>` per page, sequential `<h2>`→`<h3>`)
- Keep the sitemap integration active (`@astrojs/sitemap`)
- RSS feed at `/rss.xml` — ensure it references the correct collections
- Use `rel="noopener noreferrer"` on external links (already handled by `Link.astro`)
- Preconnect to external origins used for fonts/analytics

## Key Files
- `src/components/BaseHead.astro` — SEO meta tags, fonts, analytics
- `src/content.config.ts` — content collection schemas
- `src/consts.ts` — site-wide constants (SITE_TITLE, SITE_DESCRIPTION, GA_ID)
- `src/types.ts` — shared TypeScript types
- `src/utils/collections.ts` — content fetching & filtering helpers
- `src/styles/global.css` — design tokens, theme, Tailwind config
- `astro.config.mjs` — integrations, site URL, plugins

## Known Issues
- RSS feed (`src/pages/rss.xml.js`) references non-existent 'blog' collection — needs fixing
- Typo in `src/consts.ts`: SITE_DESCRIPTION has "knwoledge" instead of "knowledge"
- No JSON-LD structured data yet — should be added to BaseHead or layouts
- No `robots.txt` in `/public` — should be added for crawler guidance
