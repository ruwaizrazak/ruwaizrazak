# Translate scoped CSS to Tailwind, and write the rule that keeps it translated

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
**Executor: Codex, GPT-5.6 Sol, high reasoning effort.**

---

## Context

The repo has 1,931 lines of scoped `<style>` across 26 component and layout files, against a fully-configured Tailwind v4 setup that is doing real work elsewhere (245 responsive variants, 68 `dark:`, 145 interaction variants, 242 token-derived colour utilities, 142 `prose-*` modifiers).

Measuring the 707 declarations inside those blocks against what Tailwind can express:

| | declarations | share |
|---|---|---|
| Plain utilities Tailwind has | 221 | 31% |
| Single-token `color-mix` / `var()` → `bg-token/N`, `font-sans`, `ease-snappy` | 295 | 42% |
| **Replaceable subtotal** | **517** | **73%** |
| Needs a selector Tailwind cannot write | 156 | 22% |
| Needs a property Tailwind has no utility for | 35 | 5% |
| plus 15 `@keyframes` blocks | — | — |

And tracking the total across recent commits shows where it came from:

```
1401  ← before the design imports
1401    navigation / dropdown work        (+0)
1748    "modified garden view"          (+347)   ← Card System import
1942    "Optimised notemain design"     (+194)   ← Note Post import
```

**39% of all scoped CSS in the repo was written in one day by two design imports.** `ContentCard.svelte` went from 21 style lines in its `.astro` predecessor, to 42 at the Svelte migration, to 237 after the Card System import.

The cause is mechanical, not architectural. A `.dc.html` canvas expresses everything as inline declarations (`font-size: 20px; line-height: 1.65; color: #1f4444`). Pasting those into a `<style>` block is faster than mapping each to a utility and deciding which values deserve tokens — and nothing in the guidelines said to map them. The same reflex produced 217 arbitrary-value utilities (`text-[20px]`, `max-w-[760px]`): where someone did reach for Tailwind, they pasted the raw number instead of tokenising it.

So this plan does two things, and **the rule matters more than the cleanup** — without it, the next design import adds another ~250 lines.

### Non-goals

- Tailwind is not being removed, and no scoped block that meets the bar below is being converted.
- **`TocPill.svelte` (556 lines, 22% replaceable) and `TocPillDemoView.svelte` (173 lines, 0% replaceable) are out of scope entirely.** They are `[data-*]` state machines with keyframes and scroll-driven animation — exactly what scoped CSS is for. Do not touch them.
- No visual change. This is a pure refactor; any pixel difference is a bug.

---

## Part A — the rule

Add to **`AGENTS.md`**, inside the existing "Design Implementation Guidelines (Claude Design imports)" section, and mirror a condensed version into **`CLAUDE.md`** under "Modularization Rules".

