# AGENTS.md — ruwaizrazak.com

## Project Overview
- Astro 5 static site (SSG) deployed on Vercel
- Stack: Astro 5 + Svelte 5 + Tailwind CSS 4 + GSAP + MDX
- Astro is the meta-framework (routing, content collections, MDX, OG/Satori, RSS, sitemap, View Transitions). Components are Svelte. React was removed — the OG template builds Satori's element tree by hand.
- Site URL: https://ruwaizrazak.com
- Content: 7 collections (essays, notes, works, series, seriesPosts, live, playground)

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run preview` — preview built site

## Plan Execution Workflow
- When the user provides a plan or modular test case created with Claude Opus, treat that plan as the source of truth.
- Before editing files, do an implementation read: inspect the relevant code, compare the plan against the repo, and report questions or state that there are no questions.
- Stick to the provided plan. If a change to the plan seems useful or necessary, explicitly ask the user's permission before deviating.
- Execute approved plans using GPT-5.6 Sol at high reasoning effort when that model and effort are available.
- Keep verification light by default. Run focused checks for the changed area, and use heavier test/build verification only when the plan requests it or the change is high-risk.
- After implementation, summarize changed files, assumptions, and any checks run so the user can hand the work to Claude Opus for testing.

## Plan Drift Lessons
- Map every design-plan requirement to a concrete implementation target before editing: component, route, fixture, and expected visual/state outcome.
- Test the page state that proves the feature. If the change affects a hero image, choose a route with a hero image; do not let conditional assertions create fake coverage.
- Respect component boundaries. Svelte scoped styles cannot style markup rendered inside child components unless using an owned wrapper plus `:global(...)` descendants where appropriate.
- Preserve design hierarchy exactly. Placement changes such as moving pills between eyebrow/meta/tag rows are plan deviations and require user permission.
- Audit shared exports before changing them. If a style utility is used by `/about`, embeds, or live pages, split a new targeted utility instead of changing all consumers.
- Treat design-token and typography values as intentional. If repo rules conflict with a plan value, pause and ask before silently choosing one.
- Validate parser-style utilities with edge cases that match content reality: URLs, inline code, hyphenated words, snake_case, frontmatter, and MDX syntax.
- Avoid optional tests that pass when the required fixture is absent. Add or request an explicit fixture when coverage depends on content.

## Design Implementation Guidelines (Claude Design imports)

Applies whenever the plan's source is a `.dc.html` file from a Claude Design project.

### Before editing anything

- **Build the ownership map first.** For every file the plan names, grep who else imports it. Single-consumer files can be changed freely; shared ones need a variant, a new export, or the user's permission. Put the map in your implementation read. Most design drift starts as an unnoticed second consumer.
- **Read the canvas as data, not markup.** A `.dc.html` is inline-styled scaffolding: `sc-for` is an `{#each}`, `style-hover` is a `:hover` rule, `{{ x }}` is an interpolation, and `support.js` / `DCLogic` is canvas runtime that never ships. Port the *values*, never the structure.
- **The canvas is one viewport.** These files are authored at a single width (usually 1280px). Every responsive decision is yours, so state the ladder you chose in your summary. Never ship a canvas value that makes a phone unusable — an 88px h1 or a flat 80px page padding is a bug at 375px.

### Translating values

- **Tokens, never hex.** Every colour in these mocks already has a token in `global.css` (`--color-syoro`, `--color-konpeki`, `--color-card-border`, `--color-muted`, `--color-cardbg`, `--ease-snappy`). Hard-coded hex does not shift in dark mode — the theme switches on a `.dark` class, not `prefers-color-scheme`. Use `color-mix(in srgb, var(--token) N%, transparent)` for the mock's `rgba()` values.
- **Reuse the shared systems.** `.card-shell` / `.card-band` / `.card-eyebrow` / `.card-meta` / `.card-collection-icon` already exist in `global.css`. If a mock draws a card or a collection glyph, it is drawing those — do not write a second implementation.
- **Treat every specified value as intentional**, including tracking, line-height and max-width in `ch`. If a repo convention contradicts a plan value, stop and ask rather than silently picking one.
- **Preserve hierarchy exactly.** Which row an element sits in is design, not layout detail. Moving a pill between an eyebrow row and a meta row is a deviation and needs permission.

### Component boundaries

- **Svelte scoped CSS cannot cross into a child component.** A class passed as a prop crosses the boundary; the scoping hash does not, so the rule compiles to `.thing.svelte-hash`, matches nothing, and is stripped silently. Style a wrapper the parent owns and reach the child with `.wrapper :global(img)`. Prefer that to a bare `:global(.name)`.
- **Check it before claiming it works:** `compile(src, { css: 'external' }).warnings.filter(w => w.code === 'css_unused_selector')`. A build prints these too — read them.
- **Anything needing `await`, `astro:assets`, `astro:content` or the `Astro` global is a resolver/view split** — a thin `.astro` doing the async work, passing flat props to a `.svelte` view.
- **Whatever renders tooltip markup must also import `../scripts/linkTooltips.ts`.** Emitting `data-tippy-content` without the binder produces markup that looks right and does nothing. Astro dedupes the import.
- **Static by default.** A component with no interaction gets no `client:*` directive and should ship zero JS. Confirm with `grep -c '<astro-island' dist/<route>/index.html`.

### Testing a design import

- **Assert geometry, not class names.** A class can be present while the CSS behind it was pruned — that is precisely how a broken hero image ships. Measure `boundingBox()` ratios, computed radii, widths.
- **Pick the route that actually exercises the feature.** If the change touches a hero image, test a route whose entry has one. Check the fixture's frontmatter before writing the assertion.
- **Never let a conditional create fake coverage.** `if (await x.count())` around an assertion passes when the fixture is missing. If coverage needs a fixture that does not exist, add one or ask — do not guard the test.
- **Pin both sides of a variant.** When a shared component gains a variant, assert the new branch on the new page *and* the old branch on the existing one. That is what keeps the default honest.
- **Write a test that fails on the old behaviour.** If it passes before and after, it is not coverage. Check it against the previous implementation.
- **Run chromium and webkit.** Masks, `backdrop-filter` and sticky positioning all diverge, and the repo already carries two iOS Safari workarounds.

### Reporting back

State the responsive ladder you chose, any canvas value you deliberately did not ship and why, the ownership map, and which checks you ran. Flag content edits separately and loudly — changing published writing is never a silent implementation detail.

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
- Animation tool order: **CSS → Svelte built-ins (`svelte/transition|animate|easing`) → GSAP.** GSAP is justified only for interruptible timelines that must resume proportionally, and for flubber path morphs — it survives in exactly two places (the garden character walk, the footer icon morph) and is dynamically imported in both.
- Always gate motion on `prefers-reduced-motion`.
- Use Astro's `<Image />` component for automatic image optimization when adding new images
- Remote image domains must be authorized in `astro.config.mjs` under `image.domains` (e.g. `i.imgur.com` is already added)
- The custom `Image.astro` MDX component uses Astro's `<Image />` for the thumbnail; the lightbox stays as raw `<img>` for full-res zoom/pan
- Keep View Transitions performant — avoid animating layout-triggering properties

## Modularization Rules
### Where behaviour lives

- **Interactive component → Svelte island.** Own the state with `$state`, derive the markup from it, and return teardown from `onMount`/`$effect`. Do NOT add idempotency guards — an island mounts once and cleans up. Guards in this codebase were all workarounds for a double-fire that no longer exists.
- **Reusable DOM behaviour → a Svelte action** in `src/lib/actions/` (`intersect`, `iconMorph`, `portal`).
- **Shared reactive state → `src/lib/state/*.svelte.ts`** (runes are allowed in `.svelte.ts`).
- **Pure computation / canvas / math → a plain module** in `src/scripts/` (`garden/curveUtils`, `garden/grassCanvas`, `analytics`). Rule of thumb: if it queries the DOM it belongs in a component or action; if it only computes, it stays a module.
- **Page-level script in an `.astro` layout → `initOnLoad()`** from `src/utils/initOnLoad.ts`. It runs the callback exactly once per page view and re-runs on view-transition navigations. Return a cleanup function from the callback — it is invoked before the next run and on `astro:before-swap`.

### Astro/Svelte boundaries (learned the hard way)

- A Svelte component **cannot render an `.astro` child**, cannot `await` during render, and cannot reach `astro:assets`, `astro:content` or the `Astro` global.
- When a component needs any of those, use the **resolver/view split**: a thin `.astro` does the async work and passes flat, serialisable props to a `.svelte` view. See `Link.astro` + `LinkView.svelte`, `Image.astro` + `ImageLightbox.svelte`, `Webmentions.astro` + `WebmentionsView.svelte`.
- Images: resolve with `optimizeImage()` / `optimizePicture()` (`src/utils/optimizeImage.ts`) on the Astro side, render with `ui/OptimizedImage.svelte` / `ui/OptimizedPicture.svelte`. Those two must stay `<style>`-free, or Svelte stamps a scoping class onto the `<img>`.
- A component passed through the MDX components map **cannot carry a `client:*` directive** ([astro#5853](https://github.com/withastro/astro/issues/5853)) — but an `.astro` component used in MDX can. That is what the thin wrappers (`Image.astro`, `VideoBreakout.astro`, `TocPillDemo.astro`) are for.
- `Astro.url` is unavailable in Svelte — pass `pathname` as a prop.
- Astro's `transition:name` directive has no Svelte equivalent — set `style="view-transition-name: …"`, which is what it compiles to.

### Hydration directives

- `client:load` for anything the reader can interact with immediately, **and for anything whose first interaction must not be dropped**. `client:visible` hydrates after the element is on screen, so a click that lands during that gap is silently swallowed — this bit Webmentions, VideoBreakout and TocPillDemo, each caught by a test.
- `client:visible` is right for pure entrance/reveal animations, where there is nothing to do until the element is on screen.
- A **static `.svelte` with no `client:*` ships zero JS.** Verify with `grep -c '<astro-island' dist/**/*.html`.

### Gotchas that will bite

- **Never write `class:some-tailwind-utility={cond}`.** Tailwind v4's scanner reads `class:` as a variant and never emits the utility, so the class lands with no CSS behind it. Use the object form: `class={['base', { 'translate-x-full': !open }]}`.
- **Any island whose script transitively imports `gsap`, `ScrollTrigger` or `flubber` must `await import()` it inside `onMount`.** An island's `<script>` is evaluated during SSR: `gsap.registerPlugin(ScrollTrigger)` crashes the build, and flubber's CommonJS named export breaks `astro dev`.
- Svelte renames `@keyframes` declared in a scoped style. If the name is referenced from outside that block — e.g. a Tailwind arbitrary utility like `animate-[toc-dot-pulse_…]` — declare it `@keyframes -global-name`.
- Reusable MDX layout patterns belong in `src/components/mdxComponents/` as Astro components (e.g., `WorkSection.astro`, `WorkImageGrid.astro`) — MDX files should import components, not duplicate Tailwind classes
- Keep inline `<script>` blocks in `.astro` files to ≤10 lines — if logic grows beyond that, it probably wants to be an island
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
- `src/components/BaseHead.astro` — SEO meta tags, JSON-LD (WebSite+Person), fonts, analytics; accepts optional `schema` prop for page-specific JSON-LD. Also holds the `is:inline` pre-paint theme script, which must stay inline (a module script is deferred and would flash)
- `src/components/mdxComponents/map.ts` — **the MDX component registry.** Content files import nothing; add a component here and it is available in every `.mdx` by name
- `src/utils/optimizeImage.ts` — `optimizeImage()` / `optimizePicture()`; the Astro-side half of every image in a Svelte component
- `src/utils/workCards.ts` — flattens a works `CollectionEntry` into card props with the image resolved
- `src/utils/initOnLoad.ts` — runs a page-level script once per page view and on view-transition navigations; supports a cleanup return
- `src/lib/actions/` — reusable DOM behaviour (`intersect`, `iconMorph`, `portal`)
- `src/lib/state/dropdown.svelte.ts` — reactive open/close used by the nav dropdowns
- `src/lib/easing.ts` — `easeSnappy`, a real function for the `--ease-snappy` curve, so JS animation and CSS agree
- `src/content.config.ts` — content collection schemas
- `src/consts.ts` — site-wide constants (SITE_TITLE, SITE_DESCRIPTION, GA_ID, SOCIAL_LINKS)
- `src/types.ts` — shared TypeScript types
- `src/utils/collections.ts` — content fetching & filtering helpers
- `src/styles/global.css` — design tokens, theme, Tailwind config
- `astro.config.mjs` — integrations, site URL, plugins, image domain allowlist. `@astrojs/svelte` is pinned to 7.x: it is the last major with a peer range of `astro ^5`, so `astro add svelte` installs v9 and breaks the build
- `src/components/mdxComponents/Image.astro` — resolver that mounts `ImageLightbox.svelte` (lightbox + zoom/pan)
- `src/components/toc/TocPill.svelte` — the floating TOC; rendered by `notesPost.astro` OUTSIDE `<main>`, because a transformed ancestor breaks `position: fixed`
- `src/layouts/notesPost.astro` — layout for notes + essays; injects BlogPosting JSON-LD
- `src/pages/rss.xml.js` — RSS feed (essays + notes)
- `public/robots.txt` — crawler directives

## Testing
- `npm test` — unit (vitest) + integrity (asserts against a real `dist/`)
- `npm run test:e2e` — Playwright on chromium, **webkit** (required: the TOC pill carries two iOS Safari `backdrop-filter` workarounds) and mobile-chrome
- The E2E suite is the behaviour spec. When changing an interaction, run its spec before and after.
- Islands hydrate LATER than the `DOMContentLoaded` scripts they replaced. A spec that interacts immediately after `goto` must wait for hydration first: `await expect(page.locator('astro-island:not([ssr])').first()).toBeAttached()`.
