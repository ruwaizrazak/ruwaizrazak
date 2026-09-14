# Tailwind translation phase 2 — architecture

Companion to `tailwind-translation-phase2-2026-09-14-1851-plan.md`.

---

## The cascade — the one model that explains this whole refactor

```
unlayered author styles          <- global.css element rules; component <style> blocks
  beat everything below
@layer theme / base / components / utilities    <- ALL of Tailwind
```

Two consequences, both load-bearing:

1. **A bare element rule in `global.css` outranks every utility.** Eight of them exist (`textarea`, `input`, `table`, `img`, `code`, `pre`, `blockquote`, `hr`). Phase 2 moves them into `@layer base` so utilities win as everyone expects.
2. **Svelte's scoped rules are unlayered *and* specific**, which is why the pre-refactor CSS "just worked", and why a variant overriding `.card-shell` / `.card-band` / `.card-footer` — themselves unlayered — cannot become a utility.

After phase 2's first commit, only (2) remains.

## Styling ownership

| Concern | Home |
|---|---|
| Layout, spacing, colour, typography, responsive, state | Tailwind utilities |
| Design tokens + `.dark` overrides | `global.css` `@theme` / `@layer theme` |
| Repeated multi-declaration idioms | `@utility` (`full-bleed`) |
| Shared card shell | `global.css` (unlayered — see above) |
| Prose roles | `proseClasses.ts` (two exports, consumers named at the top) |
| Selectors/properties Tailwind cannot express, `@keyframes`, two-token `color-mix` | component-scoped `<style>` |

## Component → route coverage

A translation verified against a route that never renders the component is a vacuous pass. The mapping the harness relies on:

| Component | Covered by |
|---|---|
| `WebmentionsView`, `RelatedNotesView`, `NoteMain` | every note / essay / series route |
| `SideNote` | `/essays/deconstructionofcodm/` |
| `GardenCards` | `/garden/` |
| `WorkCard`, `GardenPreviewView` | `/` and `/about/` |
| `VideoBreakout`, `OtherWorksSectionView` | `/works/01Farmville3/` (the latter via `WorkLayout`) |
| `MaturityBadge` | any card route |
| `embed/works/[...slug]` | **nothing — route added in phase 2** |

## The harness

`tests/tools/style-snapshot.mjs` — a tool, not a spec, deliberately outside `tests/e2e/` so Playwright never collects it.

```
node tests/tools/style-snapshot.mjs <outDir> [baseURL]
node tests/tools/style-snapshot.mjs --diff <dirA> <dirB>
```

9 routes (10 after phase 2) x 3 viewports x 2 themes, ~23,000 elements, ~3.5 min per capture. Element identity is a **structural path** (tag + `nth-of-type`), never a class — classes are the thing being rewritten.

What makes it trustworthy:

- **Determinism was proven, not assumed** — three independent control runs diff clean. Getting there required excluding GSAP-driven subtrees and the TOC pill's perpetually-easing odometer, and waiting on fonts/images/animations rather than guessing a timeout.
- **Known-equivalent notations are normalised**, each verified pixel-identical on a canvas first: oklab vs srgb `color-mix` (identical when mixing with `transparent` — only alpha changes), `rounded-full` vs `999px`, and comma-repeated `transition-*` lists.
- **Coverage is checked, not assumed** — see the table above.

Pass condition is an empty diff, with one deliberate exception: the `@layer base` commit, where a non-empty diff is the expected output and the thing to read.