> ### Translate to utilities, don't transcribe declarations
>
> A `.dc.html` canvas expresses everything as inline CSS. Converting it means **mapping each declaration to its utility** — not pasting the declaration into a `<style>` block. Transcription is how a 21-line component style block became 237.
>
> **A scoped `<style>` block is justified only when a rule needs one of:**
>
> 1. **A selector Tailwind cannot write** — `:global()`, `[data-*]`, `>` / `+` / `~` combinators, `::before` / `::after`, `:has()`, `:only-of-type`, `:nth-*`
> 2. **A property Tailwind has no utility for** — `mask`, `clip-path`, `content`, `grid-template-areas`, `offset-path`, `transform-origin`, `font-variant-numeric`, `animation-timeline`, `will-change`
> 3. **`@keyframes`**
> 4. **A two-token `color-mix()`** — `color-mix(in srgb, var(--a) N%, var(--b))`. The one-token form `color-mix(in srgb, var(--token) N%, transparent)` **is** `bg-token/N`, so it does not qualify.
>
> Everything else is a utility. If a rule qualifies, put *only the qualifying declarations* in the block — do not let one `mask` drag twenty layout declarations in with it.
>
> **When a value has no utility and no token, add a token — do not reach for an arbitrary value or a `<style>` block.** A raw value repeated three or more times (`text-[15px]`, `tracking-[0.16em]`) is a missing `@theme` entry. A multi-declaration idiom repeated across files is a missing `@utility`.
>
> **Translation reference:**
>
> | Scoped CSS | Utility |
> |---|---|
> | `color-mix(in srgb, var(--color-syoro) 5%, transparent)` | `bg-syoro/5` |
> | `font-family: var(--font-sans)` | `font-sans` |
> | `transition-timing-function: var(--ease-snappy)` | `ease-snappy` |
> | `display:flex; flex-direction:column; gap:12px` | `flex flex-col gap-3` |
> | `@media (min-width: 768px) { … }` | `md:` |
> | `@media (prefers-reduced-motion: reduce)` | `motion-reduce:` |
> | `@media (hover:hover) and (pointer:fine)` | `hover:` — Tailwind v4 already compiles to `@media (hover: hover)` |
>
> **Two Tailwind-in-Svelte traps** that make people give up and write CSS — know them rather than avoiding the framework:
> - Never `class:some-tailwind-utility={cond}`. The v4 scanner reads `class:` as a variant and emits nothing. Use the object form: `class={['base', { 'translate-x-full': open }]}`.
> - Svelte renames `@keyframes` in a scoped block. If a Tailwind arbitrary utility references the name (`animate-[foo_1s]`), declare it `@keyframes -global-foo`.

---

## Part B — close the gaps the rule points at

Do this **before** the translation pass, so Part C has somewhere to put values.

### Add to `@theme` in `src/styles/global.css`

Driven by the arbitrary-value frequency count, not invented:

| Token | Value | Replaces |
|---|---|---|
| `--tracking-eyebrow` | `0.16em` | `tracking-[0.16em]` ×8 |
| `--tracking-meta` | `0.1em` | `tracking-[0.1em]` ×6 |
| `--text-eyebrow` | `15px` | `text-[15px]` ×6 |
| `--text-note` | `17px` | `text-[17px]` ×5 |
| `--text-micro` | `13px` | `text-[13px]` ×4 |
| `--leading-body` | `1.65` | `leading-[1.65]` ×5 |
| `--spacing-section` | `72px` | `pt-[72px]` ×4 |

Tailwind v4 generates `tracking-eyebrow`, `text-note`, `leading-body`, `pt-section` from these namespaces automatically. Confirm each utility actually emits before relying on it — the `--text-*` namespace also sets a paired line-height, so check that it does not override an explicit `leading-*`.

### Add one `@utility`

`ml-[calc(50%-50vw)]` (×8) with `max-w-[100vw]` (×6) and `w-screen` is the full-bleed breakout idiom, repeated at eight call sites:

```css
@utility full-bleed {
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
}
```

Three utilities and a `calc()` become one class. Used by `PageHero`, `notesPost.astro`'s `.note-main-wrapper`, `NotePostHero`, and the About page.

### Delete dead CSS, do not translate it

`src/pages/essays/index.astro` and `src/pages/notes/index.astro` each carry a `<style>` block defining `.masonry-grid` and `.break-inside-avoid`. Both classes appear **only in their own definitions** — zero usages in any markup. Delete both blocks outright.

---

## Part C — the translation pass

517 replaceable declarations, 75% of them in five files. Work in tiers, **one file per commit**, running the harness from the Verification section after each.

### Tier 1 — the design-import files (389 declarations)

| File | scoped lines | replaceable | must stay | expected after |
|---|---|---|---|---|
| `components/ContentCard.svelte` | 235 | 149 | 5 | ~25 |
| `components/NotePostHero.svelte` | 175 | 93 | 4 | ~20 |
| `components/WebmentionsView.svelte` | 161 | 88 | 1 | ~10 |
| `components/SeriesCard.svelte` | 83 | 38 | 7 | ~20 |
| `components/SeriesPostCard.svelte` | 32 | 21 | 0 | **0 — delete the block** |

