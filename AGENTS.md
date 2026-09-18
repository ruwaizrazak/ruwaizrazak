# AGENTS.md — ruwaizrazak.com

The canonical rules for every agent working in this repo. `CLAUDE.md` imports this file with `@AGENTS.md`, so Claude and Codex read the same text — **edit shared rules here, never in `CLAUDE.md`**.

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

## Git branches

**No agent creates, switches, renames or deletes a git branch unless the user explicitly asks for it in the current conversation.** Work and commit on the branch that is checked out. This overrides `BRANCH_POLICY` in `.agents/profile.sh`, the Codex runbook and any script message. If a step seems to need a branch, stop and ask. (Codex already has no git write access; this binds Claude and every other agent.)

## Executing a Claude plan

The executor contract is global: "Executing a Claude plan" in `~/.codex/AGENTS.md` (source: `~/.agents/codex-workflow/contracts/executor.md`). What is specific to this repo lives in **`.agents/profile.sh`**: the checks Codex runs (build, unit, integrity), the ones only the reviewer can run (Playwright on chromium + webkit, which cannot bind a port in the sandbox), protected paths (`package.json`, the lockfile, `src/content/**`), the added-line scan rules, and the known baseline failures. Plans live in `docs/plans/`.

Edits to published writing under `src/content/` are never an implementation detail — a step must list the file literally, and it is reported under `content_edits`.

## Plan Drift Lessons

Append-only. Each bullet is a general cause behind a real review finding; Claude adds one at the close of every delegated plan that produced a new one.

- Map every design-plan requirement to a concrete implementation target before editing: component, route, fixture, and expected visual/state outcome.
- Test the page state that proves the feature. If the change affects a hero image, choose a route with a hero image; do not let conditional assertions create fake coverage.
- Respect component boundaries. Svelte scoped styles cannot style markup rendered inside child components unless using an owned wrapper plus `:global(...)` descendants where appropriate.
- Preserve design hierarchy exactly. Placement changes such as moving pills between eyebrow/meta/tag rows are plan deviations and require user permission.
- Audit shared exports before changing them. If a style utility is used by `/about`, embeds, or live pages, split a new targeted utility instead of changing all consumers.
- Treat design-token and typography values as intentional. If repo rules conflict with a plan value, pause and ask before silently choosing one.
- Validate parser-style utilities with edge cases that match content reality: URLs, inline code, hyphenated words, snake_case, frontmatter, and MDX syntax.
- Avoid optional tests that pass when the required fixture is absent. Add or request an explicit fixture when coverage depends on content.
- Never set "byte-identical rendered output" as the bar for a change to a hydrated island. Adding a prop re-derives the island's `uid` and serializes the new key even when its value is `undefined` (`&quot;variant&quot;:[0]`); adding an `{#if}` emits an empty block anchor (`<!--[-1--><!--]-->`); and adding any page at all rotates shared Rollup chunk hashes in every other page's script tags. Compare the component's DOM subtree, or normalise those four artifacts explicitly — otherwise the check fails for reasons that have nothing to do with the change, and the real invariant goes unverified.
- When a plan finally supplies the fixture that a guarded assertion was waiting for, remove the guard in that same plan. An `if (await x.count())` wrapper is an assertion that has never executed; leaving it in place next to a real fixture is worse than either state on its own, because the suite now looks like it covers the thing it silently skips.
- **A component embedded in an MDX article must render no heading elements.** `TocPill` scans `h1, h2, h3` inside `.note-layout article` and keys its `{#each}` by heading id. A demo card that renders its title as an `<h3>` therefore puts a heading into the article, and two copies of it on one page put in two with the same slug — which throws `each_key_duplicate`, leaves the real TOC pill rendering **zero rows**, and pollutes the document outline. `TocPillDemoView.svelte` states this rule for its own fake headings; it applies to every illustrative component, for the card title, the section label and anything else that merely looks like a heading. Use `<p>` or `<div>` with the same classes.
- **Read the console and look at the page; assertions alone will not tell you.** Two real defects shipped through a green build, 94 passing unit tests, a baseline-clean integrity suite, a clean scope check and a scoped e2e spec: a third of a card rendering blank (a sized `.card-collection-icon` computing to `display: inline` outside a flex parent, so it measured 0×0), and the heading leak above. The first was caught by looking at a screenshot, the second only by `smoke.spec.ts`'s console-error sweep in the **full** suite. Run the full suite before calling a change done, and open the page with the console visible.

