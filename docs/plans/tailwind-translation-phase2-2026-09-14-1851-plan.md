# Tailwind translation, phase 2 — the remaining 147 declarations

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
**Executor: Codex, GPT-5.6 Sol, high reasoning effort.**

---

## Context

Phase 1 took scoped CSS from **1931 → 1569 lines** and translated four components (`ContentCard`, `NotePostHero`, `SeriesCard`, `SeriesPostCard`), verified at **zero computed-style difference** across 9 routes × 3 viewports × 2 themes. The rule — *translate to utilities, don't transcribe declarations* — is in `AGENTS.md` and `CLAUDE.md`.

**Read the seven traps in `AGENTS.md` before writing any code.** Each was found by the harness during phase 1, none is visible by eye, and every one of them will recur here.

147 replaceable declarations remain across 12 files.

### Correction 1 — 147 is an upper bound, not a target

The measuring script flags a declaration as "replaceable" when its rule has no hard selector and no un-utility-able property. It cannot see the *cascade*. ContentCard is the proof: the script called 149 declarations easy, and **59 of them are still there** — legitimately, because they override rules that Tailwind utilities cannot beat.

Expect the same here. **Do not chase the number.** A declaration that cannot be translated for a documented reason is a success, not a miss. Never reach for `!important` to force one.

### Correction 2 — the classifier's route coverage is not the harness's

A component that renders on no captured route yields a **vacuous PASS**. This already happened once in phase 1 (SeriesPostCard "passed" against seven routes, none of which rendered it). One file in this batch has the same problem and the harness must be extended before it is touched — see Phase 2.

### Decisions already made — do not re-litigate

1. **Fix the unlayered-rules root cause first**, as an isolated, harness-verified commit (Phase 1 below).
2. **Batch the 9 clean files into one commit**; give each of the 3 trap-carrying files its own.

---

## Phase 1 — move the unlayered element rules into `@layer base`

This is the root cause behind three of the seven traps, and it blocks translation in two of the files below.

`src/styles/global.css` declares eight element rules **outside any `@layer`**:

| line | selector |
|---|---|
| 242 | `textarea` |
| 247 | `input` |
| 251 | `table` |
| 255 | `img` |
| 261 | `code` |
| 267 | `pre` |
| 281 | `blockquote` |
| 345 | `hr` |

In the CSS cascade, unlayered author styles beat every layered one — so `img { height: auto }` defeats `size-3.5`, which then sets width but not height and the image renders at its intrinsic ratio. Tailwind lives entirely in layers, so **every utility loses to these eight rules.**

`global.css:12` already has an `@layer base { … }` block. Move all eight rules into a `@layer base` block (a second one, sited where they currently are, is fine and keeps the diff readable) so utilities win as everyone expects.

**This is a precedence change, not a style change**, and it is exactly what the harness exists to measure:

- Capture a baseline, make the move, capture again, diff.
- **An empty diff means nothing currently relies on those rules beating a utility** — commit it.
- **A non-empty diff names every site where precedence flips.** Read each one. Where the utility's value is the intended one, that is a latent bug this fixes — call it out explicitly in the commit message. Where it is not, restore that specific declaration with a scoped rule and note why.

Do not proceed to Phase 3 until this commit is in and its diff is understood. If the diff is large or surprising, stop and report rather than absorbing it.

---

## Phase 2 — extend the harness before translating

`src/pages/embed/works/[...slug].astro` renders on `/embed/works/<slug>/`, which **is not in the harness's route list**. Translating it against the current routes would produce a vacuous pass.

Add to `ROUTES` in `tests/tools/style-snapshot.mjs`, with a comment in the style of the existing ones explaining what it covers:

```js
'/embed/works/01Farmville3/',   // the embed layout — covered by no other route
```

Every other component in this batch is covered: `/` and `/about/` render `WorkCard` and `GardenPreviewView`; `/works/01Farmville3/` renders `VideoBreakout` and `OtherWorksSectionView` (via `WorkLayout`); `/garden/` renders `GardenCards`; `/essays/deconstructionofcodm/` renders `SideNote`; `RelatedNotesView`, `NoteMain` and `WebmentionsView` render on every note/essay/series route. **Verify this claim per file before trusting a PASS** — `grep` the built HTML for a class you just introduced.

---

## Phase 3 — the 9 clean files, one commit

No traps: no element selectors, no `card-*` overrides, no `@keyframes`, no `:global()`, no combinators. **Every one of these `<style>` blocks should end at zero lines.** If one does not, stop and work out why before forcing it.

| file | declarations |
|---|---|
| `mdxComponents/SideNote.svelte` | 15 |
| `garden/GardenCards.svelte` | 8 |
| `OtherWorksSectionView.svelte` | 5 |
| `VideoBreakout.svelte` | 3 |
| `MaturityBadge.svelte` | 3 |
| `pages/embed/works/[...slug].astro` | 3 |
| `WorkCard.svelte` | 2 |
| `ui/ExternalLinkIcon.svelte` | 2 |
| `GardenPreviewView.svelte` | 1 |

