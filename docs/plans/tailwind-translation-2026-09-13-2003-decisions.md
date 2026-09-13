# Tailwind translation — decisions

Companion to `tailwind-translation-2026-09-13-2003-plan.md`.

---

## Why this, and not removing Tailwind

The trigger was noticing that Svelte files carry `<style>` blocks while the repo also runs Tailwind. Measuring first changed the answer.

Tailwind is load-bearing: 245 responsive variants, 68 `dark:`, 145 interaction variants, 242 token-derived colour utilities, 142 `prose-*` modifiers. And 73% of the 707 declarations inside scoped blocks are things Tailwind can express.

The growth is also one day old — `1401 -> 1748 -> 1942` lines across two design-import commits. That is a **process** problem (design canvases are inline CSS and get transcribed rather than translated), and removing Tailwind would have been treating it with an architecture migration. The rule is the fix; the cleanup is the backlog it created.

**Rejected: removing Tailwind for SCSS.** `@tailwindcss/typography` alone (142 `prose-*` modifiers over MDX output nobody authors) would have to be hand-written and maintained forever, and the utility layer's dead-code elimination would be lost.

---

## The justified-`<style>` bar

A block survives only for: a selector Tailwind cannot write, a property it has no utility for, `@keyframes`, or a **two-token** `color-mix()`. Everything else is a utility.

The one-token form `color-mix(in srgb, var(--token) N%, transparent)` deliberately does **not** qualify — it is exactly `bg-token/N`, and it accounted for most of the 42% "token math" bucket.

---

## Excluded on purpose

`TocPill.svelte` (556 lines, 22% replaceable) and `TocPillDemoView.svelte` (173 lines, **0%** replaceable) are `[data-*]` state machines with keyframes and scroll-driven animation — the case scoped CSS exists for. `LinkView` (25%), `GardenStrip`, `SelectedWorksSection`, `IntroSectionView` likewise.

Tier 3 files are not to be touched even where a free win exists. Mixed-motive commits make a 517-declaration refactor unreviewable.

---

## `full-bleed` sets `margin-left`, not `margin-inline`

The idiom at all eight call sites is `w-screen max-w-[100vw] ml-[calc(50%-50vw)]` — left only. `margin-inline` would also pull the right edge and change how the parent's remaining space is computed. The utility matches what the call sites actually do.

---

## Three findings that changed the work

**1. A passing diff can be vacuous.** The first SeriesPostCard translation "passed" against seven routes — none of which render SeriesPostCard. It appears only on series detail pages and on series parts via RelatedNotes. Two routes were added and the baseline recaptured. *Every component the refactor touches must appear on at least one captured route; verify before trusting a PASS.*

**2. Two notations are false alarms; two are real.** Verified by rendering to canvas: `color-mix(in oklab, …)` (what `bg-token/N` emits) and `color-mix(in srgb, …)` produce **identical pixels** when mixing with `transparent`, because only alpha changes. Same for `rounded-full` (`calc(infinity*1px)`) vs `999px`. Both are normalised in the harness. But `text-sm` carries a paired `line-height` the original CSS did not, and `auto-rows-fr` is `minmax(0,1fr)` where the CSS said `1fr` — both real, both caught only by the diff.

**3. Unlayered element rules in `global.css` beat every utility.** `img`, `table`, `code`, `blockquote` and `hr` are declared outside any `@layer`, and unlayered author styles win over layered ones. So `img { height: auto }` defeats `size-3.5` — width applies, height does not, and the image renders at its intrinsic ratio. The escape is a scoped descendant selector. Moving those rules into `@layer base` is the real fix but changes `img` precedence site-wide, so it needs its own plan.

---

## Hook classes are not styles

`.hero-meta-row`, `.hero-eyebrow`, `.hero-maturity-pill` etc. carry no styling after translation but remain on the elements: the e2e suite uses them as locators, and `.p-name` / `.dt-published` / `.h-entry` are microformats markers webmention parsers read. Stripping styling must not strip semantics.