- **Tailwind v4's `utility-(--var)` shorthand drops the custom property in verbatim, and it does not build the value for you.** `grid-cols-(--cols)` compiles to `grid-template-columns: var(--cols)`, so a variable holding `4` produces invalid CSS; the browser silently falls back to content-sized tracks. Keep the variable as a count and write the track list yourself: `grid-cols-[repeat(var(--cols),minmax(0,1fr))]`. `col-span-(--x)` and `order-(--x)` are fine, because their property takes a bare number. A test that only checks each row adds up to the full width can't catch this, since uneven columns still sum to 100%. Pin each card's width to span × column + (span − 1) × gap.

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

### Translate to utilities, don't transcribe declarations

A `.dc.html` canvas expresses everything as inline CSS. Converting it means **mapping each declaration to its utility** — not pasting the declaration into a `<style>` block. Transcription is how a 21-line component style block became 237, and how two design imports added 541 lines of scoped CSS in a single day.

**A scoped `<style>` block is justified only when a rule needs one of:**

1. **A selector Tailwind cannot write** — `:global()`, `[data-*]`, `>` / `+` / `~` combinators, `::before` / `::after`, `:has()`, `:only-of-type`, `:nth-*`
2. **A property Tailwind has no utility for** — `mask`, `clip-path`, `content`, `grid-template-areas`, `offset-path`, `transform-origin`, `font-variant-numeric`, `animation-timeline`, `will-change`
3. **`@keyframes`**
4. **A two-token `color-mix()`** — `color-mix(in srgb, var(--a) N%, var(--b))`. The one-token form `color-mix(in srgb, var(--token) N%, transparent)` **is** `bg-token/N`, so it does not qualify.

Everything else is a utility. If a rule qualifies, put *only the qualifying declarations* in the block — do not let one `mask` drag twenty layout declarations in with it.

**When a value has no utility and no token, add a token — do not reach for an arbitrary value or a `<style>` block.** A raw value repeated three or more times (`text-[15px]`, `tracking-[0.16em]`) is a missing `@theme` entry. A multi-declaration idiom repeated across files is a missing `@utility` (see `full-bleed`).

| Scoped CSS | Utility |
|---|---|
| `color-mix(in srgb, var(--color-syoro) 5%, transparent)` | `bg-syoro/5` |
| `font-family: var(--font-sans)` | `font-sans` |
| `transition-timing-function: var(--ease-snappy)` | `ease-snappy` |
| `display:flex; flex-direction:column; gap:12px` | `flex flex-col gap-3` |
| `@media (min-width: 768px) { … }` | `md:` |
| `@media (prefers-reduced-motion: reduce)` | `motion-reduce:` |
| `@media (hover:hover) and (pointer:fine)` | `hover:` — Tailwind v4 already compiles to `@media (hover: hover)` |

**Two translation traps that are NOT 1:1** — both found by a computed-style diff, neither visible by eye:

- **Named `text-*` values carry a paired line-height.** `text-sm` is `font-size:14px; line-height:20px`. CSS that declared only `font-size: 14px` inherited its line-height — often 21px. Use `text-[14px]` when the original set size alone, or state the leading explicitly.
- **`auto-rows-fr` is `minmax(0, 1fr)`, not `1fr`.** `1fr` means `minmax(auto, 1fr)` and will not shrink below content; the Tailwind utility will. If the CSS said `1fr`, write `auto-rows-[1fr]`.

Colour-space notation is the opposite case — a false alarm. Tailwind's `bg-token/N` mixes in oklab where the CSS said `color-mix(in srgb, …)`. Mixing with `transparent` only changes alpha, so both render identical pixels (verified on canvas). Same for `rounded-full` (`calc(infinity*1px)`) vs `border-radius: 999px`.

**Colour utilities set all four sides; CSS shorthands often did not.** `border-b border-card-border` sets `border-color` on every edge, so `border-top-color` changes even though only the bottom has width. When the original declared `border-bottom: 1px solid X`, write `border-b border-b-card-border`. Same for `border-r-*`, `border-t-*`.

