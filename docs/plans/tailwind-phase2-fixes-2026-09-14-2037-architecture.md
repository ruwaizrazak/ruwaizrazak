# Phase 2 remediation — architecture

Companion to `tailwind-phase2-fixes-2026-09-14-2037-plan.md`.

---

## What the harness promises

`tests/tools/style-snapshot.mjs` answers exactly one question: **did this refactor change anything a browser renders?** Pass condition is an empty diff.

It is only worth as much as its false-positive rate. Every false positive trains the reader to wave diffs through — which is how a real regression eventually ships. So each normalisation must be *proven* equivalent before it is added, never assumed.

## The normalisation contract

Four normalisations exist. Each was verified before being trusted:

| Normalisation | Why it is safe |
|---|---|
| Colours resolved through a canvas | Tailwind's `bg-token/N` mixes in oklab; the hand-written CSS used `color-mix(in srgb, …)`. Mixing with `transparent` changes only alpha — **verified pixel-identical on a canvas**. |
| `border-radius ≥ 999px` → `pill` | `rounded-full` is `calc(infinity * 1px)` → 33554432px where the CSS said `999px`. Both are maximally round for any real element. |
| Repeated `transition-*` lists collapsed | `0.15s, 0.15s` across a two-entry property list is the same as `0.15s`. Requires a **depth-aware** split — see below. |
| Undecoded images → `__unloaded__` geometry | `naturalWidth === 0` means the resource never decoded. That is never a CSS effect. |

## Two failure modes, both now closed

**1. False positive from naive parsing.** `canonList` split on `,` to find repeats. CSS values contain commas *inside* function calls, so `cubic-bezier(0.33, 1, 0.68, 1)` was shredded into four fragments and identical values never collapsed. Fixed with a paren-depth-aware split.

The general lesson: **CSS values are a grammar, not a delimited string.** Any future normalisation that inspects a value must parse it.

**2. False positive from the network.** 54 remote images across the captured routes. An image that has not decoded measures 0×0, identical in the snapshot to an element that a regression collapsed. The tell was that the diffs appeared in some theme/viewport combinations and not others — **a real CSS change cannot be theme-dependent**. Fixed by sentinelling geometry when `naturalWidth === 0`, plus a 10s per-image budget.

Keep that tell in mind when reading any future failure: *systematic across all combos* means real; *asymmetric* means environmental.

## Determinism, and why it is re-proven after every harness change

Element identity is a structural path (tag + `nth-of-type`), never a class — classes are the thing being rewritten. GSAP-driven subtrees and the TOC pill's perpetually-easing odometer are excluded by ancestor, because they never settle. The capture waits on fonts, images and animations rather than guessing a timeout, after an earlier version made the captured element *set* non-deterministic.

**Any change to the harness invalidates existing baselines.** The protocol is: change it, then run it twice against an unchanged tree and diff those two runs against each other. A harness that cannot agree with itself cannot clear anything else — and widening a normalisation to force that green defeats the entire purpose.
