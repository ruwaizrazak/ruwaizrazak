# About Page v2 — architecture

Companion to `about-page-v2-2026-09-13-1843-plan.md`.
The structural picture an agent needs before editing these files.

---

## Ownership map — who else breaks if you touch this

This is the first thing to establish on any design import, and for this page it is unusually clean:

| File | Consumers | Safe to change freely? |
|---|---|---|
| `StickyExperience.astro` / `View.svelte` | `about.astro` only | yes — deleted by this plan |
| `AboutLayout.astro` | `about.astro` only | yes |
| `Main.svelte` | `AboutLayout.astro` only | yes — single-consumer chain |
| `WorkCardCompact.svelte` | `about.astro`, `OtherWorksSectionView.svelte` | **no** — shared |
| `GardenPreview.astro` | `about.astro`, `index.astro` | **no** — shared, hence the variant prop |
| `proseClasses` | `about.astro`, `live/index.astro`, `embed/works/[...slug].astro` | **no** — shared |

`WorkCardCompact` needs no change anyway: it already renders on the shared card system the design draws.

---

## Page render chain, after this plan

```
src/pages/about.astro
  │  getCollection('works') · toWorkCardsCompact() · getPublishedAndSorted('essays')
  │  experience[] and facts[] live here as page copy
  ▼
src/layouts/AboutLayout.astro
  ├── BaseHead · ClientRouter
  ├── Main.svelte              ← the 1280px / 28px container (About-only)
  │     ├── Header.astro
  │     └── <slot/>            ← the two-column grid
  │           ├── AboutRail.astro          (portrait · facts · email pill)  [sticky]
  │           └── content column
  │                 ├── intro (eyebrow · h1 · two leads)
  │                 ├── SectionHeading + ExperienceLedger.astro
  │                 ├── SectionHeading + history prose
  │                 ├── SectionHeading + WorkCardCompact grid
  │                 └── SectionHeading(action: Visit garden) + GardenPreview variant="list"
  └── Footer.astro
```

---

## The resolver/view split, and why the ledger needs one

A Svelte component cannot `await` during render, cannot reach `astro:assets`, `astro:content`, or the `Astro` global, and cannot render an `.astro` child. When a component needs any of those, a thin `.astro` does the async work and passes flat, serialisable props to a `.svelte` view.

`ExperienceLedger` needs **two** such things per row:

- `optimizeImage()` on the company logo — `astro:assets`, async, Astro-only.
- `resolveTooltipMeta()` + `buildTooltipHTML()` for the "Visit website" link — a build-time fetch.

So it follows the same shape as the component it replaces, and as `Link.astro`+`LinkView`, `Image.astro`+`ImageLightbox`, `GardenPreview`+`GardenPreviewView`.

**The tooltip binder rule.** Any component that *renders* tooltip markup must also `import '../scripts/linkTooltips.ts'` in its own `<script>`. Emitting `data-tippy-content` without the binder produces markup that looks right and does nothing — the failure is silent. `StickyExperience.astro` carries both the import and the comment recording the last time this was missed; carry them into the ledger. Astro dedupes the import.

---

## Styling ownership

| Concern | Home |
|---|---|
| Design tokens, palette, `.dark` overrides | `global.css` `@theme` + `@layer theme` |
| Shared card shell (`.card-shell`, `.card-band`, `.card-eyebrow`, `.card-meta`, `.card-collection-icon`) | `global.css` |
| Prose roles | `src/utils/proseClasses.ts` (two exports, consumers named at the top) |
| About-page layout | the new `about/*` components' own scoped blocks |

The garden list's collection glyph reuses `.card-collection-icon` — set `--card-icon` to the collection's SVG and let the existing mask rule do the work. Do not write a second mask implementation.

**Svelte scoped-CSS boundary.** A class passed down as a prop crosses a component boundary; Svelte's scoping hash does not. A rule written in a parent for an element declared inside a child (e.g. the `<img>` inside `ui/OptimizedImage.svelte`) compiles to `.thing.svelte-hash`, matches nothing, and is silently stripped. Style a wrapper the parent owns and reach the child with `.wrapper :global(img)`. This is written up in `CLAUDE.md` under "Astro/Svelte boundaries"; it shipped the note-post hero with no styling at all.

Check it without a build:

```js
import { compile } from 'svelte/compiler';
compile(source, { filename, css: 'external' })
  .warnings.filter(w => w.code === 'css_unused_selector');
```

---

## Constraints that bite

- **Zero JS.** Every component in this plan is static — no `client:*` directive. Verify with `grep -c '<astro-island' dist/about/index.html`.
- **Never `class:some-tailwind-utility={cond}`.** Tailwind v4's scanner reads `class:` as a variant and emits no CSS, so the class lands with nothing behind it. Use the object form: `class={['base', { 'x': cond }]}`.
- **`Astro.url` is unreachable from Svelte** — `GardenPreviewView` already takes `pathname` as a prop for exactly this reason. The list variant needs the same.
- **One `<h1>` per page.** The integrity suite asserts it.
- **Tokens, not hex.** Every colour in the mock has a token. Hard-coded hex does not shift in dark mode — the theme switches on a `.dark` class, not `prefers-color-scheme`.
- **`support.js`** is the Claude Design canvas runtime (`DCLogic`, `sc-for`, `style-hover`). Canvas-only: `sc-for` is an `{#each}`, `style-hover` is a `:hover` rule. Nothing from it ships.