**`transition-colors` is not one property.** It covers colour, background, border, outline, text-decoration, fill, stroke and the gradient stops. If the CSS said `transition: background-color 150ms ease`, write `transition-[background-color] duration-150 ease-[ease]` — and note plain `ease` is not Tailwind's default timing function (`cubic-bezier(.4,0,.2,1)`), so it needs `ease-[ease]`.

**Build both sides of a snapshot with `TEST_FIXTURES=1`.** `Webmentions.astro` renders from `src/data/webmentions.json`, which is empty most of the time; only `TEST_FIXTURES=1` (normally set by `playwright.config.ts`) swaps in the sample cache. A baseline built with it and an "after" built without it differ by 62 elements per route — and worse, a run with fixtures off gives `WebmentionsView` **zero coverage**, so its translation would pass vacuously. Use the same env on both captures.

**`prose-*` modifiers out-specify plain utilities.** `@tailwindcss/typography` compiles `prose-img:w-full` to a compound `:is(:where(img)…)` selector with higher specificity than `.size-\[15px\]`. Inside a `prose` container, a plain utility on an `img`, `p`, `a`, `li` or `code` therefore loses. A scoped descendant selector outranks it. This blew a 15px maturity icon up to 505px; only the computed-style diff caught it.

**Unlayered element rules in `global.css` beat every Tailwind utility.** `global.css` declares bare `img`, `table`, `code`, `blockquote` and `hr` rules *outside* any `@layer`. In the CSS cascade, unlayered author styles win over layered ones — so `img { height: auto }` defeats `size-3.5`, which then sets width but not height and the image renders at its intrinsic ratio. A scoped descendant selector (`.pill img { height: 14px }`) outranks it and is the correct escape until those rules are moved into `@layer base` — a change that alters `img` precedence site-wide and needs its own plan. **Check for an unlayered rule before translating any styling on `img`, `table`, `code`, `blockquote` or `hr` — and on anything that overrides `.card-shell`, `.card-band` or `.card-footer`, which are unlayered too.** A variant that changes their padding, gap, border-style or border-colour cannot be a utility.

**A class is not always a style.** Test locators (`.hero-meta-row`), microformats markers (`.p-name`, `.dt-published`, `.h-entry`) and `data-*` hooks carry meaning independent of CSS. When you strip a `<style>` block, keep those class names on the element — stripping the styling must not strip the semantics. Grep the e2e specs for the classes you are about to remove.

**Two Tailwind-in-Svelte traps** that make people give up and write CSS — know them rather than avoiding the framework:

- Never `class:some-tailwind-utility={cond}`. The v4 scanner reads `class:` as a variant and emits nothing. Use the object form: `class={['base', { 'translate-x-full': open }]}`.
- Svelte renames `@keyframes` in a scoped block. If a Tailwind arbitrary utility references the name (`animate-[foo_1s]`), declare it `@keyframes -global-foo`.

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

## Svelte Best Practice (Svelte MCP)

Every Svelte change follows the current Svelte 5 docs and passes the official autofixer. The Svelte MCP server gives you access to comprehensive Svelte 5 and SvelteKit documentation. `npx sv add ai-tools` enabled it for Claude Code as the `svelte@svelte` plugin in `.claude/settings.json`. Clients with no MCP (Codex) use the matching `@sveltejs/mcp` CLI commands below.

This site is **Astro + Svelte 5, not SvelteKit.** Use the Svelte docs sections. Ignore SvelteKit-only guidance (routing, `+page`/`+layout` files, load functions, form actions, adapters). Astro owns all of that here. The Astro/Svelte boundary rules under *Modularization Rules* still win.

### Available Svelte MCP tools

1. **list-sections**: use this FIRST to discover all available documentation sections. It returns a structured list with titles, `use_cases` and paths. When a task involves Svelte, ALWAYS call it at the start to find the relevant sections.
   CLI: `npx -y @sveltejs/mcp list-sections`
2. **get-documentation**: retrieves the full content of one or more sections. After `list-sections`, you MUST analyze the returned sections (especially `use_cases`) and fetch ALL of them that are relevant to the task.
   CLI: `npx -y @sveltejs/mcp get-documentation 'svelte/$state,svelte/$effect'`
