# Phase 2 remediation — fix the harness, then land phases 2–3 on real evidence

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
**Executor: Codex, GPT-5.6 Sol, high reasoning effort.**
Follows the audit of `53413a9` and the uncommitted phase 2–3 work.

---

## Context

An audit of the phase 2 work found the translation itself is correct, and the verification around it is not trustworthy yet.

**State:** phase 1 (`@layer base`) is committed as `53413a9`. Phases 2 (embed route) and 3 (the 9 clean files, all now at **0 style lines**) are done but **uncommitted**. Phase 4 has not started. Scoped CSS is **1931 → 1476**.

**The last recorded verification run FAILED with 28 differences**, which is why phase 3 is still uncommitted. All 28 were investigated and **none is a regression**:

- **12 are a harness defect.** `canonList` collapses repeated comma-separated `transition-*` values by splitting on `,` — which shreds `cubic-bezier(0.33, 1, 0.68, 1)` at its *internal* commas, so identical values never collapse. `cubic-bezier(…), cubic-bezier(…)` across two properties and a single `cubic-bezier(…)` are functionally identical. **4,254 captured elements carry a timing function with internal commas**, so this misfires broadly and will keep firing.
- **16 are network flake.** `picture`/`img` measured at 0×0 on `/embed/works/…` in `1280/dark`, `768/dark` and `768/light`, but **not** in `1280/light`, `375/dark` or `375/light`. A CSS change cannot be theme-dependent; these are imgur images that had not decoded. 54 remote images sit across the captured routes.

**Two smaller findings:**

- `OtherWorksSectionView.svelte` was edited at 19:59, **after** the 19:58 verification snapshot. The current tree is unverified regardless of the above.
- `src/pages/embed/works/[...slug].astro` had its `<style>` **deleted** rather than translated. `<body>` already carried `bg-backgroundcolor` and preflight covers `margin: 0`, so this is probably a no-op — but it drops the `var(--color-backgroundcolor, #fafafa)` fallback and is not what the plan asked for.

**One audit-trail gap:** `53413a9`'s message asserts "312 intended utility wins" with no evidence. The claim is **correct** — independently verified, see the decisions file — but nothing in the history would have revealed it had it been wrong.

### Decision already made — do not re-litigate

**Undecoded images get a sentinel, not a network stub.** Raise the per-image budget and, where `naturalWidth === 0`, record `__unloaded__` in place of measured geometry. A CSS regression never changes `naturalWidth`, so this removes the false positive without blinding the harness to a genuine 0×0. Stubbing at the network layer was rejected: it would make layout reflect the stub's aspect ratio rather than the real image, and `SideBySideView` / `WorkImageGrid` are exactly the components whose behaviour depends on true ratios.

---

## Fix 1 — `canonList` must split on top-level commas only

`tests/tools/style-snapshot.mjs`. Replace the naive `v.split(',')` with a depth-aware split that ignores commas inside parentheses:

```js
const splitTop = (v) => {
  const out = []; let depth = 0, cur = '';
  for (const ch of v) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
};
```

Keep `canonList` applied to `transition-duration` and `transition-timing-function` only. **Do not extend it to `transition-property`** — those lists are genuinely distinct values, not repeats, and collapsing them would hide real changes.

Add a `// LEARN:` note recording why the naive split was wrong; it looks correct until a value contains a function call.

## Fix 2 — undecoded images must not read as geometry changes

Same file, in the capture step:

- Raise the per-image load budget from **5s to 10s**.
- In the page-evaluate, for each `<img>` (and any element whose only child is one), detect `!img.complete || img.naturalWidth === 0` and emit the literal `__unloaded__` for the geometry properties (`width`, `height`, `transform-origin`) instead of the measured values. Both sides then compare equal when an image simply did not arrive.
- Leave every other property recorded normally.

This is deliberately narrow: `naturalWidth` is a property of the decoded resource, never of CSS, so it discriminates a failed fetch from a styling regression exactly.

## Fix 3 — prove the harness is clean again

Two control runs against an unchanged tree, diffed against each other:

```bash
npx astro preview --port 4399                       # leave running
npm run build
node tests/tools/style-snapshot.mjs .style-snap/ctl1 http://localhost:4399
node tests/tools/style-snapshot.mjs .style-snap/ctl2 http://localhost:4399
node tests/tools/style-snapshot.mjs --diff .style-snap/ctl1 .style-snap/ctl2
```

**PASS is required before any of the remaining fixes are verified.** A harness that cannot agree with itself cannot clear anything else. If it still fails, report the residue rather than proceeding — do not widen the normalisations to make it green.

## Fix 4 — restore the embed page's intent