`ContentCard` is the hardest and highest-value. What must stay: the `series-post-list` mask, the two-token `color-mix` on `.series-sheet` and `.card-band-note`, and anything selecting `:global()` or a child. Everything else — the flex columns, gaps, paddings, font sizes, the `@media (min-width: 768px)` block, the `prefers-reduced-motion` block — becomes utilities and variants.

`NotePostHero` is the clearest case of transcription: its 175 lines are padding ladders, font sizes and colours that the design expressed inline. Its `.hero-figure :global(picture|img)` rule **must stay** — that is the parent-scoping fix, and it is the one thing in the file Tailwind cannot do.

### Tier 2 — blocks that go to zero (≈70 declarations)

`mdxComponents/SideNote.svelte`, `NoteMain.astro`, `OtherWorksSectionView.svelte`, `garden/GardenCards.svelte`, `VideoBreakout.svelte`, `MaturityBadge.svelte`, `WorkCard.svelte`, `ui/ExternalLinkIcon.svelte`, `GardenPreviewView.svelte`, `pages/embed/works/[...slug].astro`.

Each is 100% replaceable and small. Delete the `<style>` block entirely once translated.

### Tier 3 — leave alone

`toc/TocPill.svelte`, `mdxComponents/TocPillDemoView.svelte`, `mdxComponents/LinkView.svelte` (25% replaceable), `garden/GardenStrip.svelte`, `SelectedWorksSection.svelte`, `IntroSectionView.svelte`, `layouts/WorkLayout.astro`, `layouts/notesPost.astro`.

These hold the 190 declarations and 15 `@keyframes` that meet the bar. Touching them is churn with regression risk and no payoff. **If a file in this tier has an obviously free win — a stray `display: flex` — leave it anyway.** Mixed-motive commits are what make a refactor unreviewable.

---

## Verification

A 517-declaration refactor with no intended visual change needs a mechanical net, not eyeballing. Build the harness first.

### The computed-style diff harness

Add `tests/tools/style-snapshot.mjs` (a tool, not a spec — keep it out of `tests/e2e/` so Playwright does not run it as a test):

1. Against a built `dist/` served by `npm run preview`, visit: `/garden/`, `/essays/deconstructionofcodm/`, `/notes/whythissite/`, `/works/01Farmville3/`, `/about/`, `/series/`, `/`.
2. For every element matching the card, hero, and section selectors the plan touches, record `getComputedStyle` for the ~40 properties in play — `display`, `flex-direction`, `gap`, `padding*`, `margin*`, `font-*`, `line-height`, `letter-spacing`, `color`, `background-color`, `border*`, `border-radius`, `aspect-ratio`, `transform`, `transition*`, `grid-template-*`, `max-width`, `min-height`.
3. Write JSON keyed by route + a stable element path.
4. Run at **three viewports (375 / 768 / 1280)** and in **both themes** — the media-query and `dark:` translations are exactly where this refactor will break, and a single desktop-light snapshot would miss all of it.

Capture a baseline on `main` before any translation. After each file, re-run and diff: **an empty diff is the pass condition.** A non-empty diff is either a bug or a deliberate improvement that must be called out in the commit message.

### Per-commit

```bash
npx vitest run tests/unit
npx playwright test tests/e2e/<the spec covering the touched component> --project=chromium
```

### Before opening the PR

```bash
npm run build
npx playwright test --project=chromium --project=webkit
```

