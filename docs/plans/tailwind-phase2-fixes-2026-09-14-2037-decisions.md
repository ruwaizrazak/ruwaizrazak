# Phase 2 remediation — decisions

Companion to `tailwind-phase2-fixes-2026-09-14-2037-plan.md`.

---

## Undecoded images get a sentinel, not a network stub

**Decision.** Raise the per-image load budget to 10s and, where `naturalWidth === 0`, record `__unloaded__` in place of the measured `width` / `height` / `transform-origin`.

**The problem.** A remote image that has not decoded measures 0×0, which is indistinguishable from a CSS regression. It produced 16 phantom diffs on `/embed/works/01Farmville3/` — present in `1280/dark`, `768/dark` and `768/light`, absent in `1280/light`, `375/dark` and `375/light`. **A real CSS change cannot be theme-dependent**, which is what identified it as flake rather than breakage. 54 imgur URLs sit across the captured routes.

**Why this discriminator.** `naturalWidth` is a property of the decoded resource and is never affected by CSS. So it separates "the fetch failed" from "the styling changed" exactly, rather than probabilistically. Geometry is sentinelled; every other property is still recorded, so a genuine colour or border change on an unloaded image is still caught.

**Rejected: stub `i.imgur.com` at the network layer.** Fully deterministic and faster, but layout would then reflect the stub's aspect ratio instead of the real image — and `SideBySideView` and `WorkImageGrid`, the two components whose behaviour this refactor most affects, are precisely the ones that depend on true ratios.

**Rejected: drop the imgur-heavy routes.** Removes the flake by removing the coverage. The CODM essay and the embed work page are where `SideBySide` and `WorkImageGrid` render at all.

---

## `canonList` had to parse, not split

The old normalisation collapsed repeated comma-separated `transition-*` values with `v.split(',')`. That is correct until a value contains a function call: it shreds `cubic-bezier(0.33, 1, 0.68, 1)` at its internal commas, so two identical timing functions never compare equal. **4,254 captured elements carry a timing function with internal commas**, so the defect was broad — it only surfaced as a diff when one side had a repeated list and the other a single value.

Replaced with a depth-aware split that ignores commas inside parentheses.

**Scope deliberately unchanged:** applied to `transition-duration` and `transition-timing-function` only. `transition-property` entries are genuinely distinct values, not repeats, and collapsing them would hide real changes.

---

## `53413a9` is not amended

Its message — "312 intended utility wins" — asserts a conclusion with no evidence, where the plan asked for each precedence flip to be read and called out. The claim is nonetheless **correct**; it was verified independently after the fact.

**Decision.** Record the breakdown here rather than rewriting a commit that is already on `main`. Improving a message is not worth rewriting shared history.

All 312 differences are on `<img>` elements. Every group traces to an explicitly-authored utility that the unlayered `img` rule had been silently defeating:

| count | property | cause | verdict |
|---|---|---|---|
| ~210 | `height` | card-band images on `/garden`, `/`, `/series` converging to a uniform 195.078px — `aspect-ratio: 16/10` + `h-full object-cover` finally beating `height: auto` | **fix.** Card images were not filling their bands |
| 72 | `max-width` | `SideBySideView.svelte:32` writes `max-w-lg`; `WorkImageGrid` writes `max-w-[min(80%,48rem)]` | **fix.** Both were authored and overridden |
| 36 | `border-radius` | `/about` ledger logo `<img class="rounded-none">` inside a parent with `overflow-hidden rounded-[10px]` | **intended**, and visually a no-op — the parent clips |
| 44 | `transform` | float noise downstream of the above | noise |

The lesson for future work: a verification claim in a commit message is only as good as the evidence beside it. Where a diff is expected to be non-empty, the breakdown belongs in the history or the docs, not in the author's head.

---

## The embed page keeps its intent explicit

`src/pages/embed/works/[...slug].astro` had its page-level `<style>` deleted rather than translated. `<body>` already carried `bg-backgroundcolor` and Tailwind's preflight zeroes body margin, so the deletion was probably a no-op — but it relied on a reset that could change, and dropped the `var(--color-backgroundcolor, #fafafa)` fallback.

Restored as `class="m-0 bg-backgroundcolor p-0"`. If the harness shows any movement on that route, the original rule was load-bearing in a way this analysis missed.
