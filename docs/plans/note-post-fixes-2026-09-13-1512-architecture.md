# Note Post fixes — architecture

Companion to `note-post-fixes-2026-09-13-1512-plan.md`.
The structural picture an agent needs before editing these files.

---

## The Svelte scoped-CSS boundary (the rule behind F1)

```
NotePostHero.svelte              ← owns a scoped <style>
  └── OptimizedPictureView       ← ui/OptimizedPicture.svelte, deliberately <style>-free
        └── <picture><img>       ← declared in the CHILD's template
```

Svelte scopes CSS by adding a hash class to (a) selectors in a component's own `<style>` and (b) elements in that **same component's** template. A class passed down as a prop crosses the component boundary; the scoping hash does not.

So a rule written in `NotePostHero` for an element rendered by `OptimizedPicture` compiles to `.thing.svelte-hash`, matches nothing, and is stripped with a `css_unused_selector` warning. That is exactly what happened to `.hero-picture`.

**Two rules, and they are a pair:**

1. `ui/OptimizedImage.svelte` and `ui/OptimizedPicture.svelte` must stay `<style>`-free, so *they* stamp no scoping class onto the `<img>`. (Already in CLAUDE.md.)
2. A parent's scoped styles therefore **cannot reach into them**. Style a wrapper the parent owns, and reach the child's element with `.wrapper :global(child)` — which scopes the wrapper half and globalises only the descendant. (Added to CLAUDE.md by this work.)

Prefer the wrapper form over a bare `:global(.some-class)`, which publishes a generic name into the global sheet.

**How to check without a browser** — compile in memory, no build, no writes:

```js
import { compile } from 'svelte/compiler';
const out = compile(source, { filename, css: 'external' });
out.warnings.filter(w => w.code === 'css_unused_selector');
```

---

## Note-post render chain

```
src/pages/{notes,essays,series,playground}/[...slug].astro
  │  getStaticPathsForCollection() · render() · readingTime(post.body)
  ▼
src/layouts/notesPost.astro
  │  optimizePicture(heroImage)  ← astro:assets is Astro-only, so image
  │                                 resolution happens HERE, not in Svelte
  │  BlogPosting JSON-LD · canonical · OG path
  ├── Header.astro
  ├── NotePostHero.svelte        ← eyebrow, maturity pill, h1/lead, meta row, hero figure
  ├── .note-main-wrapper (h-entry, scroll-driven transform)
  │     ├── NoteMain.astro       ← 760px measure, notePostProseClasses, maturity footer
  │     │     └── <slot/>  ←  MDX, components resolved via mdxComponents/map.ts
  │     ├── Webmentions.astro
  │     └── RelatedNotes.astro
  └── TocPill.svelte             ← OUTSIDE the wrapper: a transformed ancestor
                                    breaks position:fixed. Do not move it back in.
```

`/about` is **not** in this chain — it has its own hero and layout and imports `proseClasses` directly.

---

## Prose scale ownership

`src/utils/proseClasses.ts` exports two scales. They are not a fork to be reconciled:

| Export | Consumers |
|---|---|
| `notePostProseClasses` | `NoteMain.astro` only — i.e. `/notes`, `/essays`, `/series` parts, `/playground` posts |
| `proseClasses` | `about.astro`, `live/index.astro`, `embed/works/[...slug].astro` |

`notePostProseClasses` carries the design's fixed roles (body 20/1.65, h2 40/1.1, h3 28/1.2) with a responsive step-down below `md`. `proseClasses` keeps the older responsive Tailwind ladder.

---

## Where a given style lives

| Concern | Home |
|---|---|
| Design tokens, palette, `.dark` overrides | `global.css` `@theme` + `@layer theme` |
| Shared card shell (`.card-shell`, `.card-band`, `.card-eyebrow`, `.card-collection-icon`) | `global.css` |
| Plain-markdown `blockquote` (kept at parity with `<Quote>`) | `global.css` |
| Prose roles | `proseClasses.ts` |
| Hero-specific layout | `NotePostHero.svelte` scoped `<style>` |
| MDX component internals | each component's own scoped `<style>` or Tailwind classes |

The collection glyphs reuse `.card-collection-icon` from `global.css` — one mask implementation, not a second one in the hero.

---

## Constraints that bite

- **Zero-JS components.** `Callout`, `SideNote`, `Quote` and `NotePostHero` are static Svelte with no `client:*` directive; they must stay that way. Verify with `grep -c '<astro-island' dist/notes/*/index.html`.
- **MDX registry.** Content files import nothing; `mdxComponents/map.ts` is the registry. A component reached through that map cannot carry a `client:*` directive (astro#5853).
- **`h1: 'h2'` remap** in `map.ts` is load-bearing — the layout already renders the page's one `<h1>`, and the integrity suite asserts it.
- **Never `class:some-tailwind-utility={cond}`** — Tailwind v4's scanner reads `class:` as a variant and emits no CSS. Use the object form.
