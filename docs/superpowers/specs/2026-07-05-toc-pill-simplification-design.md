# TOC Pill Simplification — Design

## Context
The floating table-of-contents pill (`src/components/toc/TocPill.astro` + `src/scripts/toc/`)
has been a recurring source of bugs (git history: multiple "toc pill unresponsiveness fix",
"refactored toc", "toc pill updated and refactor" commits). The root cause of the churn is
**over-engineering**: ~600 lines across 6 JS modules run a hand-managed GSAP timeline for the
open/close morph, with `killTweensOf`, `willChange` juggling, and `onComplete` cleanup — an
interrupted timeline can strand the pill in a half-morphed state. Most recently, the toggle
click handler sat behind a module-global once-gate, so it went dead after any view-transition
navigation (fixed separately).

Goal: **keep the look and feel, simplify the guts.** Reduce the bug surface by making the
browser own the animation (CSS) instead of JavaScript.

## Scope decisions (agreed with user)
- Keep the pill's appearance and the expand/collapse feel.
- Keep the odometer "roll" on the collapsed current-heading label.
- Keep scroll-spy highlighting, the timeline rail/slot dots, the iOS Safari two-layer
  backdrop-filter fix, and the auto-fade when the reader reaches related notes.

## Approach

### 1. Open/close animation → pure CSS
The toggle handler becomes a single attribute flip: `pill.toggleAttribute('data-expanded', open)`
(plus `aria-expanded` / `aria-hidden` for a11y). All motion moves to CSS transitions keyed off
`[data-toc-pill][data-expanded]`:
- **width**: `--toc-w-compact` ↔ `--toc-w-expanded` (custom props already exist), with a slight
  back-ease so the spring "feel" survives.
- **border-radius**: `9999px` ↔ `16px`.
- **panel height**: the `grid-template-rows: 0fr → 1fr` trick — the panel is `display:grid`, its
  single inner wrapper is `overflow:hidden; min-height:0`. No JS height measuring.
- **chevron**: `transform: rotate(0 → 180deg)`.
- **scale "breathe"**: a `motion-safe` CSS keyframe on the expanded state (composes with the
  existing `translateX(-50%)` centering).

Consequences in markup:
- Remove the inline `style="width: var(--toc-w-compact)"` (inline style can't transition; CSS base
  rule owns width instead).
- Replace the panel's `hidden` class with the grid setup; move `overflow-hidden min-h-0` onto the
  inner `.relative` wrapper. Gradient lines clip cleanly when collapsed (already invisible).

### 2. Six script files → two
Merge `index.ts` + `list.ts` + `scroll-spy.ts` into a single **`toc.ts`** (find pill/headings,
build list, scroll-spy highlight, wire toggle, related-notes fade, scroll-direction tracking).
**Delete** `morph.ts` (replaced by CSS) and `constants.ts` (GSAP timings gone; `TOC_BTN_CLASS`
moves into `toc.ts`; `reduceMotion` is a one-line media check where needed).

### 3. Odometer → Web Animations API
Rewrite `odometer.ts` using the built-in `element.animate()` (WAAPI) instead of GSAP — same
two-span slide (new enters from scroll direction, old exits opposite). This drops GSAP from the
TOC entirely while preserving the roll.

### Robustness carried over
- Toggle listener bound **per pill element** (dataset guard) so it survives view-transition
  navigations; global `window`/`document` listeners bound once.
- Reparent pill to `<body>` (one line) to escape transformed-ancestor stacking contexts.

## Resulting structure
- `src/scripts/toc/toc.ts` — orchestrator (~150 lines). `initTOC()` wired from `NoteMain.astro`.
- `src/scripts/toc/odometer.ts` — WAAPI roll.
- Deleted: `index.ts`, `morph.ts`, `list.ts`, `scroll-spy.ts`, `constants.ts`.
- `TocPill.astro` — markup tweaks + CSS transitions/keyframes for the morph.

`NoteMain.astro` import path changes from `'../scripts/toc'` to `'../scripts/toc/toc'`.

## Net effect
~600 lines / 6 files → ~250 lines / 2 files; GSAP out of the TOC; the animation can no longer
strand itself mid-morph (CSS transitions are self-healing).

## Verification
- `npm run build` passes.
- In-browser (dev server): expand/collapse works; scroll-spy highlights the current section;
  odometer rolls on section change; pill fades out at related notes; toggle still works **after
  navigating note→note** (the regression class we just fixed).
- Reduced-motion: no breathe/roll; instant state changes.