The existing e2e suite is a real second net here: several specs already assert geometry rather than class names (`note-post.spec.ts` checks the hero's 16:7 ratio and the 760px measure; `about.spec.ts` checks the sticky rail and the two-column split), which is precisely the failure mode a CSS translation produces.

Also confirm the CSS bundle did not grow — translation should shrink it, since utilities dedupe across components while scoped blocks do not:

```bash
ls -la dist/_astro/*.css
```

---

## Files touched

| File | Change |
|---|---|
| `AGENTS.md` | the "translate, don't transcribe" rule + justified-`<style>` bar |
| `CLAUDE.md` | condensed mirror under Modularization Rules |
| `src/styles/global.css` | 7 `@theme` tokens, 1 `@utility full-bleed` |
| `src/components/ContentCard.svelte` | Tier 1 — 149 declarations translated |
| `src/components/NotePostHero.svelte` | Tier 1 — 93 |
| `src/components/WebmentionsView.svelte` | Tier 1 — 88 |
| `src/components/SeriesCard.svelte` | Tier 1 — 38 |
| `src/components/SeriesPostCard.svelte` | Tier 1 — 21, block deleted |
| 10 Tier 2 components | blocks deleted |
| `src/pages/{essays,notes}/index.astro` | dead `.masonry-grid` CSS deleted |
| ~8 files using the breakout idiom | → `full-bleed` |
| `tests/tools/style-snapshot.mjs` | **new** — the diff harness |

One file per commit. The harness diff goes in each commit message.

---

## Progress — handoff state (2026-09-13)

**Done and verified.** Final check: fresh pre-change baseline vs current, same harness both sides — **PASS, 22,578 elements, zero computed-style differences.** `note-post` + `garden` + `related-notes` e2e green (23/23). CSS bundle 156K -> 148K.

| | |
|---|---|
| Harness | `tests/tools/style-snapshot.mjs` — determinism proven three times; waits for fonts/images/animations rather than guessing a timeout |
| Part A | rule in `AGENTS.md` + `CLAUDE.md`, plus **7 traps** found during execution |
| Part B | 8 `@theme` tokens, `@utility full-bleed`, dead `.masonry-grid` CSS deleted |
| Tier 1 | `SeriesPostCard` 32->0, `SeriesCard` 83->18, `NotePostHero` 176->26, `ContentCard` 237->137 |

Scoped CSS: **1931 -> 1569 lines.**

### Revised estimate for ContentCard

The plan predicted ~25 lines; it landed at 137, and the gap is a real finding rather than a shortfall. `.card-shell`, `.card-band` and `.card-footer` are declared in `global.css` **outside any `@layer`**, so unlayered author styles beat every layered utility. Any variant overriding their padding, gap, border-style or border-colour therefore *cannot* be a utility. Every one of the 137 remaining lines maps to a documented reason: two-token `color-mix` (3 rules), `mask` (2), overrides of an unlayered global (4), per-property transitions with differing durations *and* easings (2), descendant selectors (the `md:` block), and `(hover: hover) and (pointer: fine)`, whose `pointer: fine` half Tailwind's `hover:` drops.

**Apply the same correction to the remaining estimates** — any file overriding a shared card class will retain more than the original table assumed.

### Remaining — 147 replaceable declarations

```
  82  components/WebmentionsView.svelte   <- descendant selectors over dynamic content
  15  mdxComponents/SideNote.svelte
  12  RelatedNotesView.svelte
  11  NoteMain.astro                      <- has an <img>: check the unlayered-rule trap
   8  garden/GardenCards.svelte
   5  OtherWorksSectionView.svelte
   3+3+3+2+2+1  VideoBreakout, MaturityBadge, embed/works, WorkCard,
                ui/ExternalLinkIcon, GardenPreviewView   <- all go to zero
```

### Per-file procedure

1. `npx astro preview --port 4399` (leave running).
2. `git stash push <file>` -> `npm run build` -> capture BASE -> `git stash pop` -> `npm run build`.
3. Translate. Keep hook classes. Check every rule against the justified-`<style>` bar.
4. Capture AFTER -> `--diff BASE AFTER`. **Empty diff is the pass condition.**
5. Run the e2e spec covering that component.
6. Commit one file at a time with the diff result in the message.