3. **svelte-autofixer**: analyzes Svelte code and returns issues and suggestions. You MUST run it on every `.svelte` / `.svelte.ts` file you write or change, before calling the work done. Keep re-running it until it returns no issues and no suggestions.
   CLI: `npx -y @sveltejs/mcp svelte-autofixer 'src/components/garden/GardenCards.svelte'` (defaults to Svelte 5; returns `issues`, `suggestions`, `require_another_tool_call_after_fixing`)
4. **playground-link**: generates a Svelte Playground link for code. Offer one only when the code was not written into this project, and only after the user says yes. NEVER for code written to files here.

### Applying it

- **Claude:** use the MCP tools. When reviewing a Codex diff, run the autofixer on every changed `.svelte` file as part of the review.
- **Codex:** run the CLI autofixer on each `.svelte` file you touched, and list it under `checks_run` with its verbatim output. `npx` needs the network. If the sandbox can't reach it, say so in the report; never skip it silently.
- **Where they conflict:** an autofixer suggestion that conflicts with a rule in this file (e.g. one that adds a `class:` directive for a Tailwind utility, or an idempotency guard in an island) is a stop, not a silent choice. Report it and keep this file's rule.

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
- Animation tool order: **CSS → Svelte built-ins (`svelte/transition|animate|easing`) → GSAP.** GSAP is justified only for interruptible timelines that must resume proportionally — it now survives in exactly **one** place, the garden character walk, and is dynamically imported there. The footer icon morph was the second; the footer redesign replaced it with static brand glyphs, which retired `iconMorph` and removed `flubber` from the project entirely.
- Always gate motion on `prefers-reduced-motion`.
- Use Astro's `<Image />` component for automatic image optimization when adding new images
- Remote image domains must be authorized in `astro.config.mjs` under `image.domains` (e.g. `i.imgur.com` is already added)
- The custom `Image.astro` MDX component uses Astro's `<Image />` for the thumbnail; the lightbox stays as raw `<img>` for full-res zoom/pan
- Keep View Transitions performant — avoid animating layout-triggering properties

## Modularization Rules
### Where behaviour lives

- **Interactive component → Svelte island.** Own the state with `$state`, derive the markup from it, and return teardown from `onMount`/`$effect`. Do NOT add idempotency guards — an island mounts once and cleans up. Guards in this codebase were all workarounds for a double-fire that no longer exists.
- **Reusable DOM behaviour → a Svelte action** in `src/lib/actions/` (`intersect`, `portal`).
- **Shared reactive state → `src/lib/state/*.svelte.ts`** (runes are allowed in `.svelte.ts`).
- **Pure computation / canvas / math → a plain module** in `src/scripts/` (`garden/curveUtils`, `garden/grassCanvas`, `analytics`). Rule of thumb: if it queries the DOM it belongs in a component or action; if it only computes, it stays a module.
- **Page-level script in an `.astro` layout → `initOnLoad()`** from `src/utils/initOnLoad.ts`. It runs the callback exactly once per page view and re-runs on view-transition navigations. Return a cleanup function from the callback — it is invoked before the next run and on `astro:before-swap`.

### Styling: translate to utilities, don't transcribe declarations

Tailwind owns layout, spacing, colour, typography, responsive and state. A scoped `<style>` block is justified **only** when a rule needs a selector Tailwind cannot write (`:global()`, `[data-*]`, combinators, `::before`, `:has()`, `:nth-*`), a property it has no utility for (`mask`, `clip-path`, `content`, `grid-template-areas`, `transform-origin`, `will-change`), `@keyframes`, or a **two-token** `color-mix()`. The one-token form `color-mix(in srgb, var(--token) N%, transparent)` is just `bg-token/N`.

When a rule qualifies, put only the qualifying declarations in it — one `mask` must not drag twenty layout declarations along. A raw value used three or more times is a missing `@theme` token, not an arbitrary utility; a repeated multi-declaration idiom is a missing `@utility`.

This matters most on design imports: a `.dc.html` is inline CSS, and pasting its declarations into `<style>` is how 541 lines of scoped CSS appeared in one day. Full rule and translation table under *Design Implementation Guidelines* above.

### Astro/Svelte boundaries (learned the hard way)