`src/pages/embed/works/[...slug].astro`. Put the deleted declarations on `<body>` as utilities rather than relying on preflight implicitly, so the intent stays legible:

```html
<body class="m-0 bg-backgroundcolor p-0">
```

If the harness then shows any difference on `/embed/works/01Farmville3/`, the original rule was load-bearing in a way this analysis missed — report it instead of absorbing it.

## Fix 5 — re-verify and commit phases 2–3

`OtherWorksSectionView.svelte` changed after the last snapshot, so the whole batch needs a fresh cycle:

```bash
git stash push tests/tools/style-snapshot.mjs src/components/GardenPreviewView.svelte \
  src/components/MaturityBadge.svelte src/components/OtherWorksSectionView.svelte \
  src/components/VideoBreakout.svelte src/components/WorkCard.svelte \
  src/components/garden/GardenCards.svelte src/components/mdxComponents/SideNote.svelte \
  src/components/ui/ExternalLinkIcon.svelte "src/pages/embed/works/[...slug].astro"
npm run build && node tests/tools/style-snapshot.mjs .style-snap/p23-base http://localhost:4399
git stash pop
npm run build && node tests/tools/style-snapshot.mjs .style-snap/p23-after http://localhost:4399
node tests/tools/style-snapshot.mjs --diff .style-snap/p23-base .style-snap/p23-after
```

Note the harness fixes must be present in **both** captures — stash it with the batch so the baseline uses the same code, or the comparison is meaningless.

**Empty diff is the pass condition.** Then commit phases 2–3 as one commit, with the diff result in the message.

While translating, double-check one thing Codex introduced: `OtherWorksSectionView` now uses `transform-[translateY(24px)_scale(0.92)]`. Tailwind v4 emits `translate` / `scale` as **individual** properties, and a `transform` arbitrary stacks on top of them — harmless here because no `translate-*` or `scale-*` utility is on that element, but it must stay that way. Prefer `translate-y-*` + `scale-*` utilities if they produce an identical computed value.

## Fix 6 — close the audit-trail gap on `53413a9`

**Do not amend the commit.** It is already on `main`; rewriting shared history to improve a message is not worth it.

Instead record the verified breakdown in the decisions file, so the claim is checkable:

| count | property | cause | verdict |
|---|---|---|---|
| ~210 | `height` | card-band images on `/garden`, `/`, `/series` converging to 195.078px — `aspect-ratio: 16/10` + `h-full object-cover` finally beating `height: auto` | fix; images were not filling their bands |
| 72 | `max-width` | `SideBySideView.svelte:32` `max-w-lg`; `WorkImageGrid` `max-w-[min(80%,48rem)]` | fix; both were authored and overridden |
| 36 | `border-radius` | `/about` ledger logo `<img class="rounded-none">` inside `overflow-hidden rounded-[10px]` | intended; visually a no-op, parent clips |
| 44 | `transform` | float noise downstream of the above | noise |

All 312 are on `<img>`. Every group traces to an explicitly-authored utility the unlayered rule had been defeating.

---

## Out of scope

**Phase 4** (`WebmentionsView` 161 lines, `RelatedNotesView` 42, `NoteMain` 19 — 222 lines, the bulk of what remains) resumes under the existing `tailwind-translation-phase2-2026-09-14-1851-plan.md` once phases 2–3 are committed. Do not start it here; this plan exists to make its verification trustworthy first.

Tier 3 files remain untouched.

---

## Verification

Fixes 1–2 are proven by Fix 3's control run. Fixes 4–5 are proven by the phase 2–3 diff.

Then the e2e specs covering the touched components:

```bash
npx playwright test tests/e2e/garden.spec.ts tests/e2e/note-post.spec.ts \
  tests/e2e/smoke.spec.ts --project=chromium
```

**Known pre-existing failure — do not fix here:** `related-notes.spec.ts` "flags the slide transition" fails alongside `view-transitions.spec.ts` and passes alone. Confirmed pre-existing (fails identically with all changes stashed); the spec's own comment records the cause.

Before finishing:

```bash
npm run build
ls -la dist/_astro/*.css      # should shrink
```

---

## Files touched

| File | Fix |
|---|---|
| `tests/tools/style-snapshot.mjs` | 1 — top-level comma split; 2 — image budget + `__unloaded__` sentinel |
| `src/pages/embed/works/[...slug].astro` | 4 — utilities on `<body>` |
| `src/components/OtherWorksSectionView.svelte` | 5 — re-check the `transform-[…]` arbitrary |
| the other 8 phase-3 files | 5 — re-verified, unchanged |
| `docs/plans/tailwind-phase2-fixes-…-decisions.md` | 6 — the 312 breakdown |

**Report back with:** the control-run result, the phase 2–3 diff, and whether Fix 4 moved anything on the embed route.