Two notes:

- **`embed/works/[...slug].astro`** styles bare `body`. Put the utilities on the `<body>` element itself. Tailwind's preflight already sets `body { margin: 0 }`, so only the background is load-bearing — confirm that with the harness rather than assuming.
- **`SideNote.svelte`** is the largest here and was itself written during a design import; it is pure transcription and should translate cleanly.

One harness cycle covers all nine. These files are independent, so a failing diff is easy to attribute by reverting one at a time.

---

## Phase 4 — the 3 trap-carrying files, one commit each

Each keeps a residue. Sizes below are *before* Phase 1, which may shrink the residue further.

### `WebmentionsView.svelte` — 82 declarations, the big one

Expect to keep roughly 25–30 lines:

- `.wm-avatar-slot img, .wm-avatar-slot svg` — one rule covering **two element types**, and `img` collides with the global `img` rule. After Phase 1 this may become translatable onto each element directly; check, do not assume.
- `.wm-reply + .wm-reply` — adjacent sibling combinator. Stays.
- `.wm-avatar-slot:first-child` — translatable as Tailwind's `first:` variant.
- `.wm-reply-meta:hover .wm-reply-author` — no media query wrapper, so this is a faithful `group/meta` + `group-hover/meta:` translation. (Contrast with ContentCard, where the same shape sat inside `(hover: hover) and (pointer: fine)` and had to stay.)
- `.wm-hidden` — check whether the markup can use the `hidden` attribute instead of a class.

### `RelatedNotesView.svelte` — 12 declarations

Carries a `@keyframes`, which stays. Translate everything around it, and leave only the keyframes plus whatever references it by name. If a Tailwind arbitrary utility ends up referencing the animation name, the keyframes must be declared `@keyframes -global-<name>` — Svelte renames scoped ones.

### `NoteMain.astro` — 11 declarations

The maturity-footer icon is an `<img>`, so this is gated on Phase 1. If the `img` rule moved cleanly, this file should go to zero; if not, the icon sizing stays in CSS exactly as it does in `NotePostHero`.

---

## Out of scope — do not touch

`TocPill.svelte`, `TocPillDemoView.svelte`, `LinkView.svelte`, `GardenStrip.svelte`, `SelectedWorksSection.svelte`, `IntroSectionView.svelte`, `WorkLayout.astro`, `notesPost.astro`.

The classifier reports 44 "easy" declarations across these. They are Tier 3 by deliberate choice — `[data-*]` state machines, keyframes and scroll-driven animation. **Leave them even where a free win exists.** Mixed-motive commits are what make a refactor unreviewable.

---

## Verification

The harness is the pass condition. It lives at `tests/tools/style-snapshot.mjs` and is already proven deterministic (three independent control runs). One capture is ~3.5 minutes.

```bash
npx astro preview --port 4399     # leave running
```

Per commit:

```bash
git stash push <files>
npm run build && node tests/tools/style-snapshot.mjs .style-snap/BASE http://localhost:4399
git stash pop
npm run build && node tests/tools/style-snapshot.mjs .style-snap/AFTER http://localhost:4399
node tests/tools/style-snapshot.mjs --diff .style-snap/BASE .style-snap/AFTER
```

**An empty diff is the pass condition** — except in Phase 1, where a non-empty diff is the expected output and must be read and explained. Put the diff result in every commit message.

Then the e2e specs covering the touched components:

```bash
npx playwright test tests/e2e/webmentions.spec.ts tests/e2e/related-notes.spec.ts \
  tests/e2e/note-post.spec.ts tests/e2e/garden.spec.ts --project=chromium
```

Before opening the PR:

```bash
npm run build
npx playwright test --project=chromium --project=webkit
ls -la dist/_astro/*.css      # should shrink; utilities dedupe, scoped blocks do not
```

**One known pre-existing failure:** `related-notes.spec.ts` "flags the slide transition" fails when run alongside `view-transitions.spec.ts` and passes alone. It was confirmed pre-existing in phase 1 (fails identically with all changes stashed) — the spec's own comment records the cause, a `nav-from-related` flag `ClientRouter` never clears. **Do not attempt to fix it inside this refactor.**

---

## Files touched

| File | Phase |
|---|---|
| `src/styles/global.css` | 1 — eight element rules into `@layer base` |
| `tests/tools/style-snapshot.mjs` | 2 — add the `/embed/works/` route |
| 9 components/pages listed above | 3 — blocks to zero, one commit |
| `WebmentionsView.svelte` | 4 — own commit |
| `RelatedNotesView.svelte` | 4 — own commit |
| `NoteMain.astro` | 4 — own commit |

Add `// LEARN:` comments per the repo conventions on anything that *stays* in a `<style>` block — the reason it survived the bar is the thing a future reader needs, and it is invisible from the CSS itself.

**Report back with:** the Phase 1 diff and what it revealed, the final scoped-CSS line count, which declarations were deliberately not translated and why, and any new trap worth adding to the seven in `AGENTS.md`.