- A Svelte component **cannot render an `.astro` child**, cannot `await` during render, and cannot reach `astro:assets`, `astro:content` or the `Astro` global.
- When a component needs any of those, use the **resolver/view split**: a thin `.astro` does the async work and passes flat, serialisable props to a `.svelte` view. See `Link.astro` + `LinkView.svelte`, `Image.astro` + `ImageLightbox.svelte`, `Webmentions.astro` + `WebmentionsView.svelte`.
- Images: resolve with `optimizeImage()` / `optimizePicture()` (`src/utils/optimizeImage.ts`) on the Astro side, render with `ui/OptimizedImage.svelte` / `ui/OptimizedPicture.svelte`. Those two must stay `<style>`-free, or Svelte stamps a scoping class onto the `<img>`.
- **The corollary: a parent's scoped styles cannot reach into them either.** A class passed down as a prop crosses the component boundary; Svelte's scoping hash does not. A rule written in the parent for an element declared in the child compiles to `.thing.svelte-hash`, matches nothing, and is silently stripped with a `css_unused_selector` warning — this shipped the note-post hero image with no aspect-ratio, border or radius at all. Style a wrapper the parent owns and reach the child with `.wrapper :global(img)`, which scopes the wrapper half and globalises only the descendant. Prefer that to a bare `:global(.some-class)`, which publishes a generic name into the global sheet. To check without a build: `compile(src, { css: 'external' }).warnings.filter(w => w.code === 'css_unused_selector')`.
- A component passed through the MDX components map **cannot carry a `client:*` directive** ([astro#5853](https://github.com/withastro/astro/issues/5853)) — but an `.astro` component used in MDX can. That is what the thin wrappers (`Image.astro`, `VideoBreakout.astro`, `TocPillDemo.astro`) are for.
- `Astro.url` is unavailable in Svelte — pass `pathname` as a prop.
- Astro's `transition:name` directive has no Svelte equivalent — set `style="view-transition-name: …"`, which is what it compiles to.

### Hydration directives

- `client:load` for anything the reader can interact with immediately, **and for anything whose first interaction must not be dropped**. `client:visible` hydrates after the element is on screen, so a click that lands during that gap is silently swallowed — this bit Webmentions, VideoBreakout and TocPillDemo, each caught by a test.
- `client:visible` is right for pure entrance/reveal animations, where there is nothing to do until the element is on screen.
- A **static `.svelte` with no `client:*` ships zero JS.** Verify with `grep -c '<astro-island' dist/**/*.html`.

### Gotchas that will bite

- **Never write `class:some-tailwind-utility={cond}`.** Tailwind v4's scanner reads `class:` as a variant and never emits the utility, so the class lands with no CSS behind it. Use the object form: `class={['base', { 'translate-x-full': !open }]}`.
- **Any island whose script transitively imports `gsap` or `ScrollTrigger` must `await import()` it inside `onMount`.** An island's `<script>` is evaluated during SSR, and `gsap.registerPlugin(ScrollTrigger)` crashes the build. The rule applies to any CommonJS-only package too: `flubber` used to break `astro dev` the same way, before the footer morph was retired and it was uninstalled.
- Svelte renames `@keyframes` declared in a scoped style. If the name is referenced from outside that block — e.g. a Tailwind arbitrary utility like `animate-[toc-dot-pulse_…]` — declare it `@keyframes -global-name`.
- Reusable MDX layout patterns belong in `src/components/mdxComponents/` as Astro components (e.g., `WorkSection.astro`, `WorkImageGrid.astro`) — MDX files should import components, not duplicate Tailwind classes
- Keep inline `<script>` blocks in `.astro` files to ≤10 lines — if logic grows beyond that, it probably wants to be an island
- One module per feature is fine when concerns share state; don't over-split into files that need to pass context between each other
- **`References` is the one MDX component allowed a heading.** It renders a single `<h2 id="references">` so the reference list keeps its entry in the TOC pill (there is one per page, and the id is fixed). Its group labels (Books / From the garden / On the web) are plain text, never headings. Every other MDX component still follows the no-headings rule in Plan Drift Lessons.
- **Remote book covers are the one exception to Astro `<Image />`.** `References` draws Open Library covers (only for entries with an `isbn`) as lazy CSS backgrounds on a sized `div`, unoptimised, because they are third-party, optional and resolved from content at render time. Every site-owned image still goes through `<Image />` / `optimizeImage()`.

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
- `src/lib/actions/` — reusable DOM behaviour (`intersect`, `portal`)
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
